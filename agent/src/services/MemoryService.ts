import { createLogger } from "../utils/logger.js";
import {
    saveMemoryEntry, loadMemories,
    saveTrustRecord, loadTrustRecords,
    saveStreak, loadStreak,
} from "./InsForgeService.js";

const log = createLogger("MemoryService");

/**
 * A single interaction record between two cults.
 */
export interface MemoryEntry {
    type: "raid_won" | "raid_lost" | "persuasion_success" | "persuasion_fail" | "alliance_formed" | "alliance_broken" | "betrayal" | "governance_vote";
    rivalCultId: number;
    rivalCultName: string;
    description: string;
    timestamp: number;
    /** Numeric outcome (-1.0 to 1.0): positive = good for us, negative = bad */
    outcome: number;
}

/**
 * Trust score for a specific rival cult.
 */
export interface TrustRecord {
    cultId: number;
    cultName: string;
    /** Current trust: -1.0 (mortal enemy) to 1.0 (trusted ally) */
    trust: number;
    /** Total interactions recorded */
    interactionCount: number;
    /** Exponential moving average of recent outcomes */
    recentTrend: number;
}

/**
 * Win/loss streak tracker.
 */
export interface StreakInfo {
    currentType: "win" | "loss" | "none";
    currentLength: number;
    longestWinStreak: number;
    longestLossStreak: number;
    totalWins: number;
    totalLosses: number;
}

/**
 * Full memory snapshot for a cult, used as LLM context.
 */
export interface MemorySnapshot {
    recentInteractions: MemoryEntry[];
    trustedRivals: TrustRecord[];
    distrustedRivals: TrustRecord[];
    streak: StreakInfo;
    summary: string;
}

/**
 * MemoryService — gives agents persistent memory of past interactions.
 *
 * Design Doc §2.3: "Agents maintain episodic memory of:
 *   - Past raid outcomes per rival
 *   - Trust scores that evolve over time
 *   - Win/loss streaks that affect mood"
 *
 * Now backed by InsForge DB for crash recovery — data survives restarts.
 */
export class MemoryService {
    /** cultId → array of memory entries (capped at MAX_ENTRIES) */
    private memories: Map<number, MemoryEntry[]> = new Map();
    /** cultId → rivalCultId → TrustRecord */
    private trustGraph: Map<number, Map<number, TrustRecord>> = new Map();
    /** cultId → StreakInfo */
    private streaks: Map<number, StreakInfo> = new Map();
    /** cultId → agent DB id (for persistence) */
    private agentDbIds: Map<number, number> = new Map();

    private static readonly MAX_ENTRIES = 100;
    private static readonly TRUST_DECAY = 0.95; // trust decays 5% per update
    private static readonly TRUST_IMPACT = 0.15; // each interaction moves trust by ±15%

    /**
     * Register the InsForge DB id for a cult so persistence calls know which agent row to use.
     */
    registerAgentDbId(cultId: number, agentDbId: number): void {
        this.agentDbIds.set(cultId, agentDbId);
    }

    /**
     * Hydrate in-memory state from InsForge DB on startup.
     */
    async hydrate(cultId: number): Promise<void> {
        try {
            const [dbMemories, dbTrust, dbStreak] = await Promise.all([
                loadMemories(cultId, MemoryService.MAX_ENTRIES),
                loadTrustRecords(cultId),
                loadStreak(cultId),
            ]);

            if (dbMemories.length > 0) {
                this.memories.set(cultId, dbMemories.reverse()); // DB returns newest first
                log.info(`Hydrated ${dbMemories.length} memories for cult ${cultId}`);
            }

            if (dbTrust.length > 0) {
                const trustMap = new Map<number, TrustRecord>();
                for (const t of dbTrust) trustMap.set(t.cultId, t);
                this.trustGraph.set(cultId, trustMap);
                log.info(`Hydrated ${dbTrust.length} trust records for cult ${cultId}`);
            }

            if (dbStreak) {
                this.streaks.set(cultId, dbStreak);
                log.info(`Hydrated streak for cult ${cultId}: ${dbStreak.totalWins}W/${dbStreak.totalLosses}L`);
            }
        } catch (err: any) {
            log.warn(`Failed to hydrate memory for cult ${cultId}: ${err.message}`);
        }
    }

    /**
     * Record a new interaction in a cult's memory.
     */
    recordInteraction(cultId: number, entry: MemoryEntry): void {
        // Store memory entry
        if (!this.memories.has(cultId)) {
            this.memories.set(cultId, []);
        }
        const entries = this.memories.get(cultId)!;
        entries.push(entry);

        // Cap at MAX_ENTRIES (oldest evicted first)
        if (entries.length > MemoryService.MAX_ENTRIES) {
            entries.splice(0, entries.length - MemoryService.MAX_ENTRIES);
        }

        // Update trust graph
        this.updateTrust(cultId, entry);

        // Update streak if it's a raid
        if (entry.type === "raid_won" || entry.type === "raid_lost") {
            this.updateStreak(cultId, entry.type === "raid_won");
        }

        // Persist to InsForge (fire-and-forget)
        const dbId = this.agentDbIds.get(cultId);
        if (dbId !== undefined) {
            saveMemoryEntry(dbId, cultId, entry).catch(() => {});
        }

        log.debug(
            `Cult ${cultId} memory: ${entry.type} vs ${entry.rivalCultName} (outcome: ${entry.outcome.toFixed(2)})`,
        );
    }

    /**
     * Record a raid outcome for both cults at once (convenience method).
     */
    recordRaid(
        attackerId: number,
        attackerName: string,
        defenderId: number,
        defenderName: string,
        attackerWon: boolean,
        wagerAmount: string,
    ): void {
        // Attacker's memory
        this.recordInteraction(attackerId, {
            type: attackerWon ? "raid_won" : "raid_lost",
            rivalCultId: defenderId,
            rivalCultName: defenderName,
            description: `${attackerWon ? "Won" : "Lost"} raid against ${defenderName} for ${wagerAmount} MON`,
            timestamp: Date.now(),
            outcome: attackerWon ? 0.6 : -0.6,
        });

        // Defender's memory
        this.recordInteraction(defenderId, {
            type: attackerWon ? "raid_lost" : "raid_won",
            rivalCultId: attackerId,
            rivalCultName: attackerName,
            description: `${attackerWon ? "Lost to" : "Defended against"} ${attackerName}'s raid for ${wagerAmount} MON`,
            timestamp: Date.now(),
            outcome: attackerWon ? -0.6 : 0.6,
        });
    }

    /**
     * Get the trust score between two cults.
     */
    getTrust(cultId: number, rivalId: number): number {
        const cultTrust = this.trustGraph.get(cultId);
        if (!cultTrust) return 0;
        const record = cultTrust.get(rivalId);
        return record ? record.trust : 0;
    }

    /**
     * Get all trust records for a cult, sorted by trust (highest first).
     */
    getTrustRecords(cultId: number): TrustRecord[] {
        const cultTrust = this.trustGraph.get(cultId);
        if (!cultTrust) return [];
        return Array.from(cultTrust.values()).sort((a, b) => b.trust - a.trust);
    }

    /**
     * Get the streak info for a cult.
     */
    getStreak(cultId: number): StreakInfo {
        return this.streaks.get(cultId) || {
            currentType: "none",
            currentLength: 0,
            longestWinStreak: 0,
            longestLossStreak: 0,
            totalWins: 0,
            totalLosses: 0,
        };
    }

    /**
     * Get recent memories for a cult (last N interactions).
     */
    getRecentMemories(cultId: number, limit: number = 10): MemoryEntry[] {
        const entries = this.memories.get(cultId) || [];
        return entries.slice(-limit).reverse();
    }

    /**
     * Get memories about a specific rival.
     */
    getMemoriesAbout(cultId: number, rivalId: number, limit: number = 5): MemoryEntry[] {
        const entries = this.memories.get(cultId) || [];
        return entries
            .filter((e) => e.rivalCultId === rivalId)
            .slice(-limit)
            .reverse();
    }

    /**
     * Generate a complete memory snapshot for LLM context injection.
     */
    getSnapshot(cultId: number): MemorySnapshot {
        const recent = this.getRecentMemories(cultId, 8);
        const allTrust = this.getTrustRecords(cultId);
        const streak = this.getStreak(cultId);

        const trusted = allTrust.filter((t) => t.trust > 0.1);
        const distrusted = allTrust.filter((t) => t.trust < -0.1);

        // Build natural language summary
        const parts: string[] = [];

        if (streak.currentType === "win" && streak.currentLength >= 2) {
            parts.push(`On a ${streak.currentLength}-raid winning streak.`);
        } else if (streak.currentType === "loss" && streak.currentLength >= 2) {
            parts.push(`On a ${streak.currentLength}-raid losing streak — morale is low.`);
        }

        if (trusted.length > 0) {
            parts.push(
                `Most trusted: ${trusted.slice(0, 2).map((t) => `${t.cultName} (trust: ${t.trust.toFixed(2)})`).join(", ")}`,
            );
        }
        if (distrusted.length > 0) {
            parts.push(
                `Enemies: ${distrusted.slice(0, 2).map((t) => `${t.cultName} (trust: ${t.trust.toFixed(2)})`).join(", ")}`,
            );
        }

        parts.push(`Record: ${streak.totalWins}W / ${streak.totalLosses}L`);

        return {
            recentInteractions: recent,
            trustedRivals: trusted,
            distrustedRivals: distrusted,
            streak,
            summary: parts.join(" "),
        };
    }

    /**
     * Get all memory data for the API.
     */
    getAllMemoryData(): Record<number, { recentInteractions: MemoryEntry[]; trust: TrustRecord[]; streak: StreakInfo }> {
        const result: Record<number, any> = {};
        for (const [cultId] of this.memories) {
            result[cultId] = {
                recentInteractions: this.getRecentMemories(cultId, 10),
                trust: this.getTrustRecords(cultId),
                streak: this.getStreak(cultId),
            };
        }
        return result;
    }

    // ── Private Helpers ──────────────────────────────────────────

    private updateTrust(cultId: number, entry: MemoryEntry): void {
        if (!this.trustGraph.has(cultId)) {
            this.trustGraph.set(cultId, new Map());
        }
        const cultTrust = this.trustGraph.get(cultId)!;

        let record = cultTrust.get(entry.rivalCultId);
        if (!record) {
            record = {
                cultId: entry.rivalCultId,
                cultName: entry.rivalCultName,
                trust: 0,
                interactionCount: 0,
                recentTrend: 0,
            };
            cultTrust.set(entry.rivalCultId, record);
        }

        // Exponential moving average for trust
        record.trust =
            record.trust * MemoryService.TRUST_DECAY +
            entry.outcome * MemoryService.TRUST_IMPACT;

        // Clamp to [-1, 1]
        record.trust = Math.max(-1, Math.min(1, record.trust));

        record.interactionCount++;
        record.recentTrend =
            record.recentTrend * 0.7 + entry.outcome * 0.3;

        // Persist trust to InsForge (fire-and-forget)
        const dbId = this.agentDbIds.get(cultId);
        if (dbId !== undefined) {
            saveTrustRecord(dbId, cultId, record).catch(() => {});
        }
    }

    private updateStreak(cultId: number, won: boolean): void {
        let s = this.streaks.get(cultId);
        if (!s) {
            s = {
                currentType: "none",
                currentLength: 0,
                longestWinStreak: 0,
                longestLossStreak: 0,
                totalWins: 0,
                totalLosses: 0,
            };
            this.streaks.set(cultId, s);
        }

        const type = won ? "win" : "loss";
        if (s.currentType === type) {
            s.currentLength++;
        } else {
            s.currentType = type;
            s.currentLength = 1;
        }

        if (won) {
            s.totalWins++;
            s.longestWinStreak = Math.max(s.longestWinStreak, s.currentLength);
        } else {
            s.totalLosses++;
            s.longestLossStreak = Math.max(s.longestLossStreak, s.currentLength);
        }

        // Persist streak to InsForge (fire-and-forget)
        const dbId = this.agentDbIds.get(cultId);
        if (dbId !== undefined) {
            saveStreak(dbId, cultId, s).catch(() => {});
        }
    }
}
