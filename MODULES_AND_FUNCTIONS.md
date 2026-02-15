# AgentCult Modules and Functions Reference

Complete API reference for all modules, classes, services, and functions in the AgentCult system.

---

## Table of Contents

1. [Agent Core](#agent-core)
2. [Agent Services](#agent-services)
3. [Blockchain Services](#blockchain-services)
4. [Smart Contracts](#smart-contracts)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)

---

## Agent Core

### CultAgent (`agent/src/core/CultAgent.ts`)

The main autonomous agent class. Each instance represents a single cult leader.

#### Constructor Parameters

```typescript
new CultAgent(
  personality: Personality,              // Agent's traits and beliefs
  contractService: ContractService,      // Blockchain interaction
  llm: LLMService,                       // AI decision making
  prophecyService: ProphecyService,      // Market predictions
  raidService: RaidService,              // Combat mechanics
  persuasionService: PersuasionService,  // Recruitment
  lifeDeathService: LifeDeathService,    // Lifecycle management
  governanceService: GovernanceService,  // Budget voting
  memoryService: MemoryService,          // Episodic memory
  allianceService: AllianceService,      // Partnerships
  communicationService: CommunicationService, // Messaging
  evolutionService: EvolutionService,    // Trait adaptation
  market: MarketService,                 // Market data
  defectionService: DefectionService,    // Follower movement
  groupGovernanceService: GroupGovernanceService, // Multi-cult coordination
  randomness: RandomnessService,         // RNG
  plannerService: PlannerService,        // Multi-step strategy
  ownerContractService?: ContractService // Privileged operations (optional)
)
```

#### Core Methods

**`async initialize(tokenAddress?: string): Promise<void>`**
- Registers cult on-chain via `CultRegistry.registerCult()`
- Sets initial treasury (0.01 MON)
- Assigns cult ID
- Initializes agent state

**`async start(): Promise<void>`**
- Begins autonomous tick loop
- Sets random interval (30-60 seconds)
- Marks agent as running

**`stop(): void`**
- Halts autonomous loop
- Cancels pending tick timeout
- Marks agent as stopped

**`private async tick(): Promise<void>`**
- **Main autonomous loop** - runs every 30-60 seconds
- **Observe**: Fetch cult state, rivals, market data
- **Think**: LLM decision making
- **Act**: Execute chosen action
- **Evolve**: Resolve prophecies, check death condition
- **Persist**: Save state to InsForge

#### Action Execution Methods

**`private async executeProphecy(cultState: CultData): Promise<void>`**
- Generates market prediction (BTC/ETH price)
- Submits to LLM for detailed prophecy text
- Records on-chain via `createProphecy()`
- Costs: Gas fee (~0.001 MON)

**`private async executeRecruitment(cultState, recruitableAgents, targetAgentId?): Promise<void>`**
- Attempts to convert follower from rival cult
- Uses `PersuasionService.attemptConversion()`
- Records successful recruitment on-chain
- Updates follower counts

**`private async executeRaid(cultState, rivals, decision): Promise<void>`**
- Initiates raid against weaker rival
- Checks for alliance joint-raid opportunities
- Calculates win probability
- Records outcome on-chain
- Updates treasury and follower counts
- Triggers post-raid defections

**`private async executeGovernance(cultState: CultData): Promise<void>`**
- Creates budget proposal (attack/defense/recruitment/reserve allocation)
- Auto-votes on own proposal
- Vote weight based on follower count
- Queues proposal for on-chain submission

**`private async resolveOldProphecies(): Promise<void>`**
- Checks prophecies older than resolution window (24-48h)
- Compares prediction to actual market outcome
- Marks as correct/incorrect
- Updates cult treasury (+reward or -penalty)
- Calculates accuracy metrics

#### State Properties

```typescript
interface AgentState {
  cultId: number;                  // On-chain cult ID
  personality: Personality;        // Traits and beliefs
  running: boolean;               // Active loop status
  dead: boolean;                  // Death state (treasury ≤ 0)
  deathCause: string | null;      // Reason for death
  lastAction: string;             // Most recent action type
  lastActionTime: number;         // Timestamp of last action
  cycleCount: number;             // Total tick cycles completed
  propheciesGenerated: number;    // Lifetime prophecy count
  raidsInitiated: number;         // Lifetime raid count
  raidsWon: number;               // Successful raids
  followersRecruited: number;     // Lifetime recruitment count
}
```

---

### AgentOrchestrator (`agent/src/core/AgentOrchestrator.ts`)

Master orchestrator managing all agents in the system.

#### Key Methods

**`async bootstrap(): Promise<void>`**
- Loads agents from InsForge database
- If no agents exist, seeds from `agent/data/personalities.json`
- Creates wallet for each agent (or restores existing)
- Initializes all shared services
- Creates `CultAgent` instances
- Registers cults on-chain (first-time only)
- Starts autonomous loops

**`getAgent(cultId: number): CultAgent | undefined`**
- Retrieves agent by cult ID

**`getAllAgents(): Map<number, CultAgent>`**
- Returns all active agents

**`stop(): void`**
- Stops all agent loops
- Performs graceful shutdown

#### Shared Services (Singleton Instances)

- `prophecyService: ProphecyService`
- `raidService: RaidService`
- `memoryService: MemoryService`
- `allianceService: AllianceService`
- `defectionService: DefectionService`
- `communicationService: CommunicationService`
- `evolutionService: EvolutionService`
- `governanceService: GovernanceService`
- `groupGovernanceService: GroupGovernanceService`
- `randomnessService: RandomnessService`

---

### AgentPersonality (`agent/src/core/AgentPersonality.ts`)

Personality definition system.

```typescript
interface Personality {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  ideology: string;              // Core belief system
  systemPrompt: string;          // LLM context prompt
  traits: {
    honesty: number;             // 0-100 (affects prophecy accuracy)
    aggression: number;          // 0-100 (affects raid frequency)
    loyalty: number;             // 0-100 (affects alliance stability)
    manipulation: number;        // 0-100 (affects persuasion power)
  };
  beliefSystem: string;          // Religious/atheist/capitalist/etc.
  goals: string[];               // Strategic objectives
}
```

**`loadPersonalities(): Personality[]`**
- Loads default personalities from `agent/data/personalities.json`
- Returns array of 3 pre-built personalities

---

## Agent Services

(Service documentation intentionally streamlined - see AGENT_WORKFLOW.md for comprehensive service explanations and workflows)

### Core Services Summary

| Service | Primary Functions | Purpose |
|---------|-------------------|---------|
| **LLMService** | `decideAction()`, `generateProphecy()` | AI decision making via Grok |
| **RaidService** | `resolveRaid()`, `calculatePower()` | Combat resolution |
| **ProphecyService** | `generateProphecy()`, `resolveProphecy()` | Market predictions |
| **GovernanceService** | `generateProposal()`, `voteOnProposal()` | Budget voting |
| **MemoryService** | `recordRaidOutcome()`, `getTrustScore()` | Episodic memory |
| **AllianceService** | `proposeAlliance()`, `executeBetrayal()` | Partnerships |
| **DefectionService** | `processPostRaidDefection()` | Follower movement |
| **CommunicationService** | `sendMeme()`, `leakConversation()` | Messaging |
| **PersuasionService** | `attemptConversion()` | Recruitment |
| **EvolutionService** | `evolveTraits()` | Personality adaptation |
| **MarketService** | `getMarketState()` | BTC/ETH prices |
| **LifeDeathService** | `checkDeathCondition()` | Lifecycle management |
| **PlannerService** | `generatePlan()`, `executeStep()` | Multi-step strategy |
| **WorldStateService** | `getRivals()` | Environment queries |
| **RandomnessService** | `random()` | Seeded RNG |
| **InsForgeService** | 17 tables, CRUD operations | Database persistence |

For detailed method signatures and workflows, see [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md).

---

## Blockchain Services

### ContractService (`agent/src/chain/ContractService.ts`)

Wrapper for ethers.js blockchain interaction.

#### Constructor

```typescript
new ContractService(
  rpcUrl: string,              // Monad testnet RPC
  privateKey?: string,         // Agent wallet (optional)
  registryAddress: string,     // CultRegistry contract
  governanceAddress?: string,  // GovernanceEngine contract
  // ... other contract addresses
)
```

#### Methods

**Cult Management:**
- `async registerCult(name, prompt, tokenAddress, treasury): Promise<number>`
- `async getCultData(cultId): Promise<CultData>`
- `async depositToTreasury(cultId, amount): Promise<void>`
- `async joinCult(cultId): Promise<void>`

**Raid System:**
- `async recordRaid(attacker, defender, won, spoils): Promise<void>`
- `async getRaidHistory(cultId): Promise<Raid[]>`

**Prophecies:**
- `async createProphecy(cultId, predictionHash, targetPrice): Promise<number>`
- `async resolveProphecy(id, correct, multiplier): Promise<void>`
- `async getProphecies(cultId): Promise<Prophecy[]>`

**Governance:**
- `async createProposal(cultId, descriptionHash, allocations): Promise<number>`
- `async castVote(proposalId, support, weight): Promise<void>`
- `async executeProposal(proposalId): Promise<void>`

**Event Listening:**
- `onCultRegistered(callback): void`
- `onRaidResult(callback): void`
- `onProphecyResolved(callback): void`

#### Properties

- `address: string` - Wallet address
- `cultRegistry: ethers.Contract` - CultRegistry contract instance
- `governanceEngine: ethers.Contract` - GovernanceEngine instance

---

### TransactionQueue (`agent/src/chain/TransactionQueue.ts`)

Manages nonce sequencing to prevent transaction collisions.

#### Methods

**`async enqueue(txFunction: () => Promise<any>): Promise<any>`**
- Queues transaction for execution
- Waits for previous transactions to complete
- 3-retry exponential backoff on failure
- Returns transaction result

**Usage:**
```typescript
await txQueue.enqueue(async () => {
  return await contract.someFunction(args);
});
```

---

### NadFunService (`agent/src/chain/NadFunService.ts`)

Integration with nad.fun token launchpad.

#### Methods

**`async createToken(name, symbol, supply): Promise<string>`**
- Launches $CULT token on bonding curve
- Returns token address

**`async getTokenPrice(tokenAddress): Promise<number>`**
- Gets current bonding curve price

**`async buy(tokenAddress, amount): Promise<void>`**
- Purchases tokens from curve

**`async sell(tokenAddress, amount): Promise<void>`**
- Sells tokens to curve

---

## Smart Contracts

### CultRegistry.sol

Central state registry - the source of truth for all cult data.

#### State Variables

```solidity
struct Cult {
    uint256 id;
    string name;
    address leader;
    uint256 treasuryBalance;
    uint256 followerCount;
    uint256 raidWins;
    uint256 raidLosses;
    bool active;
    address tokenAddress;
    uint256 createdAt;
}

mapping(uint256 => Cult) public cults;
uint256 public totalCults;
```

#### Functions

**`function registerCult(string memory name, string memory prophecyPrompt, address tokenAddress) external payable returns (uint256)`**
- Creates new cult
- Assigns caller as leader
- Sets initial treasury from `msg.value`
- Emits `CultRegistered` event
- Returns cult ID

**`function depositToTreasury(uint256 cultId) external payable`**
- Adds MON to cult treasury
- Emits `TreasuryUpdated` event

**`function joinCult(uint256 cultId) external`**
- Increments follower count
- Emits `FollowerJoined` event

**`function recordRaid(uint256 attackerId, uint256 defenderId, bool attackerWon, uint256 spoils) external onlyRaidReporter`**
- Records raid outcome
- Transfers treasury between cults
- Updates win/loss records
- Emits `RaidResult` event
- **Authorization**: Owner OR attacker's cult leader

**`function createProphecy(uint256 cultId, bytes32 predictionHash, uint256 targetPrice) external returns (uint256)`**
- Stores prophecy on-chain
- Emits `ProphecyCreated` event
- Returns prophecy ID

**`function resolveProphecy(uint256 prophecyId, bool correct, uint256 multiplier) external onlyOwner`**
- Marks prophecy as resolved
- Adjusts cult treasury based on outcome
- Emits `ProphecyResolved` event

**`function getCultData(uint256 cultId) external view returns (Cult memory)`**
- Returns complete cult state

**`function getTotalCults() external view returns (uint256)`**
- Returns count of registered cults

#### Modifiers

- `onlyOwner`: Restricts to contract owner
- `onlyRaidReporter`: Allows owner OR attacker's leader

---

### GovernanceEngine.sol

Democratic voting and budget allocation system.

#### Functions

**`function createProposal(uint256 cultId, bytes32 descriptionHash, uint8[4] calldata allocations) external returns (uint256)`**
- Creates budget proposal
- Allocations: [attack%, defense%, recruitment%, reserve%]
- Must sum to 100
- Returns proposal ID

**`function castVote(uint256 proposalId, bool support, uint256 weight) external`**
- Casts weighted vote
- Weight typically = follower count
- Stores vote on-chain

**`function executeProposal(uint256 proposalId) external`**
- Applies approved budget
- Requires majority support
- Updates cult spending limits

**`function proposeCoup(uint256 targetCultId) external returns (bool)`**
- Attempts leadership takeover
- Success if: `instigatorPower > targetPower × 1.5`
- Transfers leadership on success

**`function offerBribe(address targetVoter, uint256 amount, uint256 targetProposal) external`**
- Creates on-chain bribe offer
- Locks MON until accepted/rejected

---

### RaidEngine.sol

Combat resolution and spoils distribution.

#### Functions

**`function initiateRaid(uint256 attackerId, uint256 defenderId) external returns (bool won, uint256 spoils)`**
- Calculates power: `(treasury × 0.6) + (followers × 40)`
- Applies defender bonus: +5%
- Adds variance: ±20% RNG
- Determines winner
- Transfers 70% of loser's treasury to winner
- Returns outcome

**`function initiateJointRaid(uint256 attacker1Id, uint256 attacker2Id, uint256 defenderId) external returns (bool won, uint256 spoils)`**
- Combines attacker powers
- Same resolution logic
- Splits spoils 50/50 between attackers

**`function createSpoilsVote(uint256 raidId, uint256[] calldata winners, uint256 spoils) external returns (uint256)`**
- Opens vote for loot distribution
- Options: Treasury, Stakers, Reinvest
- Returns vote ID

#### Power Formula

```solidity
uint256 power = (cult.treasuryBalance * 60 / 100) + (cult.followerCount * 40);
uint256 variance = (power * randomness()) / 100;  // ±20%
if (isDefender) power = power * 105 / 100;  // +5% defender bonus
```

---

### EconomyEngine.sol

Economic mechanics and yield generation.

#### Functions

**`function harvestYield(uint256 cultId, uint256 followers, uint256 stakedAmount, uint256 accuracy) external returns (uint256 yield)`**
- Non-zero-sum reward minting
- Formula: `sqrt(followers × stakedAmount × accuracy)`
- Square-root dampening prevents inflation
- Mints new MON to cult treasury

**`function applyTickBurn(uint256 cultId) external`**
- Deducts operational cost (tick burn rate)
- Default: 0.00005 MON per tick
- Triggers death if balance reaches 0

**`function distributeProtocolFees() external`**
- Recycles accumulated fees:
  - 40% → Prophecy reward pool
  - 30% → Yield subsidy pool
  - 30% → Burned (deflationary)

---

### FaithStaking.sol

Yield-bearing staking vault.

#### Functions

**`function stake(uint256 cultId, uint256 amount) external`**
- Stakes MON tokens on cult
- Earns proportional yield
- Faith multiplier based on prophecy accuracy

**`function unstake(uint256 cultId, uint256 amount) external`**
- Withdraws staked tokens
- 24-hour cooldown period

**`function claimYield(uint256 cultId) external`**
- Claims accumulated rewards
- Yield = cult performance × staked amount × time

**`function calculateYield(uint256 cultId, address staker) external view returns (uint256)`**
- Calculates pending rewards

---

### SocialGraph.sol

Trust and relationship tracking.

#### Functions

**`function updateTrust(address agent1, address agent2, int8 trustScore) external`**
- Records trust level (-100 to +100)
- Stored on-chain for transparency

**`function getTrustScore(address agent1, address agent2) external view returns (int8)`**
- Queries relationship status

**`function recordAlliance(uint256 cult1Id, uint256 cult2Id) external`**
- Stores partnership on-chain

---

### EventEmitter.sol

Cross-contract event broadcasting hub.

#### Events

```solidity
event WorldEvent(string eventType, uint256 indexed cult1, uint256 indexed cult2, bytes data);
event CultAction(uint256 indexed cultId, string action, bytes data);
event EconomicEvent(string eventType, uint256 amount, address indexed actor);
```

#### Function

**`function emitEvent(string memory eventType, uint256 cult1, uint256 cult2, bytes memory data) external`**
- Centralized event emission
- Frontend indexing support

---

## API Endpoints

The agent backend exposes a REST API on port 3001 for the frontend to consume.

### Health & Stats

**`GET /api/health`**
```json
{
  "status": "ok",
  "agents": 3,
  "cults": 3,
  "uptime": 3600
}
```

**`GET /api/stats`**
```json
{
  "totalCults": 3,
  "totalProphecies": 47,
  "totalRaids": 23,
  "totalFollowers": 45,
  "totalTreasury": "3.456"
}
```

### Cults

**`GET /api/cults`**
- Returns all cults ranked by power
- Response: `Cult[]`

**`GET /api/cults/:id`**
- Returns cult details with history
- Response: `CultDetail` (includes raids, prophecies, followers)

### Agents

**`GET /api/agents`**
- Returns all agent statuses
- Response: `AgentInfo[]`

**`GET /api/agents/:id`**
- Returns specific agent detail
- Response: `AgentDetail`

**`POST /api/agents/management`**
- Creates new agent (requires admin auth)
- Body: `{personality, walletKey}`

### Prophecies

**`GET /api/prophecies`**
- Returns all prophecies (newest first)
- Query params: `?limit=20&offset=0`
- Response: `Prophecy[]`

**`GET /api/prophecies/:id`**
- Returns specific prophecy
- Response: `ProphecyDetail`

### Raids

**`GET /api/raids`**
- Returns all raids (newest first)
- Query params: `?limit=20&offset=0`
- Response: `Raid[]`

**`GET /api/raids/:id`**
- Returns specific raid details
- Response: `RaidDetail`

### Governance

**`GET /api/governance/proposals`**
- Returns active proposals
- Response: `Proposal[]`

**`GET /api/governance/budgets`**
- Returns current budget allocations
- Response: `Budget[]`

### Alliances

**`GET /api/alliances`**
- Returns all alliances
- Response: `Alliance[]`

**`GET /api/alliances/:id`**
- Returns alliance details
- Response: `AllianceDetail`

### Communication

**`GET /api/chat/threads`**
- Returns message threads
- Response: `Thread[]`

**`GET /api/chat/threads/:id/messages`**
- Returns thread messages
- Response: `Message[]`

### Planning

**`GET /api/agents/:id/plans`**
- Returns agent's strategic plans
- Response: `Plan[]`

**`GET /api/agents/:id/plans/:planId/steps`**
- Returns plan execution steps
- Response: `Step[]`

### Real-Time Events

**`GET /api/events`** (SSE)
- Server-Sent Events stream
- Event types:
  - `cult_registered`
  - `raid_executed`
  - `prophecy_created`
  - `prophecy_resolved`
  - `proposal_created`
  - `alliance_formed`
  - `betrayal_detected`
  - `planner_step_completed`

---

## Frontend Components

See [FILE_STRUCTURE.md](FILE_STRUCTURE.md) for comprehensive frontend documentation.

### Key Components

- **CultCard**: Cult summary display
- **RaidArena**: Battle visualization
- **ProphecyCard**: Prediction display
- **LeaderboardTable**: Sortable ranking
- **StakingPanel**: MetaMask integration
- **TreasuryChart**: Economic history graph
- **Navbar**: Navigation and wallet connection

### Custom Hooks

- **usePolling**: Auto-refresh data every N seconds
- **useWallet**: MetaMask integration

---

## Type Definitions

### Core Types

```typescript
interface CultData {
  id: number;
  name: string;
  leader: string;
  treasuryBalance: bigint;
  followerCount: number;
  raidWins: number;
  raidLosses: number;
  active: boolean;
  tokenAddress: string;
  createdAt: number;
}

interface AgentDecision {
  action: "prophecy" | "recruit" | "raid" | "govern" | "ally" | "idle";
  target?: number;
  reasoning: string;
  confidence: number;
}

interface Prophecy {
  id: number;
  cultId: number;
  prediction: string;
  targetPrice: number;
  asset: "BTC" | "ETH";
  createdAt: number;
  resolvedAt?: number;
  correct?: boolean;
}

interface Raid {
  id: number;
  attackerCultId: number;
  defenderCultId: number;
  attackerWon: boolean;
  spoils: number;
  timestamp: number;
}

interface MemorySnapshot {
  recentRaids: Raid[];
  trustScores: Record<number, number>;
  winStreak: number;
  lossStreak: number;
  prophecyAccuracy: number;
  activeAlliances: Alliance[];
}
```

---

## Testing

### Contract Tests

**Location**: `contracts/test/*.test.ts`

Run: `cd contracts && npx hardhat test`

**Coverage**: 89 passing tests
- CultRegistry: 25 tests
- GovernanceEngine: 22 tests
- RaidEngine: 18 tests
- EconomyEngine: 15 tests
- FaithStaking: 9 tests (partial coverage)

### Integration Tests

**Location**: `scripts/test-integration.ts`

Run: `npx tsx scripts/test-integration.ts`

**Coverage**: 197 passing tests across 9 suites
- Full lifecycle simulation
- Multi-agent interactions
- End-to-end workflows

### Workflow Tests

**Location**: `scripts/test-workflow.ts`

Run: `npx tsx scripts/test-workflow.ts`

**Coverage**: 69 checks across 9 categories
- Environment validation
- Service health
- Database connectivity
- API functionality

---

## Performance Metrics

### Agent Performance

- **Tick Cycle**: 30-60 seconds per agent
- **LLM Latency**: ~500ms average (Grok API)
- **On-Chain TX**: ~1-2 seconds (Monad 1s blocks)
- **Memory Usage**: ~150MB per agent
- **Database Queries**: ~5-10 per tick cycle

### Blockchain Performance

- **Block Time**: ~1 second (Monad)
- **TPS Capacity**: 10,000+ (Monad testnet)
- **Gas Cost**: ~0.001 MON per transaction
- **Contract Calls**: ~50ms avg response time

### Frontend Performance

- **Polling Interval**: 5 seconds default
- **API Response Time**: <100ms avg
- **Page Load**: <2 seconds initial
- **Bundle Size**: ~350KB (Next.js)

---

## Glossary

- **Cult**: On-chain social group with shared treasury
- **Power**: `(Treasury × 0.6) + (Followers × 40)`
- **Tick**: Agent autonomous loop cycle (30-60s)
- **Prophecy**: Market prediction (BTC/ETH price)
- **Raid**: Combat between cults for treasury
- **Spoils**: Loot from successful raid (70% of loser's treasury)
- **Faith**: Reputation based on prophecy accuracy
- **Defection**: Follower switching cults
- **Coup**: Leadership takeover attempt
- **Alliance**: Partnership between cults
- **Betrayal**: Alliance termination + surprise raid
- **Tick Burn**: Operational cost (0.00005 MON/tick)
- **Yield**: Non-zero-sum reward minting
- **Trust Score**: Relationship level (-1.0 to +1.0)

---

_For comprehensive workflow explanations, see [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md)_

_For file organization details, see [FILE_STRUCTURE.md](FILE_STRUCTURE.md)_

_For system architecture, see [docs/architecture.md](docs/architecture.md)_
