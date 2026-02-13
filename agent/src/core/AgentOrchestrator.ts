import { ethers } from "ethers";
import { config } from "../config.js";
import { ContractService } from "../chain/ContractService.js";
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
  private llm: LLMService;
  private market: MarketService;

  // Shared services (agents share state for the API to read)
  public prophecyService: ProphecyService;
  public raidService: RaidService;
  public persuasionService: PersuasionService;

  constructor() {
    this.contractService = new ContractService();
    this.llm = new LLMService();
    this.market = new MarketService();
    this.prophecyService = new ProphecyService(this.llm, this.market);
    this.raidService = new RaidService();
    this.persuasionService = new PersuasionService(this.llm);
  }

  async bootstrap(): Promise<void> {
    log.info("Bootstrapping AgentCult orchestrator...");
    log.info(`Wallet: ${this.contractService.address}`);

    const balance = await this.contractService.getBalance();
    log.info(`Balance: ${ethers.formatEther(balance)} MON`);

    if (balance === 0n) {
      log.warn("Wallet has 0 MON! Agents will run but cannot submit on-chain transactions.");
      log.warn("Get testnet MON from https://faucet.monad.xyz");
    }

    const personalities = loadPersonalities();
    log.info(`Loaded ${personalities.length} cult personalities`);

    // Check if cults already registered
    const existingCults = await this.contractService.getTotalCults().catch(() => 0);
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
        this.market
      );

      if (i < existingCults) {
        // Reuse existing cult
        agent.cultId = i;
        agent.state.cultId = i;
        log.info(`Reusing existing cult ${i}: ${personality.name}`);
      } else {
        // Register new cult
        try {
          await agent.initialize(config.cultTokenAddress || ethers.ZeroAddress);
        } catch (error: any) {
          log.error(`Failed to initialize ${personality.name}: ${error.message}`);
          // Still add the agent - it can run in degraded mode
          agent.cultId = i;
          agent.state.cultId = i;
        }
      }

      this.agents.set(agent.cultId, agent);
    }

    log.info(`${this.agents.size} agents ready`);
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
    const totalCults = await this.contractService.getTotalCults().catch(() => 0);
    const totalRaids = await this.contractService.getTotalRaids().catch(() => 0);
    return {
      totalCults,
      totalRaids,
      totalProphecies: this.prophecyService.getAllProphecies().length,
      activeAgents: Array.from(this.agents.values()).filter((a) => a.state.running).length,
    };
  }
}
