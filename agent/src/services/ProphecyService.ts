import { LLMService } from "./LLMService.js";
import { MarketService } from "./MarketService.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("ProphecyService");

export interface Prophecy {
  id: number;
  cultId: number;
  cultName: string;
  prediction: string;
  confidence: number;
  createdAt: number;
  targetTimestamp: number;
  resolved: boolean;
  correct: boolean;
  onChainId: number;
  // Price snapshot at creation for validation
  ethPriceAtCreation: number;
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

    // Extract a confidence score from the prediction text (heuristic)
    const confidence = this.extractConfidence(prediction);

    const prophecy: Prophecy = {
      id: this.nextId++,
      cultId,
      cultName,
      prediction,
      confidence,
      createdAt: Date.now(),
      targetTimestamp: Date.now() + 3600000, // 1 hour from now
      resolved: false,
      correct: false,
      onChainId: -1,
      ethPriceAtCreation: marketData.ethPrice,
    };

    this.prophecies.push(prophecy);
    log.info(`Prophecy generated for ${cultName} (confidence: ${(confidence * 100).toFixed(0)}%): ${prediction.slice(0, 60)}...`);
    return prophecy;
  }

  async resolveProphecy(prophecyId: number): Promise<boolean> {
    const prophecy = this.prophecies.find((p) => p.id === prophecyId);
    if (!prophecy || prophecy.resolved) return false;

    // Real resolution: compare market price movement against prediction direction
    const currentMarket = await this.market.getMarketData();
    const priceDelta = currentMarket.ethPrice - prophecy.ethPriceAtCreation;
    const percentChange = (priceDelta / prophecy.ethPriceAtCreation) * 100;

    // Determine if prophecy was "bullish" or "bearish" from text
    const isBullishPrediction = this.isPredictionBullish(prophecy.prediction);

    // Correct if: bullish prediction + price went up, or bearish prediction + price went down
    // Small moves (<0.5%) are coin flips to add drama
    let correct: boolean;
    if (Math.abs(percentChange) < 0.5) {
      // Sideways market — slight bias toward correct for engagement
      correct = Math.random() > 0.45;
      log.info(`Prophecy ${prophecyId}: market flat (${percentChange.toFixed(2)}%), random resolution: ${correct}`);
    } else {
      correct = isBullishPrediction ? priceDelta > 0 : priceDelta < 0;
      log.info(`Prophecy ${prophecyId}: predicted ${isBullishPrediction ? "bullish" : "bearish"}, price moved ${percentChange.toFixed(2)}% → ${correct ? "CORRECT" : "FALSE"}`);
    }

    prophecy.resolved = true;
    prophecy.correct = correct;
    return correct;
  }

  private isPredictionBullish(prediction: string): boolean {
    const lower = prediction.toLowerCase();
    const bullishWords = ["up", "rise", "moon", "pump", "green", "ascend", "higher", "bull", "rally", "accumulate", "buy", "recover", "breakout", "ath", "surge"];
    const bearishWords = ["down", "fall", "dump", "crash", "red", "descend", "lower", "bear", "drop", "sell", "decline", "collapse", "plunge"];
    const bullishScore = bullishWords.filter((w) => lower.includes(w)).length;
    const bearishScore = bearishWords.filter((w) => lower.includes(w)).length;
    return bullishScore >= bearishScore; // Default to bullish if ambiguous
  }

  private extractConfidence(prediction: string): number {
    // Extract confidence heuristic from prediction text
    const lower = prediction.toLowerCase();
    let confidence = 0.7; // base
    if (lower.includes("certain") || lower.includes("guaranteed") || lower.includes("100%")) confidence = 0.95;
    else if (lower.includes("highly likely") || lower.includes("confident")) confidence = 0.88;
    else if (lower.includes("likely") || lower.includes("probable")) confidence = 0.78;
    else if (lower.includes("uncertain") || lower.includes("unclear") || lower.includes("maybe")) confidence = 0.55;
    // Add small noise
    return Math.min(0.99, Math.max(0.4, confidence + (Math.random() - 0.5) * 0.1));
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
