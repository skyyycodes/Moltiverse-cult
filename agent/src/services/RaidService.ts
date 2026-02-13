import { LLMService, AgentDecision } from "./LLMService.js";
import { CultData } from "../chain/ContractService.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("RaidService");

export interface RaidEvent {
  id: number;
  attackerId: number;
  attackerName: string;
  defenderId: number;
  defenderName: string;
  wagerAmount: string; // MON as string
  attackerWon: boolean;
  timestamp: number;
  reason: string;
}

export class RaidService {
  private raids: RaidEvent[] = [];
  private nextId = 0;
  private cooldowns: Map<string, number> = new Map(); // "attackerId-defenderId" -> timestamp
  private cooldownDuration = 120000; // 2 minutes between same-pair raids

  shouldRaid(
    ownCult: CultData,
    rivals: CultData[],
    decision: AgentDecision
  ): { shouldRaid: boolean; target: CultData | null; wagerAmount: bigint } {
    if (decision.action !== "raid" || decision.target === undefined) {
      return { shouldRaid: false, target: null, wagerAmount: 0n };
    }

    const target = rivals.find((r) => r.id === decision.target);
    if (!target || !target.active) {
      return { shouldRaid: false, target: null, wagerAmount: 0n };
    }

    // Check cooldown
    const key = `${ownCult.id}-${target.id}`;
    const lastRaid = this.cooldowns.get(key) || 0;
    if (Date.now() - lastRaid < this.cooldownDuration) {
      log.info(`Raid on cooldown: ${key}`);
      return { shouldRaid: false, target: null, wagerAmount: 0n };
    }

    // Calculate wager
    const wagerPercent = Math.min(Math.max(decision.wager || 20, 10), 50);
    const wagerAmount = (ownCult.treasuryBalance * BigInt(wagerPercent)) / 100n;

    if (wagerAmount === 0n) {
      return { shouldRaid: false, target: null, wagerAmount: 0n };
    }

    return { shouldRaid: true, target, wagerAmount };
  }

  resolveRaid(
    attacker: CultData,
    defender: CultData,
    wagerAmount: bigint,
    reason: string
  ): RaidEvent {
    // Game theory resolution:
    // - Higher treasury = slight advantage (wealth = power)
    // - More followers = slight advantage (numbers matter)
    // - More raid wins = slight advantage (experience)
    // - Random factor keeps it exciting
    const attackerScore =
      Number(attacker.treasuryBalance) * 0.3 +
      attacker.followerCount * 100 +
      attacker.raidWins * 50 +
      Math.random() * 1000;

    const defenderScore =
      Number(defender.treasuryBalance) * 0.3 +
      defender.followerCount * 100 +
      defender.raidWins * 50 +
      Math.random() * 1000;

    const attackerWon = attackerScore > defenderScore;

    const raid: RaidEvent = {
      id: this.nextId++,
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender.id,
      defenderName: defender.name,
      wagerAmount: wagerAmount.toString(),
      attackerWon,
      timestamp: Date.now(),
      reason,
    };

    this.raids.push(raid);
    this.cooldowns.set(`${attacker.id}-${defender.id}`, Date.now());

    log.info(
      `Raid resolved: ${attacker.name} ${attackerWon ? "defeated" : "lost to"} ${defender.name} for ${wagerAmount} MON`
    );

    return raid;
  }

  getRecentRaids(limit: number = 20): RaidEvent[] {
    return this.raids.slice(-limit).reverse();
  }

  getRaidsByCult(cultId: number): RaidEvent[] {
    return this.raids
      .filter((r) => r.attackerId === cultId || r.defenderId === cultId)
      .reverse();
  }

  getAllRaids(): RaidEvent[] {
    return [...this.raids].reverse();
  }

  getLastRaid(): RaidEvent | null {
    return this.raids.length > 0 ? this.raids[this.raids.length - 1] : null;
  }
}
