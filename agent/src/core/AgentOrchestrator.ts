import { ethers } from "ethers";
import { config } from "../config.js";
import { ContractService } from "../chain/ContractService.js";
import { NadFunService } from "../chain/NadFunService.js";
import { TransactionQueue } from "../chain/TransactionQueue.js";
import { LLMService } from "../services/LLMService.js";
import { ProphecyService } from "../services/ProphecyService.js";
import { RaidService } from "../services/RaidService.js";
import { PersuasionService } from "../services/PersuasionService.js";
import { MarketService } from "../services/MarketService.js";
import { CultAgent, AgentState } from "./CultAgent.js";
import { loadPersonalities, Personality } from "./AgentPersonality.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("Orchestrator");

export class AgentOrchestrator {
  private agents: Map<number, CultAgent> = new Map();
  private contractService: ContractService;
  private nadFunService: NadFunService;
  private txQueue: TransactionQueue;
  private llm: LLMService;
  private market: MarketService;

  // Token created on nad.fun
  public cultTokenAddress: string = "";

  // Shared services (agents share state for the API to read)
  public prophecyService: ProphecyService;
  public raidService: RaidService;
  public persuasionService: PersuasionService;

  constructor() {
    this.contractService = new ContractService();
    this.nadFunService = new NadFunService();
    this.txQueue = new TransactionQueue();
    this.llm = new LLMService();
    this.market = new MarketService();
    this.prophecyService = new ProphecyService(this.llm, this.market);
    this.raidService = new RaidService();
    this.persuasionService = new PersuasionService(
      this.llm,
      this.contractService,
    );
  }

  async bootstrap(): Promise<void> {
    log.info("Bootstrapping AgentCult orchestrator...");
    log.info(`Wallet: ${this.contractService.address}`);

    const balance = await this.contractService.getBalance();
    log.info(`Balance: ${ethers.formatEther(balance)} MON`);

    if (balance === 0n) {
      log.warn(
        "Wallet has 0 MON! Agents will run but cannot submit on-chain transactions.",
      );
      log.warn("Get testnet MON from https://faucet.monad.xyz");
    }

    // Create $CULT token on nad.fun if not already configured
    await this.ensureCultToken();

    const personalities = loadPersonalities();
    log.info(`Loaded ${personalities.length} cult personalities`);

    // Check if cults already registered
    const existingCults = await this.contractService
      .getTotalCults()
      .catch(() => 0);
    log.info(`Existing cults on-chain: ${existingCults}`);

    for (let i = 0; i < personalities.length; i++) {
      const personality = personalities[i];
      const agent = new CultAgent(
        personality,
        this.contractService,
        this.llm,
        this.prophecyService,
        this.raidService,
        this.persuasionService,
        this.market,
      );

      if (i < existingCults) {
        // Reuse existing cult
        agent.cultId = i;
        agent.state.cultId = i;
        log.info(`Reusing existing cult ${i}: ${personality.name}`);
      } else {
        // Register new cult with the $CULT token address
        try {
          await agent.initialize(this.cultTokenAddress || ethers.ZeroAddress);
        } catch (error: any) {
          log.error(
            `Failed to initialize ${personality.name}: ${error.message}`,
          );
          // Still add the agent - it can run in degraded mode
          agent.cultId = i;
          agent.state.cultId = i;
        }
      }

      this.agents.set(agent.cultId, agent);
    }

    log.info(`${this.agents.size} agents ready`);
  }

  private async ensureCultToken(): Promise<void> {
    // If token address already configured in env, use it
    if (
      config.cultTokenAddress &&
      config.cultTokenAddress !== ethers.ZeroAddress
    ) {
      this.cultTokenAddress = config.cultTokenAddress;
      log.info(`Using configured $CULT token: ${this.cultTokenAddress}`);

      // Check token progress on nad.fun
      try {
        const progress = await this.nadFunService.getTokenProgress(
          this.cultTokenAddress,
        );
        const graduated = await this.nadFunService.isGraduated(
          this.cultTokenAddress,
        );
        log.info(`Token progress: ${progress / 100}%, graduated: ${graduated}`);
      } catch {
        log.warn(
          "Could not check token status on nad.fun (may not be on bonding curve)",
        );
      }
      return;
    }

    // Create a new $CULT token on nad.fun
    log.info("No $CULT token configured, creating on nad.fun...");
    try {
      const balance = await this.contractService.getBalance();
      if (balance < ethers.parseEther("0.02")) {
        log.warn(
          "Insufficient balance to create token on nad.fun (need ~0.02 MON). Skipping token creation.",
        );
        return;
      }

      const { tokenAddress, poolAddress } =
        await this.nadFunService.createToken(
          "AgentCult",
          "CULT",
          "ipfs://agentcult-emergent-religious-economies", // metadata URI
          ethers.parseEther("0.01"), // initial buy
        );

      if (tokenAddress) {
        this.cultTokenAddress = tokenAddress;
        log.info(`$CULT token created at: ${tokenAddress}`);
        log.info(`Pool address: ${poolAddress}`);
        log.info(`Set CULT_TOKEN_ADDRESS=${tokenAddress} in your .env file`);
      } else {
        log.warn(
          "Token creation succeeded but could not parse address. Check tx on explorer.",
        );
      }
    } catch (error: any) {
      log.warn(
        `Token creation failed: ${error.message}. Agents will run without token.`,
      );
    }
  }

  async startAll(): Promise<void> {
    log.info("Starting all agent loops...");
    const promises: Promise<void>[] = [];

    for (const [id, agent] of this.agents) {
      // Stagger agent starts to avoid RPC spam
      const delay = id * 5000;
      const p = new Promise<void>((resolve) => {
        setTimeout(() => {
          agent.start().catch((err) => {
            log.error(`Agent ${id} crashed: ${err.message}`);
          });
          resolve();
        }, delay);
      });
      promises.push(p);
    }

    await Promise.all(promises);
    log.info("All agents started");
  }

  stopAll(): void {
    for (const agent of this.agents.values()) {
      agent.stop();
    }
    log.info("All agents stopped");
  }

  getAgentStates(): AgentState[] {
    return Array.from(this.agents.values()).map((a) => a.state);
  }

  getAgent(cultId: number): CultAgent | undefined {
    return this.agents.get(cultId);
  }

  async getCultsFromChain() {
    return this.contractService.getAllCults();
  }

  async getStats() {
    const totalCults = await this.contractService
      .getTotalCults()
      .catch(() => 0);
    const totalRaids = await this.contractService
      .getTotalRaids()
      .catch(() => 0);
    return {
      totalCults,
      totalRaids,
      totalProphecies: this.prophecyService.getAllProphecies().length,
      activeAgents: Array.from(this.agents.values()).filter(
        (a) => a.state.running,
      ).length,
    };
  }
}
