import { LLMService } from "./LLMService.js";
import { ContractService } from "../chain/ContractService.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("PersuasionService");

export interface PersuasionEvent {
  id: number;
  cultId: number;
  cultName: string;
  targetCultId: number;
  targetCultName: string;
  scripture: string;
  followersConverted: number;
  recordedOnChain: boolean;
  timestamp: number;
}

export class PersuasionService {
  private llm: LLMService;
  private contractService: ContractService;
  private events: PersuasionEvent[] = [];
  private nextId = 0;

  constructor(llm: LLMService, contractService: ContractService) {
    this.llm = llm;
    this.contractService = contractService;
  }

  async attemptConversion(
    cultId: number,
    cultName: string,
    systemPrompt: string,
    targetCultId: number,
    targetCultName: string,
  ): Promise<PersuasionEvent> {
    const scripture = await this.llm.generateScripture(
      systemPrompt,
      cultName,
      `Why followers of "${targetCultName}" should abandon their false prophets and join the true faith of "${cultName}"`,
    );

    // Simulated conversion - 1-3 followers per attempt
    const followersConverted = Math.floor(Math.random() * 3) + 1;

    // Record follower joins on-chain
    let recordedOnChain = false;
    try {
      for (let i = 0; i < followersConverted; i++) {
        await this.contractService.joinCult(cultId);
      }
      recordedOnChain = true;
      log.info(
        `Recorded ${followersConverted} follower joins on-chain for cult ${cultId}`,
      );
    } catch (error: any) {
      log.warn(`Failed to record followers on-chain: ${error.message}`);
    }

    const event: PersuasionEvent = {
      id: this.nextId++,
      cultId,
      cultName,
      targetCultId,
      targetCultName,
      scripture,
      followersConverted,
      recordedOnChain,
      timestamp: Date.now(),
    };

    this.events.push(event);
    log.info(
      `${cultName} converted ${followersConverted} followers from ${targetCultName}${
        recordedOnChain ? " (on-chain)" : " (off-chain)"
      }`,
    );

    return event;
  }

  getRecentEvents(limit: number = 20): PersuasionEvent[] {
    return this.events.slice(-limit).reverse();
  }

  getAllEvents(): PersuasionEvent[] {
    return [...this.events].reverse();
  }
}
