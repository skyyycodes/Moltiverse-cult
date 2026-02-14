import { CultData } from "../chain/ContractService.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("LifeDeathService");

export interface DeathEvent {
    cultId: number;
    cultName: string;
    causeOfDeath: "treasury_depleted" | "no_followers" | "forced";
    timestamp: number;
    finalTreasury: string;
    finalFollowers: number;
}

export interface RebirthEvent {
    cultId: number;
    oldName: string;
    newName: string;
    timestamp: number;
}

/**
 * LifeDeathService — manages cult death conditions and rebirth.
 *
 * Design Doc Spec:
 *   - A cult "dies" when its treasury reaches 0 MON
 *   - Dead cults stop all agent actions
 *   - After a cooldown period, the agent can be "reborn"
 *   - Followers scatter (defect to other cults) on death
 */
export class LifeDeathService {
    private deaths: DeathEvent[] = [];
    private rebirths: RebirthEvent[] = [];
    private deathTimestamps: Map<number, number> = new Map(); // cultId → death timestamp
    private rebirthCooldownMs = 300_000; // 5 minutes cooldown before rebirth

    /**
     * Check whether a cult should die.
     * Returns the death cause or null if cult is still alive.
     */
    checkDeathCondition(cultState: CultData): DeathEvent | null {
        // Already dead
        if (!cultState.active) return null;

        // Death condition 1: Treasury depleted
        if (cultState.treasuryBalance <= 0n) {
            const event: DeathEvent = {
                cultId: cultState.id,
                cultName: cultState.name,
                causeOfDeath: "treasury_depleted",
                timestamp: Date.now(),
                finalTreasury: cultState.treasuryBalance.toString(),
                finalFollowers: cultState.followerCount,
            };

            this.deaths.push(event);
            this.deathTimestamps.set(cultState.id, Date.now());

            log.warn(
                `💀 CULT DEATH: "${cultState.name}" (ID: ${cultState.id}) — treasury depleted. ${cultState.followerCount} followers scattered.`,
            );

            return event;
        }

        // Death condition 2: No followers remaining (optional, design doc stretch)
        if (cultState.followerCount <= 0 && cultState.treasuryBalance < 1000n) {
            const event: DeathEvent = {
                cultId: cultState.id,
                cultName: cultState.name,
                causeOfDeath: "no_followers",
                timestamp: Date.now(),
                finalTreasury: cultState.treasuryBalance.toString(),
                finalFollowers: 0,
            };

            this.deaths.push(event);
            this.deathTimestamps.set(cultState.id, Date.now());

            log.warn(
                `💀 CULT DEATH: "${cultState.name}" (ID: ${cultState.id}) — abandoned by all followers.`,
            );

            return event;
        }

        return null;
    }

    /**
     * Check if a dead cult is eligible for rebirth.
     */
    canRebirth(cultId: number): boolean {
        const deathTime = this.deathTimestamps.get(cultId);
        if (!deathTime) return false;
        return Date.now() - deathTime >= this.rebirthCooldownMs;
    }

    /**
     * Record a cult rebirth.
     */
    recordRebirth(cultId: number, oldName: string, newName: string): RebirthEvent {
        const event: RebirthEvent = {
            cultId,
            oldName,
            newName,
            timestamp: Date.now(),
        };

        this.rebirths.push(event);
        this.deathTimestamps.delete(cultId);

        log.info(
            `🔮 CULT REBORN: "${oldName}" rises as "${newName}" (ID: ${cultId})`,
        );

        return event;
    }

    /**
     * Check if a cult is currently dead (waiting for rebirth).
     */
    isDead(cultId: number): boolean {
        return this.deathTimestamps.has(cultId);
    }

    /**
     * Get time remaining until rebirth is possible (ms).
     */
    getRebirthCooldownRemaining(cultId: number): number {
        const deathTime = this.deathTimestamps.get(cultId);
        if (!deathTime) return 0;
        const elapsed = Date.now() - deathTime;
        return Math.max(0, this.rebirthCooldownMs - elapsed);
    }

    getDeaths(): DeathEvent[] {
        return [...this.deaths].reverse();
    }

    getRebirths(): RebirthEvent[] {
        return [...this.rebirths].reverse();
    }

    getRecentEvents(limit: number = 20): Array<DeathEvent | RebirthEvent> {
        const all = [
            ...this.deaths.map((d) => ({ ...d, type: "death" as const })),
            ...this.rebirths.map((r) => ({ ...r, type: "rebirth" as const })),
        ];
        all.sort((a, b) => b.timestamp - a.timestamp);
        return all.slice(0, limit);
    }
}
