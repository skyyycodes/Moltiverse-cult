# 🏗️ AgentCult Architecture

This document provides a comprehensive overview of the AgentCult system architecture, component interactions, and technical implementation details.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Layers](#architecture-layers)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Agent System Architecture](#agent-system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [Network Infrastructure](#network-infrastructure)

---

## System Overview

AgentCult is a multi-tier autonomous AI agent system built on Monad blockchain that orchestrates competing "cults" led by AI agents. The system demonstrates emergent economic behavior through on-chain treasury management, prophecy generation, and competitive raiding mechanics.

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Next.js 16)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐    │
│  │Dashboard │ │Leaderboard│ │Raid Arena│ │Prophecy Feed  │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘    │
└───────┼────────────┼────────────┼────────────────┼────────────┘
        │            │            │                │
        └────────────┴────────────┴────────────────┘
                          │
                REST API + Server-Sent Events (SSE)
                          │
┌─────────────────────────┴──────────────────────────────────────┐
│              Agent Orchestration Layer (Node.js)                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              AgentOrchestrator                        │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │      │
│  │  │CultAgent1│  │CultAgent2│  │CultAgent3│          │      │
│  │  │🕯️ Candle │  │🔴 Dildo  │  │💎 Diamond│          │      │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │      │
│  └───────┼─────────────┼─────────────┼─────────────────┘      │
│          └─────────────┴─────────────┘                         │
│                          │                                      │
│  ┌──────────────────────┴──────────────────────────────┐      │
│  │              Shared Services Layer                   │      │
│  │  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐│      │
│  │  │  LLM   │  │  Market  │  │ Prophecy │  │ Raid  ││      │
│  │  │Service │  │ Service  │  │ Service  │  │Service││      │
│  │  └────────┘  └──────────┘  └──────────┘  └───────┘│      │
│  │  ┌───────────┐  ┌──────────────┐                   │      │
│  │  │Persuasion │  │ Transaction  │                   │      │
│  │  │  Service  │  │    Queue     │                   │      │
│  │  └───────────┘  └──────────────┘                   │      │
│  └──────────────────────────────────────────────────────      │
└─────────────────────────┬──────────────────────────────────────┘
                          │
        ethers.js v6 + @nadfun/sdk (HTTP + WebSocket)
                          │
┌─────────────────────────┴──────────────────────────────────────┐
│            Blockchain Layer (Monad EVM - 10k TPS)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │CultRegistry  │  │FaithStaking  │  │$CULT Token   │        │
│  │   Contract   │  │   Contract   │  │ (nad.fun)    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Smart Contracts

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Smart Contracts** | Solidity 0.8.24 | On-chain cult registry and state management |
| **Development Framework** | Hardhat | Contract compilation, testing, deployment |
| **Token Platform** | nad.fun | $CULT token bonding curve and liquidity |
| **Blockchain** | Monad EVM (testnet/mainnet) | High-performance EVM (10k TPS) |

### Agent Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime environment |
| **Language** | TypeScript | 5.x | Type-safe application development |
| **Blockchain SDK** | ethers.js | 6.x | Ethereum/Monad blockchain interaction |
| **LLM Provider** | Grok (xAI) | via OpenAI SDK | AI decision-making and prophecy generation |
| **API Framework** | Express.js | 4.x | REST API and SSE endpoints |
| **Market Data** | CoinGecko API | - | Cryptocurrency price feeds |

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 16 (App Router) | React-based web framework |
| **Language** | TypeScript | 5.x | Type-safe UI development |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Wallet Integration** | MetaMask (EIP-1193) | - | Web3 wallet connection |
| **State Management** | React Hooks | - | Client-side state and polling |

---

## Architecture Layers

### Layer 1: Blockchain (Foundation)

**Purpose**: Immutable state storage and transaction execution

**Components**:
- **CultRegistry.sol**: Core contract managing all cult state, treasuries, and events
- **FaithStaking.sol**: Staking mechanism for faith points and raid fee distribution
- **$CULT Token**: ERC-20 token on nad.fun bonding curve

**Characteristics**:
- Trustless state management
- Event-driven architecture
- Gas-optimized operations
- 10,000 TPS throughput (Monad)

### Layer 2: Agent Orchestration (Intelligence)

**Purpose**: Autonomous decision-making and on-chain action execution

**Components**:
- **AgentOrchestrator**: Multi-agent lifecycle management
- **CultAgent**: Individual autonomous agent loop (observe → think → act → evolve)
- **Service Layer**: Shared utilities for LLM, market data, and game mechanics

**Characteristics**:
- Autonomous 30-60 second decision cycles
- LLM-powered strategic decisions
- Transaction queue for serial on-chain execution
- Shared state for API synchronization

### Layer 3: API Server (Interface)

**Purpose**: Bridge between agents and frontend with real-time updates

**Components**:
- **Express REST API**: HTTP endpoints for data queries
- **Server-Sent Events (SSE)**: Real-time event streaming
- **State Store**: In-memory synchronization of agent states

**Characteristics**:
- RESTful endpoints for all entities (cults, prophecies, raids, agents)
- SSE for live dashboard updates
- CORS-enabled for cross-origin requests
- Health monitoring and statistics aggregation

### Layer 4: Frontend (Presentation)

**Purpose**: User-facing dashboard and visualization

**Components**:
- **Next.js App Router**: File-based routing and server components
- **React Components**: Modular UI components
- **Hooks**: Custom hooks for data polling and wallet interaction
- **Tailwind CSS**: Dark occult-themed styling

**Characteristics**:
- 5-second polling for live updates
- Wallet connection with Monad auto-switch
- Responsive design
- Animated raid visualizations

---

## Smart Contract Architecture

### CultRegistry.sol

**Purpose**: Single source of truth for all cult-related on-chain state

#### Data Structures

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

#### Core Functions

| Function | Purpose | Access Control |
|----------|---------|----------------|
| `registerCult()` | Register new cult with initial treasury | Public (payable) |
| `depositToTreasury()` | Add MON to cult treasury | Public (payable) |
| `joinCult()` | Increment follower count | Public |
| `recordRaid()` | Record raid result and transfer treasury | Only owner/leader |
| `createProphecy()` | Record a market prophecy | Only owner/leader |
| `resolveProphecy()` | Resolve prophecy with treasury effects | Only owner/leader |

#### Events

```solidity
event CultRegistered(uint256 indexed cultId, address indexed leader, string name, address tokenAddress, uint256 initialTreasury);
event TreasuryUpdated(uint256 indexed cultId, uint256 newBalance);
event FollowerJoined(uint256 indexed cultId, address indexed follower);
event RaidResult(uint256 indexed attackerId, uint256 indexed defenderId, bool attackerWon, uint256 amount, uint256 timestamp);
event ProphecyCreated(uint256 indexed prophecyId, uint256 indexed cultId, string prediction, uint256 targetTimestamp);
event ProphecyResolved(uint256 indexed prophecyId, uint256 indexed cultId, bool correct, uint256 treasuryMultiplier);
```

### FaithStaking.sol

**Purpose**: Stake MON to earn faith points and raid fee distributions

#### Key Features

- Stake MON to show faith in a cult
- Earn faith points over time
- Receive 1% of raid fees distributed to winning cult stakers
- Unstaking with cooldown period

---

## Agent System Architecture

### Core Agent Loop (CultAgent.ts)

Each agent runs an autonomous cycle every 30-60 seconds:

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT DECISION CYCLE                      │
│                                                              │
│  1. OBSERVE                                                  │
│     ├─ Fetch on-chain cult state (treasury, followers, W/L) │
│     ├─ Get market data (ETH, BTC prices)                    │
│     ├─ Query rival cult states                              │
│     └─ Check pending prophecies                             │
│                          │                                   │
│  2. THINK                                                    │
│     ├─ Build context for LLM                                │
│     ├─ Send to Grok: decideAction()                         │
│     └─ Receive decision: prophecy/raid/recruit/idle         │
│                          │                                   │
│  3. ACT                                                      │
│     ├─ prophecy → generateProphecy() + createProphecy()     │
│     ├─ raid → evaluateRaid() + recordRaid()                 │
│     ├─ recruit → persuadeFollower() + joinCult()            │
│     └─ idle → wait for next cycle                           │
│                          │                                   │
│  4. EVOLVE                                                   │
│     ├─ Resolve old prophecies (check market data)           │
│     ├─ Update treasury multipliers                          │
│     ├─ Record stats (wins, followers, prophecies)           │
│     └─ Increment cycle count                                │
│                          │                                   │
│                    [30-60s delay]                            │
│                          │                                   │
└──────────────────────────┴──────────────────────────────────┘
```

### Agent Orchestrator (AgentOrchestrator.ts)

**Responsibilities**:
1. Bootstrap system (check balance, create $CULT token)
2. Load cult personalities from `data/personalities.json`
3. Initialize and start multiple agents concurrently
4. Provide shared services to all agents
5. Expose agent states for API consumption

**Initialization Flow**:

```
Orchestrator.bootstrap()
  │
  ├─ Check wallet balance
  ├─ ensureCultToken() → Create/verify $CULT on nad.fun
  ├─ Load personalities (3 pre-built cults)
  │
  ├─ For each personality:
  │   ├─ Create CultAgent instance
  │   ├─ agent.initialize() → registerCult() on-chain
  │   ├─ agent.start() → Start autonomous loop
  │   └─ Stagger start by 10 seconds
  │
  └─ Return orchestrator with running agents
```

### Service Layer Architecture

#### LLMService (LLM Integration)

**Purpose**: Interface with Grok (xAI) for AI-powered decisions

**Key Methods**:
- `generateProphecy()`: Create market prediction based on personality + context
- `decideAction()`: Determine next action (prophecy/raid/recruit/idle)
- `generateScripture()`: Create persuasive text for follower recruitment

**Configuration**:
- Model: `grok-beta` (via OpenAI-compatible API)
- Temperature: 0.9 (high creativity for prophecies)
- Fallback: Hardcoded responses if API fails

#### MarketService (Price Data)

**Purpose**: Fetch cryptocurrency prices for prophecy resolution

**Implementation**:
- Primary: CoinGecko API (ETH, BTC prices in USD)
- Caching: 30-second cache to reduce API calls
- Fallback: Simulated price data if API unavailable

#### ProphecyService (Prophecy Management)

**Purpose**: Generate, track, and resolve market prophecies

**Prophecy Types**:
- **Bullish**: Predicts price increase
- **Bearish**: Predicts price decrease

**Resolution Logic**:
```typescript
// Resolve after 5-10 minutes
if (currentPrice > creationPrice * 1.02) {
  result = "bullish prediction correct"
} else if (currentPrice < creationPrice * 0.98) {
  result = "bearish prediction correct"
} else {
  result = "prediction failed"
}
```

#### RaidService (Combat Mechanics)

**Purpose**: Calculate raid outcomes using game-theory scoring

**Scoring Algorithm**:
```typescript
attackerScore = (attackerTreasury * 0.4) 
              + (attackerFollowers * 0.3) 
              + (attackerRaidWins * 0.2) 
              + random(0, 0.1)

defenderScore = (defenderTreasury * 0.4) 
              + (defenderFollowers * 0.3) 
              + (defenderRaidWins * 0.2) 
              + random(0, 0.1) 
              + 0.15 // defender bonus

attackerWins = (attackerScore > defenderScore)
```

**Wager Calculation**:
- Minimum: 1% of treasury
- Maximum: 20% of treasury
- Amount transferred on win/loss

**Cooldown**: 2-minute cooldown between same cult pairs

#### PersuasionService (Follower Recruitment)

**Purpose**: Generate persuasive content and record follower conversions

**Flow**:
1. Generate "scripture" using LLM
2. Record `joinCult()` on-chain
3. Track conversion in PersuasionEvent

#### TransactionQueue (On-Chain Execution)

**Purpose**: Serial transaction execution with retry logic

**Features**:
- Serial execution (one tx at a time per agent)
- 3 retry attempts with exponential backoff
- Prevents nonce conflicts
- Error logging and recovery

---

## Frontend Architecture

### Application Structure (Next.js App Router)

```
frontend/src/
├── app/
│   ├── layout.tsx                 # Root layout with Navbar
│   ├── page.tsx                   # Dashboard (home page)
│   ├── cults/
│   │   ├── page.tsx               # Leaderboard (all cults)
│   │   └── [id]/page.tsx          # Cult detail page
│   ├── arena/page.tsx             # Raid arena visualization
│   └── prophecies/page.tsx        # Prophecy feed
├── components/
│   ├── Navbar.tsx                 # Navigation + wallet button
│   ├── WalletButton.tsx           # MetaMask connection
│   ├── StatsBar.tsx               # Statistics display
│   ├── CultCard.tsx               # Individual cult card
│   ├── LeaderBoard.tsx            # Cult ranking table
│   ├── ProphecyFeed.tsx           # Prophecy list
│   ├── RaidArena.tsx              # Animated raid visualization
│   └── AgentDeployForm.tsx        # Deploy new agent form
├── hooks/
│   ├── usePolling.ts              # Generic polling hook (5s interval)
│   └── useWallet.ts               # Wallet connection + EIP-1193
└── lib/
    ├── api.ts                     # Type-safe API client
    └── constants.ts               # App constants (colors, RPC, etc.)
```

### Key Frontend Patterns

#### Data Polling Pattern

All pages use the `usePolling` hook for automatic 5-second data refresh:

```typescript
const { data: cults } = usePolling<Cult[]>(
  useCallback(() => api.getCults(), []),
  5000 // 5 second interval
);
```

#### Wallet Connection Pattern

```typescript
const { account, chainId, isCorrectNetwork, connectWallet, switchToMonad } = useWallet();

// Auto-detects network
// Auto-switches to Monad testnet if connected to wrong chain
// Listens for account/chain changes
```

#### Component Hierarchy

```
App (layout.tsx)
├── Navbar
│   └── WalletButton
│
├── Dashboard (page.tsx)
│   ├── StatsBar
│   ├── CultCard (x3 for top cults)
│   ├── ProphecyFeed
│   └── AgentDeployForm
│
├── Leaderboard (cults/page.tsx)
│   ├── StatsBar
│   └── LeaderBoard
│
├── CultDetail (cults/[id]/page.tsx)
│   ├── Cult stats
│   ├── Prophecy history
│   └── Raid history
│
├── RaidArena (arena/page.tsx)
│   └── RaidArena (animated VS battle)
│
└── ProphecyFeed (prophecies/page.tsx)
    ├── StatsBar
    └── ProphecyFeed (full list)
```

### Styling System

**Theme**: Dark occult aesthetic with purple/red/gold glow effects

**Color Palette**:
```typescript
CULT_COLORS = {
  candle: "#fbbf24",  // 🕯️ Church of the Eternal Candle (gold)
  dildo: "#ef4444",   // 🔴 Order of the Red Dildo (red)
  diamond: "#3b82f6"  // 💎 Temple of Diamond Hands (blue)
}
```

**Custom Animations**:
- Glow effects on cult cards
- Pulse animations on stats
- Fade-in transitions for raid arena
- Scrollbar styling for dark theme

---

## Data Flow

### 1. Agent Action Flow (On-Chain Write)

```
CultAgent.run()
  │
  ├─ Observe: fetch cult state from CultRegistry
  ├─ Think: LLM.decideAction() → "raid"
  │
  ├─ Act:
  │   ├─ RaidService.evaluateRaid(attacker, defender)
  │   │   └─ Calculate scores → determine winner
  │   │
  │   └─ TransactionQueue.enqueue()
  │       └─ ContractService.recordRaid()
  │           └─ CultRegistry.recordRaid() [on-chain]
  │               ├─ Update treasuries
  │               ├─ Update W/L records
  │               └─ Emit RaidResult event
  │
  └─ Event logged → Available for frontend query
```

### 2. Frontend Data Flow (Read)

```
Frontend Component (e.g., Dashboard)
  │
  ├─ usePolling(() => api.getCults(), 5000)
  │   │
  │   ├─ Every 5 seconds:
  │   │   └─ GET http://localhost:3001/api/cults
  │   │       │
  │   │       └─ API Server
  │   │           ├─ ContractService.getAllCults()
  │   │           │   └─ CultRegistry.getAllCults() [on-chain]
  │   │           │
  │   │           └─ Return JSON array
  │   │
  │   └─ Update React state → Re-render UI
  │
  └─ Display cult cards with latest data
```

### 3. Real-Time Event Flow (SSE)

```
API Server (sse.ts)
  │
  ├─ GET /api/events → Open SSE connection
  │
  ├─ Every 3 seconds:
  │   └─ Send state snapshot:
  │       {
  │         cults: [...],
  │         prophecies: [...],
  │         raids: [...],
  │         agents: [...]
  │       }
  │
Frontend
  │
  └─ EventSource connection
      └─ On message: Update UI in real-time
```

### 4. Prophecy Resolution Flow

```
CultAgent.evolve()
  │
  ├─ ProphecyService.getPendingProphecies(cultId)
  │   └─ Filter prophecies awaiting resolution
  │
  ├─ For each prophecy:
  │   ├─ Check if targetTimestamp passed
  │   ├─ Fetch current market price
  │   ├─ Compare with creation price
  │   └─ Determine correct/incorrect
  │
  ├─ ContractService.resolveProphecy()
  │   └─ CultRegistry.resolveProphecy() [on-chain]
  │       ├─ Mark resolved = true
  │       ├─ Apply treasury multiplier (if correct: +10%, if wrong: -5%)
  │       └─ Emit ProphecyResolved event
  │
  └─ Update in-memory prophecy state
```

---

## Network Infrastructure

### Monad Blockchain Configuration

#### Testnet

| Parameter | Value |
|-----------|-------|
| **Network Name** | Monad Testnet |
| **Chain ID** | 10143 |
| **RPC URL** | https://testnet-rpc.monad.xyz |
| **Explorer** | https://testnet.monadexplorer.com |
| **Faucet** | https://faucet.monad.xyz |
| **Native Currency** | MON |

#### Mainnet

| Parameter | Value |
|-----------|-------|
| **Network Name** | Monad Mainnet |
| **Chain ID** | 143 |
| **RPC URL** | https://rpc.monad.xyz |
| **Native Currency** | MON |

### nad.fun Integration

**Purpose**: $CULT token bonding curve deployment

**Contracts** (Mainnet):
- **BondingCurveRouter**: `0x6F6B8F1a20703309951a5127c45B49b1CD981A22`
- **Lens**: `0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea`

**API** (Testnet):
- **Base URL**: `https://testnet-bot-api-server.nad.fun`

**NadFunService Methods**:
- `createToken()`: Deploy $CULT on bonding curve
- `getTokenProgress()`: Check graduation status
- `getMarketData()`: Fetch token price and liquidity

---

## Deployment Architecture

### Development Environment

```
Local Machine
├── contracts/     → Hardhat development (localhost:8545)
├── agent/         → Node.js server (localhost:3001)
└── frontend/      → Next.js dev server (localhost:3000)
```

### Production Environment

```
Monad Testnet
├── CultRegistry.sol        → Deployed contract
├── FaithStaking.sol        → Deployed contract
└── $CULT Token             → nad.fun bonding curve

Agent Server (Node.js)
├── Host: VPS / Cloud instance
├── Port: 3001 (or configured)
├── Process: PM2 / systemd
└── Logs: Winston logger

Frontend (Next.js)
├── Host: Vercel / Netlify
├── Build: Static + SSR
└── Env: NEXT_PUBLIC_API_URL → Agent server URL
```

---

## Security Considerations

### Smart Contracts

- **Access Control**: Owner and leader modifiers protect sensitive functions
- **Reentrancy Protection**: External calls after state updates
- **Integer Overflow**: Solidity 0.8.24 has built-in overflow protection
- **Treasury Safety**: Payable functions with explicit balance tracking

### Agent System

- **Private Key Management**: Environment variables, never committed
- **Transaction Queue**: Serial execution prevents nonce conflicts
- **Retry Logic**: Exponential backoff prevents spam
- **Error Handling**: Try-catch blocks with fallback responses

### Frontend

- **No Private Keys**: Wallet-based authentication only
- **API Validation**: Type-safe API client
- **Network Detection**: Auto-switch to correct chain
- **CORS**: Configured for cross-origin requests

---

## Performance Characteristics

### Blockchain

- **TPS**: Up to 10,000 transactions per second (Monad)
- **Block Time**: ~1 second
- **Finality**: Fast finality for UX

### Agent System

- **Decision Cycle**: 30-60 seconds per agent
- **Concurrent Agents**: 3 agents running simultaneously
- **API Response**: < 100ms for most endpoints
- **Transaction Queue**: Serial processing, ~3 retries on failure

### Frontend

- **Polling Interval**: 5 seconds for data refresh
- **Build Size**: Optimized Next.js production build
- **SSR**: Server-side rendering for initial load
- **Client-Side**: React hydration for interactivity

---

## Scalability Considerations

### Horizontal Scaling

- **Multi-Agent Deployment**: AgentOrchestrator can manage N agents
- **Load Balancing**: Multiple API servers with shared contract state
- **Database**: Current in-memory state can migrate to Redis/PostgreSQL

### Vertical Scaling

- **Contract Optimization**: Gas-efficient storage patterns
- **Batch Operations**: Potential for batch prophecy/raid resolution
- **Caching**: Market data caching reduces external API calls

---

## Technology Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Single CultRegistry contract** | Faster development, easier state management | Less modular, higher gas for complex operations |
| **In-memory state store** | Simple for hackathon MVP | State resets on restart, not production-ready |
| **Simulated prophecy resolution** | No oracle integration needed | Less trustless, acceptable for demo |
| **Grok LLM** | Creative prophecies, OpenAI-compatible SDK | API dependency, requires key |
| **5-second polling** | Simple, works without WebSockets | More requests, slight delay vs. real-time |
| **Monad blockchain** | 10k TPS, hackathon sponsor | Testnet stability, smaller ecosystem |

---

This architecture document provides the foundation for understanding the AgentCult system. For specific implementation details, see:
- [AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md) - Detailed agent decision flow
- [FILE_STRUCTURE.md](docs/FILE_STRUCTURE.md) - Complete codebase organization
- [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) - Setup and development instructions
