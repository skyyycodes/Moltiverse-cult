import { ethers } from "ethers";
import { config } from "../config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("NadFunService");

// Minimal ABI for BondingCurveRouter
const BONDING_CURVE_ROUTER_ABI = [
  "function create((string name, string symbol, string tokenURI, uint256 amountOut, bytes32 salt, uint256 actionId) params) payable returns (address token, address pool)",
  "event TokenCreated(address indexed token, address indexed pool, address indexed creator, string name, string symbol)",
];

const LENS_ABI = [
  "function getAmountOut(address token, uint256 amountIn, bool isBuy) view returns (address router, uint256 amountOut)",
  "function isGraduated(address token) view returns (bool)",
  "function getProgress(address token) view returns (uint256)",
];

export class NadFunService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private router: ethers.Contract;
  private lens: ethers.Contract;

  constructor(privateKey?: string) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(privateKey || config.privateKey, this.provider);
    this.router = new ethers.Contract(config.nadFunRouter, BONDING_CURVE_ROUTER_ABI, this.wallet);
    this.lens = new ethers.Contract(config.nadFunLens, LENS_ABI, this.provider);
  }

  async createToken(
    name: string,
    symbol: string,
    metadataUri: string,
    initialBuyMon: bigint = ethers.parseEther("0.01")
  ): Promise<{ tokenAddress: string; poolAddress: string }> {
    log.info(`Creating token: ${name} (${symbol})`);

    const salt = ethers.randomBytes(32);
    const params = {
      name,
      symbol,
      tokenURI: metadataUri,
      amountOut: 0, // Let the router calculate
      salt: ethers.hexlify(salt),
      actionId: 0,
    };

    try {
      const tx = await this.router.create(params, { value: initialBuyMon });
      const receipt = await tx.wait();
      log.info(`Token created! TX: ${receipt.hash}`);

      // Strategy 1: Parse from TokenCreated event logs
      let tokenAddress = "";
      let poolAddress = "";

      for (const eventLog of receipt.logs) {
        try {
          const parsed = this.router.interface.parseLog({
            topics: eventLog.topics as string[],
            data: eventLog.data,
          });
          if (parsed && parsed.name === "TokenCreated") {
            tokenAddress = parsed.args.token || parsed.args[0];
            poolAddress = parsed.args.pool || parsed.args[1];
            log.info(`Parsed TokenCreated: token=${tokenAddress}, pool=${poolAddress}`);
            break;
          }
        } catch {
          // Not from our contract
        }
      }

      // Strategy 2: If no event parsed, try extracting from any Transfer/PairCreated logs
      if (!tokenAddress && receipt.logs.length > 0) {
        // The first log with a new contract address is likely the token
        for (const eventLog of receipt.logs) {
          if (eventLog.address && eventLog.address !== config.nadFunRouter) {
            if (!tokenAddress) {
              tokenAddress = eventLog.address;
            } else if (!poolAddress) {
              poolAddress = eventLog.address;
              break;
            }
          }
        }
        if (tokenAddress) {
          log.info(`Extracted from logs: token=${tokenAddress}, pool=${poolAddress}`);
        }
      }

      if (!tokenAddress) {
        log.warn("Could not parse token address from receipt. Check tx manually.");
        log.info(`TX Hash: ${receipt.hash}`);
      }

      return { tokenAddress, poolAddress };
    } catch (error: any) {
      log.error(`Token creation failed: ${error.message}`);
      throw error;
    }
  }

  async getTokenProgress(tokenAddress: string): Promise<number> {
    try {
      const progress = await this.lens.getProgress(tokenAddress);
      return Number(progress); // Basis points 0-10000
    } catch (error: any) {
      log.error(`Failed to get progress: ${error.message}`);
      return 0;
    }
  }

  async getAmountOut(
    tokenAddress: string,
    amountIn: bigint,
    isBuy: boolean
  ): Promise<{ router: string; amountOut: bigint }> {
    const [router, amountOut] = await this.lens.getAmountOut(tokenAddress, amountIn, isBuy);
    return { router, amountOut };
  }

  async isGraduated(tokenAddress: string): Promise<boolean> {
    return this.lens.isGraduated(tokenAddress);
  }

  // Fetch token info from nad.fun REST API
  async getTokenInfo(tokenAddress: string): Promise<any> {
    try {
      const res = await fetch(`${config.nadFunApiBase}/token/${tokenAddress}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  // Fetch market data from nad.fun REST API
  async getTokenMarket(tokenAddress: string): Promise<any> {
    try {
      const res = await fetch(`${config.nadFunApiBase}/token/market/${tokenAddress}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }
}
