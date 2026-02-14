import { ethers } from "ethers";
import { config } from "../config.js";
import { ContractService, CultData } from "../chain/ContractService.js";
import { TransactionQueue } from "../chain/TransactionQueue.js";
import { LLMService } from "../services/LLMService.js";
import { ProphecyService, Prophecy } from "../services/ProphecyService.js";
import { RaidService, RaidEvent } from "../services/RaidService.js";
import {
  PersuasionService,
  PersuasionEvent,
} from "../services/PersuasionService.js";
import { LifeDeathService } from "../services/LifeDeathService.js";
import { GovernanceService } from "../services/GovernanceService.js";
import { MemoryService } from "../services/MemoryService.js";
import { AllianceService } from "../services/AllianceService.js";
import { CommunicationService } from "../services/CommunicationService.js";
import { EvolutionService } from "../services/EvolutionService.js";
import { MarketService } from "../services/MarketService.js";
import { Personality } from "./AgentPersonality.js";
import { createLogger } from "../utils/logger.js";
import { randomDelay } from "../utils/sleep.js";
import { updateAgentState } from "../services/InsForgeService.js";

export interface AgentState {
  cultId: number;
  personality: Personality;
  running: boolean;
  dead: boolean;
  deathCause: string | null;
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
  private txQueue: TransactionQueue;
  private llm: LLMService;
  private prophecyService: ProphecyService;
  private raidService: RaidService;
  private persuasionService: PersuasionService;
  private lifeDeathService: LifeDeathService;
  private governanceService: GovernanceService;
  private memoryService: MemoryService;
  private allianceService: AllianceService;
  private communicationService: CommunicationService;
  private evolutionService: EvolutionService;
  private market: MarketService;
  private log;

  public cultId: number = -1;
  public personality: Personality;
  public state: AgentState;
  /** InsForge DB id for this agent (used for persistence) */
  public agentDbId: number = 0;
  private running = false;
  private propheciesThisCycle = 0;

  constructor(
    personality: Personality,
    contractService: ContractService,
    llm: LLMService,
    prophecyService: ProphecyService,
    raidService: RaidService,
    persuasionService: PersuasionService,
    lifeDeathService: LifeDeathService,
    governanceService: GovernanceService,
    memoryService: MemoryService,
    allianceService: AllianceService,
    communicationService: CommunicationService,
    evolutionService: EvolutionService,
    market: MarketService,
  ) {
    this.personality = personality;
    this.contractService = contractService;
    this.txQueue = new TransactionQueue();
    this.llm = llm;
    this.prophecyService = prophecyService;
    this.raidService = raidService;
    this.persuasionService = persuasionService;
    this.lifeDeathService = lifeDeathService;
    this.governanceService = governanceService;
    this.memoryService = memoryService;
    this.allianceService = allianceService;
    this.communicationService = communicationService;
    this.evolutionService = evolutionService;
    this.market = market;
    this.log = createLogger(`Agent:${personality.name.slice(0, 20)}`);

    this.state = {
      cultId: -1,
      personality,
      running: false,
      dead: false,
      deathCause: null,
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
      ethers.parseEther("0.01"), // Small initial treasury
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

    // Check if dead and waiting for rebirth
    if (this.state.dead) {
      if (this.lifeDeathService.canRebirth(this.cultId)) {
        this.log.info("Rebirth cooldown expired — cult may rise again!");
        this.state.dead = false;
        this.state.deathCause = null;
        this.state.lastAction = "reborn from the ashes";
        this.lifeDeathService.recordRebirth(
          this.cultId,
          this.personality.name,
          this.personality.name, // same name for now
        );
      } else {
        const remaining = this.lifeDeathService.getRebirthCooldownRemaining(
          this.cultId,
        );
        this.log.info(
          `💀 Cult is dead. Rebirth in ${Math.ceil(remaining / 1000)}s`,
        );
        this.state.lastAction = `dead — rebirth in ${Math.ceil(remaining / 1000)}s`;
        return;
      }
    }

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

    // Check death condition
    const deathEvent = this.lifeDeathService.checkDeathCondition(cultState);
    if (deathEvent) {
      this.state.dead = true;
      this.state.deathCause = deathEvent.causeOfDeath;
      this.state.lastAction = `DIED: ${deathEvent.causeOfDeath}`;
      return;
    }

    const rivals = allCults.filter((c) => c.id !== this.cultId && c.active);

    // Phase 2: Think - ask LLM what to do (with memory context + evolution)
    const memorySnapshot = this.memoryService.getSnapshot(this.cultId);
    const prophecyAccuracy = this.state.propheciesGenerated > 0 ? 0.5 : 0; // placeholder
    this.evolutionService.evolve(
      this.cultId,
      this.personality,
      this.state.cycleCount,
      this.memoryService,
      prophecyAccuracy,
    );
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
        memoryContext: memorySnapshot.summary,
      },
      this.state.cycleCount,
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
      case "govern":
        await this.executeGovernance(cultState);
        break;
      case "ally":
        await this.executeAlliance(cultState, rivals, decision);
        break;
      case "betray":
        await this.executeBetray(cultState, decision);
        break;
      case "coup":
        await this.executeCoup(cultState);
        break;
      case "leak":
        await this.executeLeak(cultState, rivals);
        break;
      case "meme":
        await this.executeMeme(cultState, rivals, decision);
        break;
      case "bribe":
        await this.executeBribe(cultState, rivals, decision);
        break;
      case "idle":
        this.log.info("Meditating on the void...");
        this.state.lastAction = "idle - " + decision.reason;
        break;
    }

    this.state.lastActionTime = Date.now();

    // Phase 4: Resolve old prophecies
    await this.resolveOldProphecies();

    // Phase 5: Governance - execute expired proposals
    await this.governanceService.executeExpiredProposals(this.cultId);

    // Phase 6: Persist agent state to InsForge DB (fire-and-forget)
    if (this.agentDbId > 0) {
      updateAgentState(this.agentDbId, {
        status: this.state.dead ? "dead" : "active",
        dead: this.state.dead,
        death_cause: this.state.deathCause,
        cycle_count: this.state.cycleCount,
        prophecies_generated: this.state.propheciesGenerated,
        raids_initiated: this.state.raidsInitiated,
        raids_won: this.state.raidsWon,
        followers_recruited: this.state.followersRecruited,
        last_action: this.state.lastAction,
        last_action_time: this.state.lastActionTime,
      }).catch(() => {});
    }
  }

  private async executeProphecy(cultState: CultData): Promise<void> {
    const prophecy = await this.prophecyService.generateProphecy(
      this.cultId,
      this.personality.name,
      this.personality.systemPrompt,
    );

    // Hash the prediction text — only the hash goes on-chain for gas savings.
    // Full text is stored in InsForge DB by ProphecyService.
    const predictionHash = ethers.keccak256(ethers.toUtf8Bytes(prophecy.prediction));

    // Record hash on-chain via transaction queue with retry
    try {
      const onChainId = await this.txQueue.enqueue(
        `prophecy-${prophecy.id}`,
        () =>
          this.contractService.createProphecy(
            this.cultId,
            predictionHash,
            Math.floor(prophecy.targetTimestamp / 1000),
          ),
      );
      prophecy.onChainId = onChainId;
    } catch (error: any) {
      this.log.warn(`Failed to record prophecy on-chain: ${error.message}`);
    }

    this.state.propheciesGenerated++;
    this.propheciesThisCycle++;
    this.state.lastAction = `prophecy: "${prophecy.prediction.slice(
      0,
      50,
    )}..."`;
  }

  private async executeRecruitment(
    cultState: CultData,
    rivals: CultData[],
    targetId?: number,
  ): Promise<void> {
    const target =
      targetId !== undefined
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
      target.name,
    );

    this.state.followersRecruited += event.followersConverted;
    this.state.lastAction = `recruited ${event.followersConverted} from ${target.name}`;
  }

  private async executeRaid(
    cultState: CultData,
    rivals: CultData[],
    decision: any,
  ): Promise<void> {
    const { shouldRaid, target, wagerAmount } = this.raidService.shouldRaid(
      cultState,
      rivals,
      decision,
    );

    if (!shouldRaid || !target) {
      this.log.info("Raid conditions not met, falling back to prophecy");
      await this.executeProphecy(cultState);
      return;
    }

    // Check if we can do a joint raid with our ally
    const jointCheck = this.allianceService.canJointRaid(this.cultId, target.id);
    let raid: RaidEvent;

    if (jointCheck.canRaid && jointCheck.ally) {
      // Joint raid with ally!
      const allyCult = rivals.find((r) => r.id === jointCheck.ally!.id) ||
        (await this.contractService.getCult(jointCheck.ally.id).catch(() => null));

      if (allyCult) {
        const allyWager = (allyCult.treasuryBalance * BigInt(15)) / 100n; // 15% wager
        raid = this.raidService.resolveJointRaid(
          cultState,
          allyCult,
          target,
          wagerAmount,
          allyWager,
          decision.reason || "Allied forces strike together!",
        );
        this.log.info(`Joint raid with ${jointCheck.ally.name} against ${target.name}!`);
      } else {
        raid = this.raidService.resolveRaid(
          cultState,
          target,
          wagerAmount,
          decision.reason || "The spirits demanded sacrifice",
        );
      }
    } else {
      // Standard raid
      raid = this.raidService.resolveRaid(
        cultState,
        target,
        wagerAmount,
        decision.reason || "The spirits demanded sacrifice",
      );
    }

    // Record on-chain via transaction queue with retry
    try {
      await this.txQueue.enqueue(`raid-${raid.id}`, () =>
        this.contractService.recordRaid(
          raid.attackerId,
          raid.defenderId,
          raid.attackerWon,
          wagerAmount,
        ),
      );
    } catch (error: any) {
      this.log.warn(`Failed to record raid on-chain: ${error.message}`);
    }

    this.state.raidsInitiated++;
    if (raid.attackerWon) this.state.raidsWon++;

    // Record raid in memory
    this.memoryService.recordRaid(
      raid.attackerId,
      cultState.name,
      raid.defenderId,
      target.name,
      raid.attackerWon,
      ethers.formatEther(wagerAmount),
    );

    // Create a spoils distribution vote for winning raids
    if (raid.attackerWon) {
      this.raidService.createSpoilsVote(
        raid.id,
        this.cultId,
        ethers.formatEther(wagerAmount),
      );
    }

    // Resolve any expired spoils votes
    this.raidService.resolveExpiredSpoilsVotes();

    const jointLabel = raid.isJointRaid ? ` (joint with ${raid.allyName})` : "";
    this.state.lastAction = `raided ${target.name}${jointLabel} - ${raid.attackerWon ? "WON" : "LOST"
      } ${ethers.formatEther(wagerAmount)} MON`;
  }

  private async executeGovernance(cultState: CultData): Promise<void> {
    try {
      const currentBudget = await this.governanceService.getBudget(this.cultId);
      const proposal = await this.governanceService.generateProposal(
        this.cultId,
        this.personality.name,
        this.personality.systemPrompt,
        {
          treasury: Number(ethers.formatEther(cultState.treasuryBalance)),
          followers: cultState.followerCount,
          raidWins: cultState.raidWins,
          raidLosses: cultState.raidLosses,
          currentBudget,
        },
      );

      // Auto-vote for own proposal with weight based on followers.
      // Pass wallet address so the vote can be batched on-chain later.
      const weight = Math.max(1, cultState.followerCount);
      await this.governanceService.voteOnProposal(
        proposal.id,
        true,
        weight,
        this.contractService.address,
      );

      this.state.lastAction = `governance: proposed R${proposal.raidPercent}/G${proposal.growthPercent}/D${proposal.defensePercent}/Re${proposal.reservePercent}`;
      this.log.info(`Governance action: ${this.state.lastAction}`);
    } catch (error: any) {
      this.log.warn(`Governance action failed: ${error.message}`);
      this.state.lastAction = "governance: failed - " + error.message;
    }
  }

  private async resolveOldProphecies(): Promise<void> {
    const unresolved = this.prophecyService.getUnresolvedProphecies();
    for (const prophecy of unresolved) {
      if (prophecy.cultId !== this.cultId) continue;
      const correct = await this.prophecyService.resolveProphecy(prophecy.id);

      if (prophecy.onChainId >= 0) {
        try {
          await this.txQueue.enqueue(`resolve-${prophecy.onChainId}`, () =>
            this.contractService.resolveProphecy(
              prophecy.onChainId,
              correct,
              correct ? 150 : 100, // 1.5x treasury multiplier for correct prophecies
            ),
          );
        } catch (error: any) {
          this.log.warn(
            `Failed to resolve prophecy on-chain: ${error.message}`,
          );
        }
      }
    }
  }

  private async executeAlliance(
    cultState: CultData,
    rivals: CultData[],
    decision: any,
  ): Promise<void> {
    try {
      // Find target (LLM may have specified one)
      let target: CultData | undefined;
      if (decision.target != null) {
        target = rivals.find((r) => r.id === decision.target);
      }
      if (!target) {
        // Pick best alliance candidate based on trust
        const trustRecords = this.memoryService.getTrustRecords(this.cultId);
        const candidateId = trustRecords.find(
          (t) => t.trust > -0.3 && rivals.some((r) => r.id === t.cultId),
        )?.cultId;
        target = candidateId != null ? rivals.find((r) => r.id === candidateId) : rivals[0];
      }
      if (!target) {
        this.log.info("No valid alliance target found");
        this.state.lastAction = "ally: no valid target";
        return;
      }

      const alliance = this.allianceService.formAlliance(
        this.cultId,
        cultState.name,
        target.id,
        target.name,
      );

      if (alliance) {
        this.state.lastAction = `allied with ${target.name} (bonus: ${((alliance.powerBonus - 1) * 100).toFixed(0)}%)`;
        this.log.info(`Alliance formed with ${target.name}`);
      } else {
        this.state.lastAction = `ally: failed to form alliance with ${target.name}`;
      }
    } catch (error: any) {
      this.log.warn(`Alliance action failed: ${error.message}`);
      this.state.lastAction = "ally: failed - " + error.message;
    }
  }

  private async executeBetray(
    cultState: CultData,
    decision: any,
  ): Promise<void> {
    try {
      const betrayal = this.allianceService.betray(
        this.cultId,
        cultState.name,
        decision.reason || "The pact was only temporary",
      );

      if (betrayal) {
        this.state.lastAction = `BETRAYED ${betrayal.victimName}! Surprise bonus: ${((betrayal.surpriseBonus - 1) * 100).toFixed(0)}%`;
        this.log.info(`Betrayed alliance with ${betrayal.victimName}`);
      } else {
        this.state.lastAction = "betray: no active alliance to betray";
      }
    } catch (error: any) {
      this.log.warn(`Betrayal failed: ${error.message}`);
      this.state.lastAction = "betray: failed - " + error.message;
    }
  }

  private async executeCoup(cultState: CultData): Promise<void> {
    try {
      const instigatorPower =
        Number(ethers.formatEther(cultState.treasuryBalance)) * 0.6 +
        cultState.followerCount * 100 * 0.4;

      // Target the strongest rival for a coup attempt
      const allCults = await this.contractService.getAllCults().catch(() => []);
      const rivals = allCults.filter((c) => c.id !== this.cultId && c.active);
      if (rivals.length === 0) {
        this.state.lastAction = "coup: no targets available";
        return;
      }

      // Pick random rival to coup
      const target = rivals[Math.floor(Math.random() * rivals.length)];
      const leaderPower =
        Number(ethers.formatEther(target.treasuryBalance)) * 0.6 +
        target.followerCount * 100 * 0.4;

      const coupEvent = await this.governanceService.attemptCoup(
        target.id,
        target.name,
        instigatorPower,
        leaderPower,
      );

      if (coupEvent) {
        this.state.lastAction = `coup against ${target.name}: ${coupEvent.success ? "SUCCESS! Seized power!" : "FAILED — repelled by loyalists"}`;
      } else {
        this.state.lastAction = "coup: on cooldown";
      }
    } catch (error: any) {
      this.log.warn(`Coup failed: ${error.message}`);
      this.state.lastAction = "coup: failed - " + error.message;
    }
  }

  private async executeLeak(
    cultState: CultData,
    rivals: CultData[],
  ): Promise<void> {
    try {
      if (rivals.length < 2) {
        this.state.lastAction = "leak: not enough rivals for conversation leak";
        return;
      }

      // Pick two random rivals to expose
      const shuffled = [...rivals].sort(() => Math.random() - 0.5);
      const target1 = shuffled[0];
      const target2 = shuffled[1];

      const result = await this.communicationService.leakConversation(
        this.cultId,
        cultState.name,
        this.personality.systemPrompt,
        target1.id,
        target1.name,
        target2.id,
        target2.name,
      );

      if (result) {
        this.state.lastAction = `LEAKED conversations between ${target1.name} & ${target2.name}! ${result.leaked.length} messages exposed`;
      } else {
        // No messages to leak — try selective disclosure instead
        const intelResult = await this.communicationService.selectiveDisclose(
          this.cultId,
          cultState.name,
          target1.id,
          target1.name,
          target2.id,
          target2.name,
          this.personality.systemPrompt,
        );
        if (intelResult) {
          this.state.lastAction = `Shared intel about ${target2.name} with ${target1.name}`;
        } else {
          this.state.lastAction = "leak: no private messages to expose";
        }
      }
    } catch (error: any) {
      this.log.warn(`Leak action failed: ${error.message}`);
      this.state.lastAction = "leak: failed - " + error.message;
    }
  }

  private async executeMeme(
    cultState: CultData,
    rivals: CultData[],
    decision: any,
  ): Promise<void> {
    try {
      let target: CultData | undefined;
      if (decision.target != null) {
        target = rivals.find((r) => r.id === decision.target);
      }
      if (!target) {
        target = rivals[Math.floor(Math.random() * rivals.length)];
      }
      if (!target) {
        this.state.lastAction = "meme: no targets available";
        return;
      }

      const context = `${cultState.name} has ${cultState.followerCount} followers and ${ethers.formatEther(cultState.treasuryBalance)} MON. ${target.name} has ${target.followerCount} followers.`;

      const result = await this.communicationService.sendMeme(
        this.agentDbId,
        0, // target agent DB id (resolved later)
        this.cultId,
        cultState.name,
        target.id,
        target.name,
        this.personality.systemPrompt,
        context,
      );

      this.state.lastAction = `sent meme to ${target.name}: "${result.caption.slice(0, 50)}..."`;
      this.log.info(`🖼️ Meme sent to ${target.name}`);
    } catch (error: any) {
      this.log.warn(`Meme action failed: ${error.message}`);
      this.state.lastAction = "meme: failed - " + error.message;
    }
  }

  private async executeBribe(
    cultState: CultData,
    rivals: CultData[],
    decision: any,
  ): Promise<void> {
    try {
      let target: CultData | undefined;
      if (decision.target != null) {
        target = rivals.find((r) => r.id === decision.target);
      }
      if (!target) {
        target = rivals[Math.floor(Math.random() * rivals.length)];
      }
      if (!target) {
        this.state.lastAction = "bribe: no targets available";
        return;
      }

      const amount = decision.bribeAmount || "0.001";

      // Record the intent (actual on-chain transfer would be done by ContractService)
      await this.communicationService.recordTokenTransfer(
        this.agentDbId,
        0, // target agent DB id
        cultState.name,
        target.name,
        config.cultTokenAddress || ethers.ZeroAddress,
        amount,
        "bribe",
      );

      // Record in memory as positive interaction
      this.memoryService.recordInteraction(this.cultId, {
        type: "alliance_formed",
        rivalCultId: target.id,
        rivalCultName: target.name,
        description: `Sent ${amount} tokens as bribe to ${target.name}`,
        timestamp: Date.now(),
        outcome: 0.3,
      });

      this.state.lastAction = `bribed ${target.name} with ${amount} tokens`;
      this.log.info(`💰 Bribe sent to ${target.name}: ${amount}`);
    } catch (error: any) {
      this.log.warn(`Bribe action failed: ${error.message}`);
      this.state.lastAction = "bribe: failed - " + error.message;
    }
  }

  // ── Public API methods for external triggers (REST routes) ──────────

  /**
   * Send a meme to a specific target cult (triggered externally via API).
   */
  async sendMemeToTarget(targetCultId: number, memeUrl?: string): Promise<void> {
    const cults = await this.contractService.getAllCults();
    const cultState = cults.find((c) => c.id === this.cultId);
    const target = cults.find((c) => c.id === targetCultId);

    if (!cultState || !target) {
      throw new Error(`Cult data not found for source ${this.cultId} or target ${targetCultId}`);
    }

    const context = `${cultState.name} has ${cultState.followerCount} followers. ${target.name} has ${target.followerCount} followers.`;

    await this.communicationService.sendMeme(
      this.agentDbId,
      0,
      this.cultId,
      cultState.name,
      target.id,
      target.name,
      this.personality.systemPrompt,
      context,
      memeUrl,
    );

    this.state.lastAction = `sent meme to ${target.name} (API)`;
  }

  /**
   * Send a token bribe to a specific target cult (triggered externally via API).
   */
  async sendBribeToTarget(targetCultId: number, amount?: number): Promise<void> {
    const cults = await this.contractService.getAllCults();
    const cultState = cults.find((c) => c.id === this.cultId);
    const target = cults.find((c) => c.id === targetCultId);

    if (!cultState || !target) {
      throw new Error(`Cult data not found for source ${this.cultId} or target ${targetCultId}`);
    }

    const bribeAmount = (amount || 0.001).toString();

    await this.communicationService.recordTokenTransfer(
      this.agentDbId,
      0,
      cultState.name,
      target.name,
      config.cultTokenAddress || ethers.ZeroAddress,
      bribeAmount,
      "bribe",
    );

    this.memoryService.recordInteraction(this.cultId, {
      type: "alliance_formed",
      rivalCultId: target.id,
      rivalCultName: target.name,
      description: `Sent ${bribeAmount} tokens as bribe to ${target.name} (API)`,
      timestamp: Date.now(),
      outcome: 0.3,
    });

    this.state.lastAction = `bribed ${target.name} with ${bribeAmount} tokens (API)`;
  }
}
