import { createLogger } from "../utils/logger.js";

const log = createLogger("MarketService");

export interface MarketData {
  ethPrice: number;
  btcPrice: number;
  ethChange24h: number;
  btcChange24h: number;
  trend: "bullish" | "bearish" | "neutral";
  summary: string;
}

export class MarketService {
  private cache: MarketData | null = null;
  private lastFetch = 0;
  private cacheDuration = 60000; // 1 minute

  async getMarketData(): Promise<MarketData> {
    if (this.cache && Date.now() - this.lastFetch < this.cacheDuration) {
      return this.cache;
    }

    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true"
      );
      if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
      const data = await res.json();

      const ethPrice = data.ethereum?.usd || 0;
      const btcPrice = data.bitcoin?.usd || 0;
      const ethChange = data.ethereum?.usd_24h_change || 0;
      const btcChange = data.bitcoin?.usd_24h_change || 0;

      const trend = ethChange > 2 ? "bullish" : ethChange < -2 ? "bearish" : "neutral";

      this.cache = {
        ethPrice,
        btcPrice,
        ethChange24h: ethChange,
        btcChange24h: btcChange,
        trend,
        summary: `ETH: $${ethPrice.toFixed(0)} (${ethChange > 0 ? "+" : ""}${ethChange.toFixed(1)}%), BTC: $${btcPrice.toFixed(0)} (${btcChange > 0 ? "+" : ""}${btcChange.toFixed(1)}%). Market is ${trend}.`,
      };
      this.lastFetch = Date.now();
      return this.cache;
    } catch (error: any) {
      log.warn(`Market data fetch failed: ${error.message}, using fallback`);
      return this.getFallbackData();
    }
  }

  private getFallbackData(): MarketData {
    // Simulated market data for demo
    const trends = ["bullish", "bearish", "neutral"] as const;
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const ethPrice = 3000 + Math.random() * 2000;
    const btcPrice = 60000 + Math.random() * 40000;
    return {
      ethPrice,
      btcPrice,
      ethChange24h: (Math.random() - 0.5) * 10,
      btcChange24h: (Math.random() - 0.5) * 8,
      trend,
      summary: `ETH: $${ethPrice.toFixed(0)}, BTC: $${btcPrice.toFixed(0)}. Market feels ${trend}.`,
    };
  }
}
