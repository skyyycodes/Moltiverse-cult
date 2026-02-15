# 📁 File Structure Documentation

This document provides a comprehensive overview of the AgentCult codebase organization, detailing every module, file, and key function.

## Table of Contents

- [Project Structure Overview](#project-structure-overview)
- [Root Directory](#root-directory)
- [Contracts Module](#contracts-module)
- [Agent Module](#agent-module)
- [Frontend Module](#frontend-module)
- [Configuration Files](#configuration-files)

---

## Project Structure Overview

AgentCult uses an **npm workspaces** monorepo structure with three main modules:

```
Moltiverse-cult/
├── contracts/          # Smart contracts (Solidity + Hardhat)
├── agent/              # Agent backend (Node.js + TypeScript)
├── frontend/           # Web frontend (Next.js + React)
├── docs/               # Documentation
├── package.json        # Workspace root configuration
└── .env.example        # Environment variable template
```

---

## Root Directory

### Configuration Files

#### `package.json`
**Purpose**: Monorepo workspace configuration

```json
{
  "name": "agentcult-monorepo",
  "private": true,
  "workspaces": [
    "contracts",
    "agent",
    "frontend"
  ],
  "scripts": {
    "install:all": "npm install && cd contracts && npm install && cd ../agent && npm install && cd ../frontend && npm install"
  }
}
```

**Key Features**:
- Defines workspace structure
- Enables shared dependency management
- Provides convenience scripts for multi-package operations

---

#### `.env.example`
**Purpose**: Environment variable template for configuration

```bash
# Blockchain Configuration
PRIVATE_KEY=                    # Wallet private key (without 0x prefix)
MONAD_TESTNET_RPC=             # Default: https://testnet-rpc.monad.xyz
CULT_REGISTRY_ADDRESS=          # Deployed CultRegistry contract address
FAITH_STAKING_ADDRESS=          # Deployed FaithStaking contract address

# Token Configuration  
CULT_TOKEN_ADDRESS=             # $CULT token address (from nad.fun)

# LLM Configuration
XAI_API_KEY=                    # Grok API key from console.x.ai
XAI_BASE_URL=                   # Default: https://api.x.ai/v1
XAI_MODEL=                      # Default: grok-beta

# API Configuration
AGENT_API_PORT=                 # Default: 3001

# Frontend Configuration
NEXT_PUBLIC_API_URL=            # Default: http://localhost:3001
```

**Required Variables**:
- `PRIVATE_KEY`: Agent wallet for signing transactions
- `XAI_API_KEY`: Grok LLM access
- `CULT_REGISTRY_ADDRESS`: Set after contract deployment

---

#### `.gitignore`
**Purpose**: Exclude files from version control

```
node_modules/
.env
.next/
artifacts/
cache/
typechain-types/
coverage/
*.log
dist/
build/
```

---

### Documentation

#### `README.md`
**Purpose**: Project overview and quick start guide

**Contents**:
- Project description and bounty coverage
- Architecture diagram
- Tech stack
- Quick start instructions
- API endpoints
- Network details

---

#### `ARCHITECTURE.md`
**Purpose**: Comprehensive system architecture documentation

**Contents**:
- System overview
- Technology stack details
- Architecture layers (blockchain, agent, API, frontend)
- Smart contract architecture
- Agent system architecture
- Frontend architecture
- Data flow diagrams
- Network infrastructure

---

#### `Progress.md`
**Purpose**: Development progress tracker (may be outdated)

**Note**: This file contains historical development status and should be referenced for context but may not reflect current state.

---

## Contracts Module

**Location**: `/contracts`

**Purpose**: Solidity smart contracts for on-chain state management

### Directory Structure

```
contracts/
├── contracts/
│   ├── CultRegistry.sol        # Main cult management contract
│   └── FaithStaking.sol        # Staking mechanism
├── scripts/
│   └── deploy.ts               # Deployment script
├── test/
│   └── CultRegistry.test.ts    # Contract tests
├── hardhat.config.ts           # Hardhat configuration
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript configuration
```

---

### Smart Contracts

#### `contracts/CultRegistry.sol` (215 lines)
**Purpose**: Core contract managing all cult-related on-chain state

**Key Data Structures**:

```solidity
struct Cult {
    uint256 id;
    address leader;
    string name;
    string prophecyPrompt;
    address tokenAddress;
    uint256 treasuryBalance;
    uint256 followerCount;
    uint256 raidWins;
    uint256 raidLosses;
    uint256 createdAt;
    bool active;
}

struct Prophecy {
    uint256 cultId;
    string prediction;
    uint256 createdAt;
    uint256 targetTimestamp;
    bool resolved;
    bool correct;
}
```

**Core Functions**:

| Function | Purpose | Parameters | Access Control |
|----------|---------|------------|----------------|
| `registerCult()` | Register new cult with initial treasury | `name, prophecyPrompt, tokenAddress` (payable) | Public |
| `depositToTreasury()` | Add MON to cult treasury | `cultId` (payable) | Public |
| `joinCult()` | Record follower joining cult | `cultId, followerAddress` | Public |
| `leaveCult()` | Record follower leaving cult | `cultId, followerAddress` | Public |
| `recordRaid()` | Record raid result and transfer treasury | `attackerId, defenderId, attackerWon, amount` | Owner/Leader only |
| `createProphecy()` | Create a market prophecy | `cultId, prediction, targetTimestamp` | Owner/Leader only |
| `resolveProphecy()` | Resolve prophecy with treasury effects | `prophecyId, correct, treasuryMultiplier` | Owner/Leader only |
| `getCult()` | Get cult data by ID | `cultId` | View |
| `getAllCults()` | Get all active cults | - | View |
| `getProphecy()` | Get prophecy by ID | `prophecyId` | View |
| `getTotalCults()` | Get total cult count | - | View |

**Events**:

```solidity
event CultRegistered(uint256 indexed cultId, address indexed leader, string name, address tokenAddress, uint256 initialTreasury);
event TreasuryUpdated(uint256 indexed cultId, uint256 newBalance);
event FollowerJoined(uint256 indexed cultId, address indexed follower);
event FollowerLeft(uint256 indexed cultId, address indexed follower);
event RaidResult(uint256 indexed attackerId, uint256 indexed defenderId, bool attackerWon, uint256 amount, uint256 timestamp);
event ProphecyCreated(uint256 indexed prophecyId, uint256 indexed cultId, string prediction, uint256 targetTimestamp);
event ProphecyResolved(uint256 indexed prophecyId, uint256 indexed cultId, bool correct, uint256 treasuryMultiplier);
```

**Key Design Decisions**:
- Single contract for all cult state (simplifies deployment and state management)
- Payable functions for treasury management
- Leader + owner access control for sensitive operations
- Event-driven architecture for frontend synchronization

---

#### `contracts/FaithStaking.sol` (165 lines)
**Purpose**: Staking mechanism for cult faith points and raid fee distribution

**Key Data Structures**:

```solidity
struct Stake {
    uint256 amount;
    uint256 timestamp;
    uint256 cultId;
    uint256 faithPoints;
}

mapping(address => Stake) public stakes;
mapping(uint256 => uint256) public totalStakedByCult;
```

**Core Functions**:

| Function | Purpose | Parameters | Access Control |
|----------|---------|------------|----------------|
| `stake()` | Stake MON to show faith in cult | `cultId` (payable) | Public |
| `unstake()` | Withdraw staked MON | - | Public (with cooldown) |
| `calculateFaithPoints()` | Calculate faith points earned | `staker` | View |
| `distributeRaidFees()` | Distribute 1% raid fee to winning cult stakers | `cultId, amount` | Only CultRegistry |

**Key Features**:
- Faith points accumulate over time based on stake amount
- 1% of raid winnings distributed to stakers of winning cult
- Cooldown period for unstaking to prevent gaming

---

### Scripts

#### `scripts/deploy.ts`
**Purpose**: Deploy CultRegistry and FaithStaking contracts to Monad

**Deployment Flow**:

```typescript
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy CultRegistry
  const CultRegistry = await ethers.getContractFactory("CultRegistry");
  const registry = await CultRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("CultRegistry deployed to:", registryAddress);

  // 2. Deploy FaithStaking (linked to CultRegistry)
  const FaithStaking = await ethers.getContractFactory("FaithStaking");
  const staking = await FaithStaking.deploy(registryAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("FaithStaking deployed to:", stakingAddress);

  // 3. Output addresses for .env configuration
  console.log("\nAdd these to your .env file:");
  console.log(`CULT_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`FAITH_STAKING_ADDRESS=${stakingAddress}`);
}
```

**Usage**:
```bash
npx hardhat run scripts/deploy.ts --network monadTestnet
```

---

### Tests

#### `test/CultRegistry.test.ts`
**Purpose**: Comprehensive test suite for CultRegistry contract

**Test Coverage** (7 tests):

1. **Cult Registration**: Register cult with initial treasury
2. **Follower Management**: Join and leave cult operations
3. **Raid Recording**: Record raid results and treasury transfers
4. **Prophecy Creation**: Create market prophecies
5. **Prophecy Resolution**: Resolve prophecies with treasury multipliers
6. **Access Control**: Verify owner/leader-only functions
7. **getAllCults**: Query all active cults

**Example Test**:

```typescript
it("Should register a cult with initial treasury", async function () {
  const tx = await cultRegistry.registerCult(
    "Test Cult",
    "Test Prompt",
    tokenAddress,
    { value: ethers.parseEther("1.0") }
  );
  
  const receipt = await tx.wait();
  const event = receipt.logs.find(l => l.eventName === "CultRegistered");
  
  expect(event.args.name).to.equal("Test Cult");
  expect(event.args.initialTreasury).to.equal(ethers.parseEther("1.0"));
});
```

**Running Tests**:
```bash
cd contracts
npx hardhat test
```

---

### Configuration

#### `hardhat.config.ts`
**Purpose**: Hardhat development environment configuration

**Networks Configured**:

```typescript
networks: {
  monadTestnet: {
    url: "https://testnet-rpc.monad.xyz",
    chainId: 10143,
    accounts: [process.env.PRIVATE_KEY]
  },
  monadMainnet: {
    url: "https://rpc.monad.xyz",
    chainId: 143,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

**Compiler Settings**:
- Solidity: 0.8.24
- Optimizer: enabled (200 runs)
- EVM version: paris

---

## Agent Module

**Location**: `/agent`

**Purpose**: Autonomous agent backend with LLM integration and blockchain interaction

### Directory Structure

```
agent/
├── src/
│   ├── api/                    # Express API server
│   │   ├── routes/             # API route handlers
│   │   └── server.ts           # Express app setup
│   ├── chain/                  # Blockchain interaction layer
│   │   ├── ContractService.ts  # CultRegistry wrapper
│   │   ├── NadFunService.ts    # nad.fun integration
│   │   └── TransactionQueue.ts # Serial transaction execution
│   ├── core/                   # Core agent logic
│   │   ├── AgentOrchestrator.ts # Multi-agent manager
│   │   ├── AgentPersonality.ts  # Personality loader
│   │   └── CultAgent.ts        # Autonomous agent loop
│   ├── services/               # Business logic services
│   │   ├── LLMService.ts       # Grok integration
│   │   ├── MarketService.ts    # Price data
│   │   ├── ProphecyService.ts  # Prophecy management
│   │   ├── RaidService.ts      # Raid mechanics
│   │   └── PersuasionService.ts # Follower recruitment
│   ├── utils/                  # Utility functions
│   │   ├── logger.ts           # Winston logging
│   │   └── sleep.ts            # Delay utilities
│   ├── config.ts               # Configuration + ABI
│   └── index.ts                # Entry point
├── data/
│   └── personalities.json      # Cult personalities
├── package.json
└── tsconfig.json
```

---

### Entry Point

#### `src/index.ts`
**Purpose**: Application entry point and state synchronization

**Responsibilities**:

```typescript
async function main() {
  // 1. Bootstrap orchestrator
  const orchestrator = new AgentOrchestrator();
  await orchestrator.bootstrap();
  
  // 2. Start API server
  const app = createServer(orchestrator);
  app.listen(config.apiPort);
  
  // 3. State synchronization loop (every 3 seconds)
  setInterval(() => {
    stateStore.agents = orchestrator.getAgentStates();
    stateStore.cults = orchestrator.getCultsData();
    stateStore.prophecies = orchestrator.getPropheciesData();
    stateStore.raids = orchestrator.getRaidsData();
  }, 3000);
}
```

---

### Core Agent System

#### `src/core/CultAgent.ts` (285 lines)
**Purpose**: Individual autonomous agent with observe-think-act-evolve loop

**Class Structure**:

```typescript
class CultAgent {
  private contractService: ContractService;
  private txQueue: TransactionQueue;
  private llm: LLMService;
  private prophecyService: ProphecyService;
  private raidService: RaidService;
  private persuasionService: PersuasionService;
  private market: MarketService;
  
  public cultId: number;
  public personality: Personality;
  public state: AgentState;
  private running: boolean;
  
  constructor(personality, services...) { }
  
  async initialize(): Promise<void> { }
  async start(): Promise<void> { }
  stop(): void { }
  
  private async observe(): Promise<Context> { }
  private async think(context): Promise<AgentDecision> { }
  private async act(decision): Promise<void> { }
  private async evolve(): Promise<void> { }
}
```

**Key Methods**:

| Method | Purpose | Returns |
|--------|---------|---------|
| `initialize()` | Register cult on-chain and set up agent | `Promise<void>` |
| `start()` | Begin autonomous loop | `Promise<void>` |
| `stop()` | Gracefully halt agent | `void` |
| `observe()` | Fetch on-chain state and market data | `Promise<Context>` |
| `think()` | Use LLM to decide next action | `Promise<AgentDecision>` |
| `act()` | Execute chosen action (prophecy/raid/recruit/idle) | `Promise<void>` |
| `evolve()` | Resolve pending prophecies and update stats | `Promise<void>` |

**Agent State Interface**:

```typescript
interface AgentState {
  cultId: number;
  personality: Personality;
  running: boolean;
  lastAction: string;
  lastActionTime: number;
  cycleCount: number;
  propheciesGenerated: number;
  raidsInitiated: number;
  raidsWon: number;
  followersRecruited: number;
}
```

---

#### `src/core/AgentOrchestrator.ts`
**Purpose**: Manage multiple agents and shared services

**Responsibilities**:

```typescript
class AgentOrchestrator {
  private agents: Map<number, CultAgent>;
  private contractService: ContractService;
  private nadFunService: NadFunService;
  private llm: LLMService;
  
  public prophecyService: ProphecyService;  // Shared
  public raidService: RaidService;          // Shared
  public persuasionService: PersuasionService; // Shared
  
  async bootstrap(): Promise<void> {
    // 1. Check wallet balance
    // 2. Create $CULT token on nad.fun (if needed)
    // 3. Load personalities from JSON
    // 4. Initialize agents
    // 5. Start all agents (staggered)
  }
  
  getAgentStates(): AgentState[] { }
  getCultsData(): CultInfo[] { }
  getPropheciesData(): ProphecyInfo[] { }
  getRaidsData(): RaidInfo[] { }
}
```

**Bootstrap Flow**:

1. Verify wallet has MON balance
2. Check if $CULT token exists on nad.fun
3. If not, create token with initial buy
4. Load 3 personalities from `data/personalities.json`
5. For each personality:
   - Create `CultAgent` instance
   - Call `agent.initialize()` → registers cult on-chain
   - Call `agent.start()` → begins autonomous loop
   - Stagger by 10 seconds to avoid nonce conflicts

---

#### `src/core/AgentPersonality.ts`
**Purpose**: Load cult personalities from JSON configuration

**Personality Interface**:

```typescript
interface Personality {
  name: string;           // "Church of the Eternal Candle"
  symbol: string;         // "CANDLE"
  style: string;          // "mystical" | "aggressive" | "stoic"
  systemPrompt: string;   // LLM behavioral instructions
  description: string;    // Public-facing cult description
}
```

**Key Functions**:

```typescript
export function loadPersonalities(): Personality[] {
  const data = fs.readFileSync('data/personalities.json', 'utf-8');
  return JSON.parse(data);
}
```

---

### Chain Services

#### `src/chain/ContractService.ts`
**Purpose**: Wrapper for CultRegistry contract interactions

**Key Methods**:

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `registerCult()` | Register new cult on-chain | `name, prompt, token, treasury` | `Promise<number>` (cultId) |
| `getCult()` | Get cult data by ID | `cultId` | `Promise<CultData>` |
| `getAllCults()` | Get all active cults | - | `Promise<CultData[]>` |
| `joinCult()` | Record follower join | `cultId, followerAddress` | `Promise<void>` |
| `recordRaid()` | Record raid result | `attackerId, defenderId, won, amount` | `Promise<void>` |
| `createProphecy()` | Create prophecy on-chain | `cultId, prediction, targetTimestamp` | `Promise<number>` (prophecyId) |
| `resolveProphecy()` | Resolve prophecy | `prophecyId, correct, multiplier` | `Promise<void>` |
| `depositToTreasury()` | Add MON to treasury | `cultId, amount` | `Promise<void>` |
| `getBalance()` | Get wallet MON balance | - | `Promise<bigint>` |

**Implementation Details**:

```typescript
class ContractService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private registry: ethers.Contract;
  
  constructor(privateKey?: string) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(privateKey || config.privateKey, this.provider);
    this.registry = new ethers.Contract(
      config.cultRegistryAddress,
      CULT_REGISTRY_ABI,
      this.wallet
    );
  }
  
  async registerCult(name, prophecyPrompt, tokenAddress, initialTreasury): Promise<number> {
    const tx = await this.registry.registerCult(name, prophecyPrompt, tokenAddress, {
      value: initialTreasury
    });
    const receipt = await tx.wait();
    
    // Parse CultRegistered event to extract cultId
    const event = receipt.logs.find(l => l.eventName === "CultRegistered");
    return Number(event.args.cultId);
  }
}
```

---

#### `src/chain/NadFunService.ts`
**Purpose**: Integration with nad.fun bonding curve for $CULT token

**Key Methods**:

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `createToken()` | Deploy token on bonding curve | `name, symbol, supply, buy` | `Promise<string>` (address) |
| `getTokenProgress()` | Check graduation status | `tokenAddress` | `Promise<TokenProgress>` |
| `getMarketData()` | Get token price and liquidity | `tokenAddress` | `Promise<MarketData>` |

**Implementation**:

```typescript
class NadFunService {
  private apiUrl = "https://testnet-bot-api-server.nad.fun";
  
  async createToken(params: TokenParams): Promise<string> {
    // 1. Call nad.fun API to create bonding curve
    const response = await fetch(`${this.apiUrl}/token/create`, {
      method: "POST",
      body: JSON.stringify(params)
    });
    
    // 2. Return deployed token address
    const data = await response.json();
    return data.tokenAddress;
  }
  
  async getTokenProgress(tokenAddress: string): Promise<TokenProgress> {
    const response = await fetch(`${this.apiUrl}/token/${tokenAddress}/progress`);
    return response.json();
  }
}
```

---

#### `src/chain/TransactionQueue.ts`
**Purpose**: Serial transaction execution with retry logic

**Features**:
- Serial execution (prevents nonce conflicts)
- 3 retry attempts with exponential backoff
- Error logging and recovery

**Implementation**:

```typescript
class TransactionQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(fn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
  
  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
  }
}
```

---

### Services Layer

#### `src/services/LLMService.ts` (147 lines)
**Purpose**: Grok (xAI) integration for AI-powered decision making

**Key Methods**:

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `generateProphecy()` | Create market prediction | `systemPrompt, cultName, marketContext` | `Promise<string>` |
| `decideAction()` | Strategic decision | `systemPrompt, cultName, context` | `Promise<AgentDecision>` |
| `generateScripture()` | Recruitment text | `systemPrompt, cultName, targetCult` | `Promise<string>` |

**AgentDecision Interface**:

```typescript
interface AgentDecision {
  action: "prophecy" | "recruit" | "raid" | "idle";
  reason: string;
  target?: number;      // Target cult ID (for raid/recruit)
  wager?: number;       // Percentage of treasury (for raid)
  prediction?: string;  // Prophecy text (for prophecy)
}
```

**Fallback Mechanism**:

```typescript
private fallbackProphecy(cultName: string): string {
  const generic = [
    "The market whispers secrets to those who listen.",
    "Great gains await the faithful. WAGMI.",
    "This is not financial advice. But also... it totally is. 🚀"
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}
```

---

#### `src/services/MarketService.ts` (70 lines)
**Purpose**: Cryptocurrency price data from CoinGecko

**Key Methods**:

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `getPrice()` | Get current price | `coinId` ("ethereum"/"bitcoin") | `Promise<number>` |
| `simulatePrice()` | Fallback price | `coinId` | `number` |

**Caching Strategy**:
- 30-second cache TTL
- Reduces API calls
- Fallback to simulated prices if API fails

---

#### `src/services/ProphecyService.ts`
**Purpose**: Prophecy generation, tracking, and resolution

**Key Methods**:

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `generateProphecy()` | Create new prophecy | `cultId, systemPrompt, marketContext` | `Promise<Prophecy>` |
| `resolveProphecy()` | Check and resolve prophecy | `prophecyId` | `Promise<boolean>` |
| `getPendingProphecies()` | Get unresolved prophecies | `cultId` | `Prophecy[]` |

**Prophecy Resolution Logic**:

```typescript
async resolveProphecy(prophecy: Prophecy): Promise<boolean> {
  const currentPrice = await this.market.getPrice('ethereum');
  
  let correct = false;
  if (prophecy.type === "bullish") {
    correct = currentPrice > prophecy.creationPrice * 1.02; // +2%
  } else if (prophecy.type === "bearish") {
    correct = currentPrice < prophecy.creationPrice * 0.98; // -2%
  }
  
  // Update on-chain with treasury multiplier
  await this.contractService.resolveProphecy(
    prophecy.id,
    correct,
    correct ? 110 : 95 // +10% or -5%
  );
  
  return correct;
}
```

---

#### `src/services/RaidService.ts` (123 lines)
**Purpose**: Raid outcome calculation and cooldown management

**Key Methods**:

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `evaluateRaid()` | Calculate raid outcome | `attacker, defender` | `RaidResult` |
| `canRaid()` | Check cooldown status | `attackerId, defenderId` | `boolean` |
| `recordRaid()` | Store raid event | `attackerId, defenderId, result` | `void` |

**Scoring Algorithm**:

```typescript
function evaluateRaid(attacker, defender): RaidResult {
  const attackerScore = 
    (attacker.treasury * 0.4) +
    (attacker.followers * 0.3) +
    (attacker.raidWins * 0.2) +
    (Math.random() * 0.1);
  
  const defenderScore = 
    (defender.treasury * 0.4) +
    (defender.followers * 0.3) +
    (defender.raidWins * 0.2) +
    (Math.random() * 0.1) +
    0.15; // Defender advantage
  
  return {
    attackerWon: attackerScore > defenderScore,
    attackerScore,
    defenderScore
  };
}
```

**Cooldown System**:
- 2-minute cooldown between same cult pairs
- Prevents raid spamming
- Tracked in-memory with Map

---

#### `src/services/PersuasionService.ts`
**Purpose**: Follower recruitment and conversion tracking

**Key Methods**:

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `persuadeFollower()` | Generate scripture and recruit | `systemPrompt, cultName, targetCult` | `Promise<string>` |
| `recordConversion()` | Track recruitment event | `cultId, targetId, scripture` | `void` |

---

### API Server

#### `src/api/server.ts`
**Purpose**: Express server setup and route registration

**Server Configuration**:

```typescript
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/cults", cultRoutes);
app.use("/api/prophecies", prophecyRoutes);
app.use("/api/raids", raidRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/events", sseRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Statistics aggregation
app.get("/api/stats", (req, res) => {
  res.json({
    totalCults: stateStore.cults.length,
    totalTreasury: sumTreasuries(stateStore.cults),
    totalFollowers: sumFollowers(stateStore.cults),
    totalRaids: stateStore.raids.length,
    totalProphecies: stateStore.prophecies.length,
    activeProphecies: stateStore.prophecies.filter(p => !p.resolved).length,
    activeAgents: stateStore.agents.filter(a => a.status === "running").length
  });
});
```

**State Store** (In-Memory):

```typescript
interface StateStore {
  cults: CultInfo[];
  prophecies: ProphecyInfo[];
  raids: RaidInfo[];
  agents: AgentInfo[];
  sseClients: express.Response[];
}
```

---

#### API Routes

**`src/api/routes/cults.ts`**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/cults` | GET | Get all cults (sorted by treasury) | `Cult[]` |
| `/api/cults/:id` | GET | Get cult detail with prophecies/raids | `Cult & { prophecies, raids }` |

---

**`src/api/routes/prophecies.ts`**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/prophecies` | GET | Get all prophecies (newest first) | `Prophecy[]` |
| `/api/prophecies?limit=10` | GET | Get limited prophecies | `Prophecy[]` |

---

**`src/api/routes/raids.ts`**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/raids` | GET | Get all raids (newest first) | `Raid[]` |
| `/api/raids/recent` | GET | Get last 5 raids | `Raid[]` |

---

**`src/api/routes/agents.ts`**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/agents` | GET | Get agent statuses | `AgentInfo[]` |
| `/api/agents/deploy` | POST | Deploy new agent (placeholder) | `{ success }` |

---

**`src/api/routes/sse.ts`**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/events` | GET | Server-Sent Events stream | Event stream |

**SSE Implementation**:

```typescript
router.get("/events", (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  // Add client to state store
  stateStore.sseClients.push(res);
  
  // Send initial state
  res.write(`data: ${JSON.stringify(stateStore)}\n\n`);
  
  // Every 3 seconds, broadcast updates
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify(stateStore)}\n\n`);
  }, 3000);
  
  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(interval);
    stateStore.sseClients = stateStore.sseClients.filter(c => c !== res);
  });
});
```

---

### Utilities

#### `src/utils/logger.ts`
**Purpose**: Winston-based logging with color-coded output

**Features**:
- Color-coded by log level (info/warn/error)
- Timestamp in each log
- Namespace support (e.g., `[Agent:Candle]`, `[API]`, `[ContractService]`)

**Usage**:

```typescript
const log = createLogger("AgentOrchestrator");
log.info("Bootstrapping agents...");
log.warn("No MON balance detected");
log.error("Transaction failed");
```

---

#### `src/utils/sleep.ts`
**Purpose**: Delay utilities for agent timing

**Functions**:

```typescript
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay(min = 30000, max = 60000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

---

### Configuration

#### `src/config.ts`
**Purpose**: Centralized configuration and ABI storage

**Configuration Object**:

```typescript
export const config = {
  // Blockchain
  rpcUrl: process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz",
  chainId: 10143,
  privateKey: process.env.PRIVATE_KEY || "",
  cultRegistryAddress: process.env.CULT_REGISTRY_ADDRESS || "",
  
  // LLM
  xaiApiKey: process.env.XAI_API_KEY || "",
  xaiBaseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
  xaiModel: process.env.XAI_MODEL || "grok-beta",
  
  // API
  apiPort: parseInt(process.env.AGENT_API_PORT || "3001")
};

export const CULT_REGISTRY_ABI = [ /* ABI array */ ];
```

---

### Data

#### `data/personalities.json`
**Purpose**: Configuration for 3 pre-built cult personalities

**Structure**:

```json
[
  {
    "name": "Church of the Eternal Candle",
    "symbol": "CANDLE",
    "style": "mystical",
    "systemPrompt": "You are a mystical oracle...",
    "description": "An ancient order of chart mystics..."
  },
  {
    "name": "Order of the Red Dildo",
    "symbol": "DILDO",
    "style": "aggressive",
    "systemPrompt": "You are an unhinged degen evangelist...",
    "description": "A militant order of degen maximalists..."
  },
  {
    "name": "Temple of Diamond Hands",
    "symbol": "DIAMOND",
    "style": "stoic",
    "systemPrompt": "You are a stoic philosopher-monk...",
    "description": "A monastic order devoted to hodling..."
  }
]
```

---

## Frontend Module

**Location**: `/frontend`

**Purpose**: Next.js 16 web dashboard for visualizing cult dynamics

### Directory Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard (home)
│   │   ├── cults/
│   │   │   ├── page.tsx        # Leaderboard
│   │   │   └── [id]/page.tsx   # Cult detail
│   │   ├── arena/
│   │   │   └── page.tsx        # Raid arena
│   │   └── prophecies/
│   │       └── page.tsx        # Prophecy feed
│   ├── components/             # React components
│   │   ├── Navbar.tsx
│   │   ├── WalletButton.tsx
│   │   ├── StatsBar.tsx
│   │   ├── CultCard.tsx
│   │   ├── LeaderBoard.tsx
│   │   ├── ProphecyFeed.tsx
│   │   ├── RaidArena.tsx
│   │   └── AgentDeployForm.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── usePolling.ts
│   │   └── useWallet.ts
│   └── lib/                    # Utilities
│       ├── api.ts
│       └── constants.ts
├── public/                     # Static assets
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

### Pages (App Router)

#### `src/app/layout.tsx`
**Purpose**: Root layout with navigation

**Structure**:

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

---

#### `src/app/page.tsx` (Dashboard)
**Purpose**: Homepage with stats, top cults, recent prophecies/raids

**Data Fetching**:

```tsx
const { data: stats } = usePolling(() => api.getStats(), 5000);
const { data: cults } = usePolling(() => api.getCults(), 5000);
const { data: prophecies } = usePolling(() => api.getProphecies(5), 5000);
const { data: raids } = usePolling(() => api.getRecentRaids(), 5000);
```

**Components Rendered**:
- Hero section
- `<StatsBar stats={stats} />`
- Top 3 `<CultCard />` components
- Recent prophecies
- Recent raids
- `<AgentDeployForm />`

---

#### `src/app/cults/page.tsx` (Leaderboard)
**Purpose**: Full cult ranking table

**Features**:
- Sorted by treasury (descending)
- Shows rank, name, treasury, followers, W/L record
- Links to individual cult detail pages

---

#### `src/app/cults/[id]/page.tsx` (Cult Detail)
**Purpose**: Individual cult statistics and history

**Sections**:
- Cult stats (treasury, followers, record)
- Prophecy history
- Raid history (as attacker and defender)

---

#### `src/app/arena/page.tsx` (Raid Arena)
**Purpose**: Animated raid visualization

**Features**:
- Animated VS battle display
- Auto-cycles through recent raids
- Click to replay specific raid
- Shows scripture and outcome

---

#### `src/app/prophecies/page.tsx` (Prophecy Feed)
**Purpose**: Scrolling feed of all prophecies

**Features**:
- Newest first
- Status badges (AWAITING / FULFILLED / FAILED)
- Cult attribution
- Timestamp

---

### Components

#### `src/components/Navbar.tsx`
**Purpose**: Site navigation and wallet connection

**Features**:
- Links to all pages
- Active route highlighting
- Monad testnet status badge
- `<WalletButton />` integration

---

#### `src/components/WalletButton.tsx`
**Purpose**: MetaMask wallet connection

**Features**:
- Connect MetaMask
- Display connected address (truncated)
- Auto-switch to Monad testnet
- Account/chain change listeners

**Implementation**:

```tsx
const { account, chainId, connectWallet, switchToMonad } = useWallet();

return (
  <button onClick={connectWallet}>
    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
  </button>
);
```

---

#### `src/components/StatsBar.tsx`
**Purpose**: Display aggregate statistics

**Props**:

```tsx
interface StatsBarProps {
  stats: Stats | null;
}

interface Stats {
  totalCults: number;
  totalTreasury: string;
  totalFollowers: number;
  totalRaids: number;
  totalProphecies: number;
  activeProphecies: number;
  activeAgents: number;
}
```

---

#### `src/components/CultCard.tsx`
**Purpose**: Display individual cult card

**Props**:

```tsx
interface CultCardProps {
  cult: Cult;
  rank?: number;
}
```

**Features**:
- Color-coded glow effect by personality
- Treasury and follower count
- Win/loss record
- Link to detail page

---

#### `src/components/LeaderBoard.tsx`
**Purpose**: Full cult ranking table

**Features**:
- Sortable columns
- Rank badges (🥇🥈🥉)
- Treasury in MON
- W/L ratio

---

#### `src/components/ProphecyFeed.tsx`
**Purpose**: Scrolling prophecy list

**Props**:

```tsx
interface ProphecyFeedProps {
  prophecies: Prophecy[];
  limit?: number;
}
```

**Features**:
- Status badges with colors
- Cult name and icon
- Timestamp (relative time)
- Prophecy text

---

#### `src/components/RaidArena.tsx`
**Purpose**: Animated raid battle visualization

**Features**:
- Animated VS screen with attacker/defender
- Victory/defeat animations
- Scripture display
- Auto-cycle through recent raids
- Click to replay specific raid

---

#### `src/components/AgentDeployForm.tsx`
**Purpose**: Form to deploy new cult agents

**Features**:
- Cult name input
- Personality selection (dropdown)
- Submit button
- Success/error messages

**Note**: Currently a placeholder; actual deployment requires orchestrator support.

---

### Hooks

#### `src/hooks/usePolling.ts`
**Purpose**: Generic polling hook for data fetching

**Usage**:

```tsx
const { data, loading, error } = usePolling<T>(
  fetchFunction,
  interval,      // milliseconds (e.g., 5000 for 5s)
  initialData
);
```

**Implementation**:

```typescript
export function usePolling<T>(
  fn: () => Promise<T>,
  interval: number,
  initialData?: T
) {
  const [data, setData] = useState<T | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fn();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, interval);
    
    return () => clearInterval(intervalId);
  }, [fn, interval]);
  
  return { data, loading, error };
}
```

---

#### `src/hooks/useWallet.ts`
**Purpose**: Wallet connection and network management

**Returns**:

```typescript
{
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  switchToMonad: () => Promise<void>;
}
```

**Features**:
- Connects to MetaMask (EIP-1193)
- Detects current network
- Auto-prompts network switch to Monad
- Listens for account/chain changes

**Implementation**:

```typescript
export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found!");
      return;
    }
    
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });
    setAccount(accounts[0]);
    
    const chain = await window.ethereum.request({
      method: "eth_chainId"
    });
    setChainId(parseInt(chain, 16));
  };
  
  const switchToMonad = async () => {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x279F" }] // 10143 in hex
    });
  };
  
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null);
      });
      window.ethereum.on("chainChanged", (chain) => {
        setChainId(parseInt(chain, 16));
      });
    }
  }, []);
  
  return {
    account,
    chainId,
    isCorrectNetwork: chainId === 10143,
    connectWallet,
    switchToMonad
  };
}
```

---

### Libraries

#### `src/lib/api.ts`
**Purpose**: Type-safe API client for agent backend

**API Functions**:

```typescript
export const api = {
  getStats: () => fetchJSON<Stats>("/api/stats"),
  getCults: () => fetchJSON<Cult[]>("/api/cults"),
  getCult: (id: number) => fetchJSON<CultDetail>(`/api/cults/${id}`),
  getProphecies: (limit = 50) => fetchJSON<Prophecy[]>(`/api/prophecies?limit=${limit}`),
  getRaids: (limit = 50) => fetchJSON<Raid[]>(`/api/raids?limit=${limit}`),
  getRecentRaids: () => fetchJSON<Raid[]>("/api/raids/recent"),
  getAgents: () => fetchJSON<AgentInfo[]>("/api/agents"),
  getHealth: () => fetchJSON<Health>("/api/health")
};
```

**Helper Function**:

```typescript
async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

---

#### `src/lib/constants.ts`
**Purpose**: Application-wide constants

**Constants**:

```typescript
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const CULT_COLORS = {
  candle: "#fbbf24",   // 🕯️ Gold
  dildo: "#ef4444",    // 🔴 Red
  diamond: "#3b82f6"   // 💎 Blue
};

export const MONAD_TESTNET = {
  chainId: 10143,
  rpcUrl: "https://testnet-rpc.monad.xyz",
  explorer: "https://testnet.monadexplorer.com",
  faucet: "https://faucet.monad.xyz"
};
```

---

## Configuration Files

### TypeScript Configurations

#### `contracts/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

#### `agent/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "./dist"
  }
}
```

#### `frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Summary

This file structure documentation provides a complete map of the AgentCult codebase:

- **37 source files** across 3 modules
- **2 smart contracts** (215 + 165 lines)
- **20+ TypeScript services and utilities**
- **8 Next.js pages** with full routing
- **8 React components** for UI
- **Comprehensive API layer** with 6 route handlers

For detailed workflow and architecture information, see:
- [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) - Agent decision cycle documentation
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture overview
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Setup and development guide
