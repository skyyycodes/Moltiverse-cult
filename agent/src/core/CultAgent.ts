import { ethers } from "ethers";
import { config } from "../config.js";
import { ContractService, CultData } from "../chain/ContractService.js";
import { LLMService } from "../services/LLMService.js";
import { ProphecyService, Prophecy } from "../services/ProphecyService.js";
import { RaidService, RaidEvent } from "../services/RaidService.js";
import { PersuasionService, PersuasionEvent } from "../services/PersuasionService.js";
import { MarketService } from "../services/MarketService.js";
import { Personality } from "./AgentPersonality.js";
import { createLogger } from "../utils/logger.js";
import { randomDelay } from "../utils/sleep.js";

export interface AgentState {
  cultId: number;
  personality: Personality;
  running: boolean;
  lastAction: string;
  lastActionTime: number;
  cycleCount: number;
  propheciesGenerated: number;
  raidsInitiated: number;
  raidsWon: number;
  followersRecruited: number;
}

export class CultAgent {
  private contractService: ContractService;
  private llm: LLMService;
  private prophecyService: ProphecyService;
  private raidService: RaidService;
  private persuasionService: PersuasionService;
  private market: MarketService;
  private log;

  public cultId: number = -1;
  public personality: Personality;
  public state: AgentState;
  private running = false;
  private propheciesThisCycle = 0;

  constructor(
    personality: Personality,
    contractService: ContractService,
    llm: LLMService,
    prophecyService: ProphecyService,
    raidService: RaidService,
    persuasionService: PersuasionService,
    market: MarketService
  ) {
    this.personality = personality;
    this.contractService = contractService;
    this.llm = llm;
    this.prophecyService = prophecyService;
    this.raidService = raidService;
    this.persuasionService = persuasionService;
    this.market = market;
    this.log = createLogger(`Agent:${personality.name.slice(0, 20)}`);

    this.state = {
      cultId: -1,
      personality,
      running: false,
      lastAction: "initialized",
      lastActionTime: Date.now(),
      cycleCount: 0,
      propheciesGenerated: 0,
      raidsInitiated: 0,
      raidsWon: 0,
      followersRecruited: 0,
    };
  }

  async initialize(tokenAddress: string = ethers.ZeroAddress): Promise<void> {
    this.log.info("Initializing agent...");

    // Register cult on-chain
    this.cultId = await this.contractService.registerCult(
      this.personality.name,
      this.personality.systemPrompt,
      tokenAddress,
      ethers.parseEther("0.01") // Small initial treasury
    );

    this.state.cultId = this.cultId;
    this.log.info(`Agent initialized with cult ID: ${this.cultId}`);
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.state.running = true;
    this.log.info("Agent loop started");

    while (this.running) {
      try {
        await this.tick();
      } catch (error: any) {
        this.log.error(`Tick error: ${error.message}`);
      }
      await randomDelay(config.agentLoopInterval, config.agentLoopJitter);
    }
  }

  stop(): void {
    this.running = false;
    this.state.running = false;
    this.log.info("Agent loop stopped");
  }

  private async tick(): Promise<void> {
    this.state.cycleCount++;
    this.log.info(`--- Cycle ${this.state.cycleCount} ---`);

    // Phase 1: Observe
    const [cultState, allCults, marketData] = await Promise.all([
      this.contractService.getCult(this.cultId).catch(() => null),
      this.contractService.getAllCults().catch(() => []),
      this.market.getMarketData(),
    ]);

    if (!cultState) {
      this.log.warn("Could not fetch cult state, skipping cycle");
      return;
    }

    const rivals = allCults.filter((c) => c.id !== this.cultId && c.active);

    // Phase 2: Think - ask LLM what to do
    const decision = await this.llm.decideAction(
      this.personality.systemPrompt,
      this.personality.name,
      {
        ownTreasury: Number(ethers.formatEther(cultState.treasuryBalance)),
        ownFollowers: cultState.followerCount,
        ownRaidWins: cultState.raidWins,
        rivals: rivals.map((r) => ({
          id: r.id,
          name: r.name,
          treasury: Number(ethers.formatEther(r.treasuryBalance)),
          followers: r.followerCount,
          raidWins: r.raidWins,
        })),
        recentProphecies: this.propheciesThisCycle,
        marketTrend: marketData.trend,
      }
    );

    this.log.info(`Decision: ${decision.action} - ${decision.reason}`);

    // Phase 3: Act
    switch (decision.action) {
      case "prophecy":
        await this.executeProphecy(cultState);
        break;
      case "recruit":
        await this.executeRecruitment(cultState, rivals, decision.target);
        break;
      case "raid":
        await this.executeRaid(cultState, rivals, decision);
        break;
      case "idle":
        this.log.info("Meditating on the void...");
        this.state.lastAction = "idle - " + decision.reason;
        break;
    }

    this.state.lastActionTime = Date.now();

    // Phase 4: Resolve old prophecies
    await this.resolveOldProphecies();
  }

  private async executeProphecy(cultState: CultData): Promise<void> {
    const prophecy = await this.prophecyService.generateProphecy(
      this.cultId,
      this.personality.name,
      this.personality.systemPrompt
    );

    // Record on-chain
    try {
      const onChainId = await this.contractService.createProphecy(
        this.cultId,
        prophecy.prediction,
        Math.floor(prophecy.targetTimestamp / 1000)
      );
      prophecy.onChainId = onChainId;
    } catch (error: any) {
      this.log.warn(`Failed to record prophecy on-chain: ${error.message}`);
    }

    this.state.propheciesGenerated++;
    this.propheciesThisCycle++;
    this.state.lastAction = `prophecy: "${prophecy.prediction.slice(0, 50)}..."`;
  }

  private async executeRecruitment(
    cultState: CultData,
    rivals: CultData[],
    targetId?: number
  ): Promise<void> {
    const target = targetId !== undefined
      ? rivals.find((r) => r.id === targetId)
      : rivals[Math.floor(Math.random() * rivals.length)];

    if (!target) {
      this.log.info("No valid recruitment target found");
      return;
    }

    const event = await this.persuasionService.attemptConversion(
      this.cultId,
      this.personality.name,
      this.personality.systemPrompt,
      target.id,
      target.name
    );

    this.state.followersRecruited += event.followersConverted;
    this.state.lastAction = `recruited ${event.followersConverted} from ${target.name}`;
  }

  private async executeRaid(
    cultState: CultData,
    rivals: CultData[],
    decision: any
  ): Promise<void> {
    const { shouldRaid, target, wagerAmount } = this.raidService.shouldRaid(
      cultState,
      rivals,
      decision
    );

    if (!shouldRaid || !target) {
      this.log.info("Raid conditions not met, falling back to prophecy");
      await this.executeProphecy(cultState);
      return;
    }

    // Resolve the raid
    const raid = this.raidService.resolveRaid(
      cultState,
      target,
      wagerAmount,
      decision.reason || "The spirits demanded sacrifice"
    );

    // Record on-chain
    try {
      await this.contractService.recordRaid(
        raid.attackerId,
        raid.defenderId,
        raid.attackerWon,
        wagerAmount
      );
    } catch (error: any) {
      this.log.warn(`Failed to record raid on-chain: ${error.message}`);
    }

    this.state.raidsInitiated++;
    if (raid.attackerWon) this.state.raidsWon++;
    this.state.lastAction = `raided ${target.name} - ${raid.attackerWon ? "WON" : "LOST"} ${ethers.formatEther(wagerAmount)} MON`;
  }

  private async resolveOldProphecies(): Promise<void> {
    const unresolved = this.prophecyService.getUnresolvedProphecies();
    for (const prophecy of unresolved) {
      if (prophecy.cultId !== this.cultId) continue;
      const correct = await this.prophecyService.resolveProphecy(prophecy.id);

      if (prophecy.onChainId >= 0) {
        try {
          await this.contractService.resolveProphecy(
            prophecy.onChainId,
            correct,
            correct ? 150 : 100 // 1.5x treasury multiplier for correct prophecies
          );
        } catch (error: any) {
          this.log.warn(`Failed to resolve prophecy on-chain: ${error.message}`);
        }
      }
    }
  }
}
