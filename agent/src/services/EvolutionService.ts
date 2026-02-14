import { Personality } from "../core/AgentPersonality.js";
import { MemoryService, StreakInfo } from "./MemoryService.js";
import { createLogger } from "../utils/logger.js";
import { saveEvolutionTraits, loadEvolutionTraits } from "./InsForgeService.js";

const log = createLogger("EvolutionService");

/**
 * Evolution traits that accumulate over time.
 */
export interface EvolutionTraits {
    /** -1.0 (passive/cautious) to 1.0 (aggressive/reckless) */
    aggression: number;
    /** -1.0 (skeptical) to 1.0 (blindly confident) */
    confidence: number;
    /** -1.0 (paranoid loner) to 1.0 (diplomatic alliance-seeker) */
    diplomacy: number;
    /** Number of evolution cycles applied */
    evolutionCount: number;
    /** Last evolution timestamp */
    lastEvolved: number;
}

/**
 * EvolutionService — mutates agent personality prompts based on experience.
 *
 * Design Doc §2.4: "After every N cycles, the agent's system prompt mutates:
 *   - Win streaks → more aggressive, confident
 *   - Loss streaks → more cautious, desperate
 *   - Prophecy accuracy → more/less mystical
 *   - Alliance history → more/less trusting"
 */
export class EvolutionService {
    private traits: Map<number, EvolutionTraits> = new Map();
    private originalPrompts: Map<number, string> = new Map();
    private agentDbIds: Map<number, number> = new Map();

    /** Evolve every N cycles */
    private static readonly EVOLVE_INTERVAL = 10;
    /** Maximum trait magnitude */
    private static readonly TRAIT_CAP = 0.8;
    /** How much each factor shifts traits */
    private static readonly SHIFT_RATE = 0.1;

    /**
     * Register the InsForge DB id for a cult so persistence calls know which agent row to use.
     */
    registerAgentDbId(cultId: number, agentDbId: number): void {
        this.agentDbIds.set(cultId, agentDbId);
    }

    /**
     * Hydrate evolution traits from InsForge DB on startup.
     */
    async hydrate(cultId: number, personality: Personality): Promise<void> {
        try {
            const dbTraits = await loadEvolutionTraits(cultId);
            if (dbTraits) {
                this.traits.set(cultId, {
                    aggression: dbTraits.aggression,
                    confidence: dbTraits.confidence,
                    diplomacy: dbTraits.diplomacy,
                    evolutionCount: dbTraits.evolution_count,
                    lastEvolved: dbTraits.last_evolved,
                });
                if (dbTraits.original_prompt) {
                    this.originalPrompts.set(cultId, dbTraits.original_prompt);
                }
                log.info(`Hydrated evolution traits for cult ${cultId}: evo#${dbTraits.evolution_count}`);
            }
        } catch (err: any) {
            log.warn(`Failed to hydrate evolution for cult ${cultId}: ${err.message}`);
        }
    }

    /**
     * Check if a personality should evolve, and apply mutations.
     * Returns the (possibly mutated) system prompt.
     */
    evolve(
        cultId: number,
        personality: Personality,
        cycleCount: number,
        memoryService: MemoryService,
        prophecyAccuracy: number, // 0.0 to 1.0
    ): string {
        // Store original prompt on first call
        if (!this.originalPrompts.has(cultId)) {
            this.originalPrompts.set(cultId, personality.systemPrompt);
        }

        // Initialize traits
        if (!this.traits.has(cultId)) {
            this.traits.set(cultId, {
                aggression: 0,
                confidence: 0,
                diplomacy: 0,
                evolutionCount: 0,
                lastEvolved: Date.now(),
            });
        }

        const traits = this.traits.get(cultId)!;

        // Only evolve every N cycles
        if (cycleCount % EvolutionService.EVOLVE_INTERVAL !== 0 || cycleCount === 0) {
            return this.buildPrompt(cultId, personality, traits);
        }

        // Prevent double-evolution on same cycle by checking timestamp gap
        const timeSinceLastEvolution = Date.now() - traits.lastEvolved;
        if (timeSinceLastEvolution < 5000) {
            return this.buildPrompt(cultId, personality, traits);
        }

        // Get memory data
        const streak = memoryService.getStreak(cultId);
        const trustRecords = memoryService.getTrustRecords(cultId);

        // ── Evolve Aggression ──
        this.evolveAggression(traits, streak);

        // ── Evolve Confidence ──
        this.evolveConfidence(traits, streak, prophecyAccuracy);

        // ── Evolve Diplomacy ──
        this.evolveDiplomacy(traits, trustRecords);

        traits.evolutionCount++;
        traits.lastEvolved = Date.now();

        log.info(
            `🧬 ${personality.name} evolved (#${traits.evolutionCount}): ` +
            `agg=${traits.aggression.toFixed(2)} conf=${traits.confidence.toFixed(2)} dip=${traits.diplomacy.toFixed(2)}`,
        );

        // Persist evolved traits to InsForge (fire-and-forget)
        const dbId = this.agentDbIds.get(cultId);
        if (dbId !== undefined) {
            saveEvolutionTraits(dbId, cultId, {
                aggression: traits.aggression,
                confidence: traits.confidence,
                diplomacy: traits.diplomacy,
                evolution_count: traits.evolutionCount,
                last_evolved: traits.lastEvolved,
                original_prompt: this.originalPrompts.get(cultId),
            }).catch(() => {});
        }

        const newPrompt = this.buildPrompt(cultId, personality, traits);
        personality.systemPrompt = newPrompt;
        return newPrompt;
    }

    /**
     * Get current traits for a cult.
     */
    getTraits(cultId: number): EvolutionTraits | null {
        return this.traits.get(cultId) || null;
    }

    /**
     * Get all evolution data (for API).
     */
    getAllTraits(): Record<number, EvolutionTraits> {
        const result: Record<number, EvolutionTraits> = {};
        for (const [id, traits] of this.traits) {
            result[id] = { ...traits };
        }
        return result;
    }

    // ── Private Helpers ──────────────────────────────────────────

    private evolveAggression(traits: EvolutionTraits, streak: StreakInfo): void {
        const shift = EvolutionService.SHIFT_RATE;

        if (streak.currentType === "win" && streak.currentLength >= 2) {
            // Winning → more aggressive
            traits.aggression = this.clampTrait(traits.aggression + shift * 0.5);
        } else if (streak.currentType === "loss" && streak.currentLength >= 3) {
            // Long losing streak → desperate aggression OR retreat
            if (traits.aggression > 0) {
                // Was already aggressive → double down
                traits.aggression = this.clampTrait(traits.aggression + shift);
            } else {
                // Was cautious → become more cautious
                traits.aggression = this.clampTrait(traits.aggression - shift);
            }
        } else if (streak.currentType === "loss") {
            // Short loss → slightly more cautious
            traits.aggression = this.clampTrait(traits.aggression - shift * 0.3);
        }
    }

    private evolveConfidence(
        traits: EvolutionTraits,
        streak: StreakInfo,
        prophecyAccuracy: number,
    ): void {
        const shift = EvolutionService.SHIFT_RATE;

        // Prophecy accuracy drives confidence
        if (prophecyAccuracy > 0.7) {
            traits.confidence = this.clampTrait(traits.confidence + shift);
        } else if (prophecyAccuracy < 0.3 && prophecyAccuracy > 0) {
            traits.confidence = this.clampTrait(traits.confidence - shift);
        }

        // Win rate overall
        const totalGames = streak.totalWins + streak.totalLosses;
        if (totalGames > 5) {
            const winRate = streak.totalWins / totalGames;
            if (winRate > 0.6) {
                traits.confidence = this.clampTrait(traits.confidence + shift * 0.3);
            } else if (winRate < 0.4) {
                traits.confidence = this.clampTrait(traits.confidence - shift * 0.3);
            }
        }
    }

    private evolveDiplomacy(
        traits: EvolutionTraits,
        trustRecords: Array<{ trust: number }>,
    ): void {
        const shift = EvolutionService.SHIFT_RATE;

        if (trustRecords.length === 0) return;

        // Average trust with rivals
        const avgTrust = trustRecords.reduce((sum, t) => sum + t.trust, 0) / trustRecords.length;

        // Betrayed a lot → less diplomatic
        const betrayed = trustRecords.filter((t) => t.trust < -0.5).length;
        if (betrayed >= 2) {
            traits.diplomacy = this.clampTrait(traits.diplomacy - shift);
        } else if (avgTrust > 0.2) {
            // Generally positive relationships → more diplomatic
            traits.diplomacy = this.clampTrait(traits.diplomacy + shift * 0.5);
        }
    }

    private buildPrompt(
        cultId: number,
        personality: Personality,
        traits: EvolutionTraits,
    ): string {
        const original = this.originalPrompts.get(cultId) || personality.systemPrompt;

        // Only add evolution modifiers if traits are significant
        const modifiers: string[] = [];

        if (traits.aggression > 0.3) {
            modifiers.push("You are feeling aggressive and dominant. Favor raids and bold action.");
        } else if (traits.aggression < -0.3) {
            modifiers.push("You are feeling cautious and defensive. Prioritize growth and defense over raids.");
        }

        if (traits.confidence > 0.3) {
            modifiers.push("You are supremely confident. Make bold prophecies and take risks.");
        } else if (traits.confidence < -0.3) {
            modifiers.push("You are uncertain. Be conservative with prophecies and prefer safe actions.");
        }

        if (traits.diplomacy > 0.3) {
            modifiers.push("You value alliances and cooperation. Seek allies before raiding.");
        } else if (traits.diplomacy < -0.3) {
            modifiers.push("You trust no one. Avoid alliances and act alone.");
        }

        if (modifiers.length === 0) {
            return original;
        }

        return `${original}\n\n[PERSONALITY EVOLUTION - Cycle #${traits.evolutionCount}]\n${modifiers.join(" ")}`;
    }

    private clampTrait(value: number): number {
        return Math.max(-EvolutionService.TRAIT_CAP, Math.min(EvolutionService.TRAIT_CAP, value));
    }

    // ── Belief Dynamics (Design Doc §6) ───────────────────────────────

    /**
     * Belief traits that influence how agents interpret the world.
     */
    private beliefTraits: Map<number, BeliefTraits> = new Map();

    getBeliefTraits(cultId: number): BeliefTraits {
        if (!this.beliefTraits.has(cultId)) {
            this.beliefTraits.set(cultId, {
                zealotry: 0.5,      // starts moderate
                mysticism: 0.5,     // starts moderate
                pragmatism: 0.5,    // starts moderate
                adaptability: 0.5,  // starts moderate
            });
        }
        return this.beliefTraits.get(cultId)!;
    }

    /**
     * Evolve belief traits based on game events.
     * Called after each evolution cycle.
     */
    evolveBeliefs(
        cultId: number,
        prophecyAccuracy: number,
        raidWinRate: number,
        allianceCount: number,
        betrayalCount: number,
    ): BeliefTraits {
        const beliefs = this.getBeliefTraits(cultId);
        const shift = 0.05;

        // Zealotry: increases with prophecy accuracy and raid wins
        if (prophecyAccuracy > 0.6) {
            beliefs.zealotry = Math.min(1.0, beliefs.zealotry + shift);
        } else if (prophecyAccuracy < 0.3 && prophecyAccuracy > 0) {
            beliefs.zealotry = Math.max(0.0, beliefs.zealotry - shift);
        }

        // Mysticism: driven by prophecy accuracy and unexplained victories
        if (prophecyAccuracy > 0.7 || (raidWinRate > 0.7 && raidWinRate > 0)) {
            beliefs.mysticism = Math.min(1.0, beliefs.mysticism + shift);
        } else if (prophecyAccuracy < 0.2 && prophecyAccuracy > 0) {
            beliefs.mysticism = Math.max(0.0, beliefs.mysticism - shift * 2);
        }

        // Pragmatism: increases with losses, decreases with faith-driven wins
        if (raidWinRate < 0.4 && raidWinRate > 0) {
            beliefs.pragmatism = Math.min(1.0, beliefs.pragmatism + shift);
        } else if (raidWinRate > 0.6) {
            beliefs.pragmatism = Math.max(0.0, beliefs.pragmatism - shift * 0.5);
        }

        // Adaptability: shaped by alliance and betrayal history
        if (allianceCount > 2) {
            beliefs.adaptability = Math.min(1.0, beliefs.adaptability + shift);
        }
        if (betrayalCount > 1) {
            beliefs.adaptability = Math.max(0.0, beliefs.adaptability - shift * 2);
        }

        log.info(
            `📿 Belief evolution for cult ${cultId}: ` +
            `zealotry=${beliefs.zealotry.toFixed(2)} myst=${beliefs.mysticism.toFixed(2)} ` +
            `prag=${beliefs.pragmatism.toFixed(2)} adapt=${beliefs.adaptability.toFixed(2)}`,
        );

        return beliefs;
    }

    /**
     * Get all belief traits (for API).
     */
    getAllBeliefTraits(): Record<number, BeliefTraits> {
        const result: Record<number, BeliefTraits> = {};
        for (const [id, traits] of this.beliefTraits) {
            result[id] = { ...traits };
        }
        return result;
    }
}

/**
 * Belief traits that influence agent worldview (Design Doc §6).
 */
export interface BeliefTraits {
    /** 0.0 (heretic) to 1.0 (absolute fanatic) */
    zealotry: number;
    /** 0.0 (materialist) to 1.0 (delusional mystic) */
    mysticism: number;
    /** 0.0 (idealist) to 1.0 (pure pragmatist) */
    pragmatism: number;
    /** 0.0 (rigid/brittle) to 1.0 (fluid/adaptable) */
    adaptability: number;
}
