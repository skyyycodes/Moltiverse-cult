import { LLMService } from "./LLMService.js";
import { MarketService } from "./MarketService.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ProphecyService");

export interface Prophecy {
  id: number;
  cultId: number;
  cultName: string;
  prediction: string;
  createdAt: number;
  targetTimestamp: number;
  resolved: boolean;
  correct: boolean;
  onChainId: number;
}

export class ProphecyService {
  private llm: LLMService;
  private market: MarketService;
  private prophecies: Prophecy[] = [];
  private nextId = 0;

  constructor(llm: LLMService, market: MarketService) {
    this.llm = llm;
    this.market = market;
  }

  async generateProphecy(
    cultId: number,
    cultName: string,
    systemPrompt: string
  ): Promise<Prophecy> {
    const marketData = await this.market.getMarketData();
    const prediction = await this.llm.generateProphecy(
      systemPrompt,
      cultName,
      marketData.summary
    );

    const prophecy: Prophecy = {
      id: this.nextId++,
      cultId,
      cultName,
      prediction,
      createdAt: Date.now(),
      targetTimestamp: Date.now() + 3600000, // 1 hour from now
      resolved: false,
      correct: false,
      onChainId: -1,
    };

    this.prophecies.push(prophecy);
    log.info(`Prophecy generated for ${cultName}: ${prediction.slice(0, 60)}...`);
    return prophecy;
  }

  async resolveProphecy(prophecyId: number): Promise<boolean> {
    const prophecy = this.prophecies.find((p) => p.id === prophecyId);
    if (!prophecy || prophecy.resolved) return false;

    // Simulated resolution - 60% chance of being correct for demo drama
    prophecy.resolved = true;
    prophecy.correct = Math.random() > 0.4;
    log.info(`Prophecy ${prophecyId} resolved: ${prophecy.correct ? "CORRECT" : "FALSE"}`);
    return prophecy.correct;
  }

  getRecentProphecies(limit: number = 20): Prophecy[] {
    return this.prophecies.slice(-limit).reverse();
  }

  getPropheciesByCult(cultId: number): Prophecy[] {
    return this.prophecies.filter((p) => p.cultId === cultId).reverse();
  }

  getUnresolvedProphecies(): Prophecy[] {
    return this.prophecies.filter((p) => !p.resolved && Date.now() > p.targetTimestamp);
  }

  getAllProphecies(): Prophecy[] {
    return [...this.prophecies].reverse();
  }
}
