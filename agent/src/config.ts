import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const config = {
  // Chain
  rpcUrl: process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz",
  chainId: 10143,
  privateKey: process.env.PRIVATE_KEY || "",

  // Contracts
  cultRegistryAddress: process.env.CULT_REGISTRY_ADDRESS || "",

  // nad.fun
  nadFunRouter: "0x6F6B8F1a20703309951a5127c45B49b1CD981A22",
  nadFunLens: "0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea",
  nadFunApiBase: "https://testnet-bot-api-server.nad.fun",

  // xAI / Grok
  xaiApiKey: process.env.XAI_API_KEY || "",
  xaiBaseUrl: "https://api.x.ai/v1",
  xaiModel: "grok-3-fast",

  // Agent
  agentLoopInterval: 30000, // 30 seconds
  agentLoopJitter: 30000, // +0-30s random jitter

  // API Server
  apiPort: parseInt(process.env.AGENT_API_PORT || "3001"),

  // Token
  cultTokenAddress: process.env.CULT_TOKEN_ADDRESS || "",
} as const;

// CultRegistry ABI - only the functions we use
export const CULT_REGISTRY_ABI = [
  "function registerCult(string name, string prophecyPrompt, address tokenAddress) payable returns (uint256)",
  "function depositToTreasury(uint256 cultId) payable",
  "function joinCult(uint256 cultId)",
  "function recordRaid(uint256 attackerId, uint256 defenderId, bool attackerWon, uint256 amount)",
  "function createProphecy(uint256 cultId, string prediction, uint256 targetTimestamp) returns (uint256)",
  "function resolveProphecy(uint256 prophecyId, bool correct, uint256 treasuryMultiplier)",
  "function getCult(uint256 cultId) view returns (tuple(uint256 id, address leader, string name, string prophecyPrompt, address tokenAddress, uint256 treasuryBalance, uint256 followerCount, uint256 raidWins, uint256 raidLosses, uint256 createdAt, bool active))",
  "function getTotalCults() view returns (uint256)",
  "function getAllCults() view returns (tuple(uint256 id, address leader, string name, string prophecyPrompt, address tokenAddress, uint256 treasuryBalance, uint256 followerCount, uint256 raidWins, uint256 raidLosses, uint256 createdAt, bool active)[])",
  "function nextCultId() view returns (uint256)",
  "function totalRaids() view returns (uint256)",
  "event CultRegistered(uint256 indexed cultId, address indexed leader, string name, address tokenAddress, uint256 initialTreasury)",
  "event RaidResult(uint256 indexed attackerId, uint256 indexed defenderId, bool attackerWon, uint256 amount, uint256 timestamp)",
  "event ProphecyCreated(uint256 indexed prophecyId, uint256 indexed cultId, string prediction, uint256 targetTimestamp)",
  "event ProphecyResolved(uint256 indexed prophecyId, uint256 indexed cultId, bool correct, uint256 treasuryMultiplier)",
] as const;
