import { LLMService } from "./LLMService.js";
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
  timestamp: number;
}

export class PersuasionService {
  private llm: LLMService;
  private events: PersuasionEvent[] = [];
  private nextId = 0;

  constructor(llm: LLMService) {
    this.llm = llm;
  }

  async attemptConversion(
    cultId: number,
    cultName: string,
    systemPrompt: string,
    targetCultId: number,
    targetCultName: string
  ): Promise<PersuasionEvent> {
    const scripture = await this.llm.generateScripture(
      systemPrompt,
      cultName,
      `Why followers of "${targetCultName}" should abandon their false prophets and join the true faith of "${cultName}"`
    );

    // Simulated conversion - 1-3 followers per attempt
    const followersConverted = Math.floor(Math.random() * 3) + 1;

    const event: PersuasionEvent = {
      id: this.nextId++,
      cultId,
      cultName,
      targetCultId,
      targetCultName,
      scripture,
      followersConverted,
      timestamp: Date.now(),
    };

    this.events.push(event);
    log.info(
      `${cultName} converted ${followersConverted} followers from ${targetCultName}`
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
