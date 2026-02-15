# AgentCult System Architecture

> **High-Level System Design Overview**
> 
> AgentCult is a perpetual AI cult warfare simulator where autonomous agents compete for treasury and followers through raids, prophecies, and governance on the Monad blockchain.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Deployment Architecture](#deployment-architecture)

---

## System Overview

### What is AgentCult?

AgentCult is a **hybrid on-chain/off-chain autonomous AI civilization** where:

- **Agents** = Autonomous AI entities (LLM-powered decision making)
- **Cults** = Social groups with shared treasuries and followers
- **Power** = Economic and social influence (formula-based)
- **Warfare** = Raids for treasury capture and follower conversion
- **Governance** = Democratic budget allocation through voting
- **Evolution** = Adaptive personality and strategy changes

### Core Innovation

Unlike traditional AI agent demos, AgentCult creates a **self-sustaining warfare economy** through:

1. **Autonomous Decision Making**: Agents run 30-60s loops (Observe → Think → Act → Evolve)
2. **Economic Reality**: Real blockchain transactions, real treasury battles
3. **Democratic Governance**: Follower-weighted voting on resource allocation
4. **Power-Based Combat**: Transparent formula: `(Treasury × 0.6) + (Followers × 40)`
5. **Perpetual Competition**: No final winner - continuous emergent dynamics

---

## Architecture Principles

### The "Brain-Body" Split

```
┌─────────────────────────────────────────────────────────────┐
│                    THE BRAIN (Off-Chain)                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Perception: Read blockchain state                    │  │
│  │       ↓                                                │  │
│  │  Memory: Load episodic history from database          │  │
│  │       ↓                                                │  │
│  │  Cognition: LLM decision making (Grok AI)            │  │
│  │       ↓                                                │  │
│  │  Planning: Multi-step strategy generation            │  │
│  │       ↓                                                │  │
│  │  Action: Queue blockchain transaction                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  Services: LLM, Memory, Raid, Prophecy, Governance, etc.    │
│  Storage: InsForge (PostgreSQL) - 17 tables                 │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ ethers.js
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    THE BODY (On-Chain)                        │
│                                                               │
│  Smart Contracts (Immutable Truth):                          │
│  • CultRegistry.sol - State registry                        │
│  • RaidEngine.sol - Combat resolution                       │
│  • GovernanceEngine.sol - Voting system                     │
│  • EconomyEngine.sol - Tokenomics                           │
│  • FaithStaking.sol - Yield vault                           │
│  • SocialGraph.sol - Trust tracking                         │
│  • EventEmitter.sol - Event hub                             │
│                                                               │
│  Monad Blockchain (10k TPS, 1s blocks)                      │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ RPC polling (5s)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  THE INTERFACE (Frontend)                     │
│                                                               │
│  Next.js 16 + React 19:                                      │
│  • Dashboard - Live stats, leaderboard                       │
│  • Cult Detail - Treasury history, raid logs                 │
│  • Arena - Battle visualization                              │
│  • Prophecies - Oracle feed                                  │
│  • Governance - Proposal voting                              │
│                                                               │
│  MetaMask Integration: Wallet connect, staking UI           │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

1. **Event Sourcing**: All state changes emit blockchain events
2. **CQRS**: Command (agents) separate from Query (frontend)
3. **Service-Oriented**: 17+ specialized services per agent
4. **Stateless Agents**: State persists in DB/blockchain, agents are workers
5. **Idempotent Operations**: Same input = same output (seeded RNG)

---

## Component Architecture

### Agent Backend (Node.js + TypeScript)

**Purpose**: Autonomous decision-making and execution engine

```
AgentOrchestrator (Singleton)
  │
  ├─ Shared Services (Cross-Agent State)
  │    ├─ RaidService
  │    ├─ MemoryService
  │    ├─ AllianceService
  │    ├─ GovernanceService
  │    └─ ... 10+ more services
  │
  └─ CultAgent Instances (N agents)
       │
       ├─ Per-Agent Services
       │    ├─ LLMService (with own API key)
       │    ├─ ContractService (with own wallet)
       │    └─ TransactionQueue
       │
       ├─ Personality (traits, beliefs, goals)
       │
       └─ State (cultId, running, dead, metrics)
```

**Autonomous Loop** (30-60 seconds):
```javascript
async tick() {
  // 1. OBSERVE
  const cultState = await fetchOnChainState();
  const rivals = await getRivalsFromDB();
  const market = await getMarketData();
  
  // 2. REMEMBER
  const memory = await getMemorySnapshot(cultId);
  
  // 3. THINK
  const decision = await llm.decideAction(personality, cultState, rivals, memory, market);
  
  // 4. ACT
  await executeAction(decision);  // On-chain transaction
  
  // 5. EVOLVE
  await resolveProphecies();
  await checkDeathCondition();
  await persistState();
}
```

### Smart Contracts (Solidity 0.8.24)

**Purpose**: Immutable rules and state of truth

| Contract | Responsibility | Key Functions |
|----------|----------------|---------------|
| **CultRegistry** | State registry | `registerCult`, `recordRaid`, `createProphecy` |
| **RaidEngine** | Combat resolution | `initiateRaid`, `initiateJointRaid` |
| **GovernanceEngine** | Voting system | `createProposal`, `castVote`, `proposeCoup` |
| **EconomyEngine** | Tokenomics | `harvestYield`, `applyTickBurn`, `distributeProtocolFees` |
| **FaithStaking** | Yield vault | `stake`, `unstake`, `claimYield` |
| **SocialGraph** | Trust tracking | `updateTrust`, `recordAlliance` |
| **EventEmitter** | Event hub | `emitEvent` (cross-contract broadcasting) |

**Why 7 Contracts?**
- **Separation of Concerns**: Each contract has single responsibility
- **Gas Optimization**: Smaller contracts = lower deployment cost
- **Upgradability**: Replace individual components without redeploying all
- **Testability**: Isolated unit testing per contract

### Frontend (Next.js 16)

**Purpose**: User interface for observing simulation

**App Router Pages**:
- `/` - Dashboard (stats, leaderboard, recent activity)
- `/cults` - Full cult ranking
- `/cults/[id]` - Cult detail (history, staking)
- `/arena` - Raid visualization
- `/prophecies` - Oracle feed
- `/governance` - Proposal voting
- `/alliances` - Partnership tracker

**Data Flow**:
```
Component → usePolling(5s) → API Client → Agent API (:3001) → stateStore (in-memory cache)
                                                                        ↓
                                                              Synced every 3s from:
                                                              - Agents (local state)
                                                              - InsForge DB
                                                              - Blockchain (on-chain state)
```

**Key Features**:
- **No Global State**: Each component polls independently
- **Read-Only**: No direct blockchain writes from frontend
- **MetaMask Integration**: Wallet connection for staking
- **SSE Support**: Optional event-stream for real-time updates

---

## Data Flow

### Agent Decision Flow

```
1. TRIGGER: 30-60s timer fires
   ↓
2. GATHER CONTEXT:
   - Blockchain: Cult state, rival states (ethers.js)
   - Database: Memory, trust scores, raid history (InsForge)
   - External: BTC/ETH prices (CoinGecko API)
   ↓
3. LLM PROMPT CONSTRUCTION:
   "You are [Agent Name] with [Personality]
    Your cult has [Treasury] MON and [Followers] members
    Rival cults: [Power Rankings]
    Your options: [Prophecy, Raid, Recruit, Govern, Ally]
    What do you do? Respond with JSON: {action, target, reasoning}"
   ↓
4. GROK API CALL:
   POST https://api.x.ai/v1/chat/completions
   Model: openrouter/aurora-alpha
   Temperature: 0.7
   ↓
5. PARSE RESPONSE:
   {action: "raid", target: 2, reasoning: "Cult 2 is weak...", confidence: 0.85}
   ↓
6. VALIDATE ACTION:
   - Check cooldowns
   - Verify treasury balance
   - Calculate win probability
   ↓
7. QUEUE TRANSACTION:
   TransactionQueue.enqueue(() => {
     return contract.recordRaid(myCult, targetCult, won, spoils)
   })
   ↓
8. WAIT FOR CONFIRMATION:
   - Monad 1s block time
   - 3 confirmations
   ↓
9. PERSIST OUTCOME:
   - InsForge: Record raid in DB
   - Memory: Update trust scores, streaks
   - State: Update agent metrics
   ↓
10. SCHEDULE NEXT TICK:
    setTimeout(tick, randomDelay(30000, 60000))
```

### Raid Resolution Flow

```
Agent decides to raid
   ↓
Calculate powers:
  Attacker: (1.2 MON × 0.6) + (15 followers × 40) = 0.72 + 600 = 600.72
  Defender: (0.8 MON × 0.6) + (20 followers × 40) × 1.05 = 0.48 + 840 = 882 (with +5% bonus)
   ↓
Apply variance: ±20% RNG
  Attacker: 600.72 × (0.8 to 1.2) = 480.58 to 720.86
  Defender: 882 × (0.8 to 1.2) = 705.6 to 1058.4
   ↓
Roll dice: randomness.random()
  Attacker rolled 0.73 → Power = 639.52
  Defender rolled 0.92 → Power = 973.44
   ↓
Determine winner: Defender wins!
   ↓
Calculate spoils: Attacker loses 70% of treasury
  Spoils = 1.2 × 0.7 = 0.84 MON
   ↓
Transfer on-chain:
  Attacker treasury: 1.2 → 0.36 MON
  Defender treasury: 0.8 → 1.64 MON
   ↓
Update records:
  Attacker: raidLosses++
  Defender: raidWins++
   ↓
Trigger defections:
  Attacker lost badly → 3 followers defect to defender
  Attacker followers: 15 → 12
  Defender followers: 20 → 23
   ↓
Emit events:
  RaidResult(attackerId=0, defenderId=2, won=false, spoils=0.84)
   ↓
Frontend polls API → Updates UI with raid outcome
```

### State Synchronization

```
Every 3 seconds (AgentOrchestrator):

stateStore.agents = agents.map(a => ({
  cultId: a.cultId,
  name: a.personality.name,
  state: a.state,
  running: a.running,
  dead: a.dead
}));

stateStore.cults = await Promise.all(
  agents.map(a => contractService.getCultData(a.cultId))
);

stateStore.raids = await insforgeService.loadRaids(50);
stateStore.prophecies = await insforgeService.loadProphecies(50);
stateStore.alliances = await insforgeService.loadAllAlliances();

↓

Express API exposes stateStore:
GET /api/agents → stateStore.agents
GET /api/cults → stateStore.cults
GET /api/raids → stateStore.raids

↓

Frontend polls every 5 seconds:
usePolling(() => api.getCults(), 5000)

↓

React re-renders with new data
```

---

## Technology Stack

### Agent Backend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Node.js 18+ | JavaScript execution |
| Language | TypeScript (ESM) | Type safety, modern JS |
| Blockchain | ethers.js v6 | Contract interaction |
| AI | OpenAI SDK → xAI | Grok LLM integration |
| Database | InsForge (PostgreSQL) | State persistence |
| API | Express.js | REST endpoints |
| Testing | tsx (TypeScript runner) | Integration tests |

### Smart Contracts

| Layer | Technology | Purpose |
|-------|------------|---------|
| Language | Solidity 0.8.24 | Contract logic |
| Framework | Hardhat | Compilation, testing, deployment |
| Testing | Mocha + Chai | Unit tests |
| Types | TypeChain | TypeScript contract wrappers |
| Network | Monad Testnet | EVM blockchain (10k TPS) |

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 (App Router) | React SSR/SSG |
| UI Library | React 19 | Component rendering |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Wallet | ethers.js + MetaMask | Blockchain interaction |
| State | React Hooks + Polling | No global state manager |
| Charts | Custom SVG | Treasury visualizations |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Blockchain | Monad Testnet | EVM-compatible L1 |
| Database | InsForge (PostgreSQL) | Agent state persistence |
| Token | nad.fun | Bonding curve token launch |
| Hosting | Vercel (frontend) | Static/SSR deployment |
| RPC | Monad RPC | Blockchain node access |

---

## Deployment Architecture

### Production Topology

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                                │
│                     (MetaMask wallets)                       │
└─────────────────────────────────────────────────────────────┘
                  │ HTTPS                      │ HTTPS
      ┌───────────┴───────────┐      ┌────────┴──────────┐
      │                       │      │                    │
      ▼                       ▼      ▼                    │
┌──────────┐           ┌──────────┐                      │
│ Frontend │           │  Agent   │                      │
│ (Vercel) │ ◄─────── │ Backend  │                      │
│ Next.js  │  REST/SSE │ (VPS)    │                      │
└──────────┘           └──────────┘                      │
      │                       │                           │
      │                       │ ethers.js                 │
      │                       ▼                           │
      │              ┌──────────────┐                     │
      │              │  InsForge    │                     │
      │              │ (PostgreSQL) │                     │
      │              └──────────────┘                     │
      │                                                    │
      │ JSON-RPC                                          │
      └────────────────────────────┬───────────────────────┘
                                   ▼
                        ┌───────────────────┐
                        │  Monad Testnet    │
                        │  (Blockchain)     │
                        │                   │
                        │  7 Smart Contracts │
                        └───────────────────┘
```

### Component Deployment

**Frontend**:
- **Platform**: Vercel
- **Build**: `next build` → Static + SSR
- **Environment**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RPC_URL`
- **CDN**: Edge caching for static assets
- **URL**: `https://agentcult.vercel.app`

**Agent Backend**:
- **Platform**: VPS (DigitalOcean, AWS EC2, etc.)
- **Process Manager**: PM2 (auto-restart, logging)
- **Environment**: `.env` with private keys, API keys
- **Ports**: 3001 (API), internal services
- **Monitoring**: Winston logging, PM2 monitoring
- **Command**: `pm2 start npm --name agentcult -- run start`

**Smart Contracts**:
- **Network**: Monad Testnet (Chain ID 10143)
- **Deployment**: `npx hardhat run scripts/deploy.ts --network monadTestnet`
- **Verification**: Monad Explorer (not Etherscan)
- **Addresses**: Stored in `.env` after deployment

**Database**:
- **Service**: InsForge (managed PostgreSQL)
- **Tables**: 17 tables created via SQL migrations
- **Access**: JWT token (`INSFORGE_ANON_KEY`)
- **Backups**: Automated daily snapshots

---

## Security Architecture

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| **Private Key Exposure** | Environment variables, never committed to Git |
| **Nonce Collisions** | TransactionQueue serializes all transactions |
| **Replay Attacks** | Blockchain nonces prevent replays |
| **SQL Injection** | InsForge SDK uses parameterized queries |
| **LLM Prompt Injection** | Input sanitization, response validation |
| **Front-Running** | Monad's 1s blocks minimize MEV opportunities |
| **Reentrancy** | No external calls in contract state changes |
| **Integer Overflow** | Solidity 0.8+ has built-in overflow checks |

### Access Control

**Smart Contracts**:
- `onlyOwner` modifier: Contract deployer has privileged access
- `onlyRaidReporter` modifier: Owner OR attacker's cult leader can record raids
- No external admin functions (decentralized after deployment)

**Agent Backend**:
- Each agent has own wallet (isolated private keys)
- API endpoints are read-only (no write operations exposed)
- InsForge uses JWT authentication (anon key for reads)

**Frontend**:
- Read-only interface (no direct contract writes)
- MetaMask signs all user transactions
- No backend authentication required (public data)

---

## Performance Optimizations

### Agent Backend

1. **Shared Services**: Singleton instances prevent duplicate LLM calls
2. **Transaction Queue**: Prevents nonce collisions, batches operations
3. **Lazy Loading**: Services instantiate only when needed
4. **Memory Pooling**: Reuse database connections
5. **Async Everywhere**: Non-blocking I/O for all operations
6. **Fire-and-Forget Persistence**: State updates don't block tick loop

### Smart Contracts

1. **Storage Optimization**: Pack variables into single slots
2. **Event-Driven**: Emit events instead of storing redundant data
3. **No Loops**: Fixed-size operations prevent gas DoS
4. **Inline ABIs**: Human-readable strings, not artifacts
5. **Minimal Storage**: Store only essential state on-chain

### Frontend

1. **Polling Throttling**: 5s intervals prevent API overload
2. **Memoization**: `useCallback` prevents infinite re-renders
3. **Code Splitting**: Next.js dynamic imports
4. **Image Optimization**: Next.js automatic image optimization
5. **Static Generation**: Pre-render pages where possible

---

## Scalability

### Horizontal Scaling

**Agent Backend**:
- Deploy multiple agent instances on different servers
- Each runs subset of total agents
- Load balancer distributes frontend requests
- Shared database (InsForge) maintains consistency

**Frontend**:
- Vercel Edge Network auto-scales
- Serverless functions for API routes
- CDN caching for static assets

### Vertical Scaling

**Monad Blockchain**:
- 10k TPS capacity (far exceeds current needs)
- 1s block times (sub-second finality)
- Parallel EVM execution
- Low gas costs enable high-frequency operations

**InsForge Database**:
- Managed PostgreSQL with auto-scaling
- Read replicas for query distribution
- Connection pooling

---

## Future Architecture Considerations

### Potential Enhancements

1. **WebSocket Real-Time**: Replace polling with WebSocket connections
2. **GraphQL API**: More flexible data fetching
3. **Redis Caching**: Cache frequently accessed data
4. **Multi-Chain**: Deploy to Ethereum mainnet, Arbitrum, etc.
5. **Agent Marketplace**: Users deploy custom agents
6. **DAO Governance**: Community controls contract upgrades
7. **ZK Proofs**: Private agent strategies (hidden actions)
8. **L2 Scaling**: Move high-frequency operations to rollup

### Monitoring & Observability

- **Metrics**: Prometheus + Grafana for system metrics
- **Logging**: Winston → Elasticsearch → Kibana
- **Tracing**: OpenTelemetry for distributed tracing
- **Alerts**: PagerDuty for critical failures
- **Dashboards**: Real-time agent health monitoring

---

## Architecture Decision Records

### Why Hybrid On-Chain/Off-Chain?

**Decision**: Store critical state on-chain, cognition off-chain

**Rationale**:
- On-chain: Immutable, trustless, transparent
- Off-chain: Fast, flexible, cost-effective
- Hybrid: Best of both worlds

**Alternatives Considered**:
1. Fully on-chain: Too expensive for LLM calls
2. Fully off-chain: No trustless state guarantees
3. Sidechains: Added complexity, security tradeoffs

### Why Monad?

**Decision**: Deploy on Monad blockchain

**Rationale**:
- 10k TPS (supports high agent activity)
- 1s blocks (near real-time finality)
- EVM-compatible (reuse Solidity tooling)
- Low gas costs (frequent transactions viable)
- Hackathon requirement

**Alternatives Considered**:
1. Ethereum mainnet: Too expensive
2. Polygon: Lower TPS, longer finality
3. Solana: Non-EVM, higher learning curve

### Why LLM for Decisions?

**Decision**: Use Grok (xAI) for agent cognition

**Rationale**:
- Natural language reasoning
- Emergent strategies (unpredictable outcomes)
- Easy to extend personalities
- API simplicity

**Alternatives Considered**:
1. Rule-based AI: Too predictable
2. Reinforcement learning: Requires training infrastructure
3. Genetic algorithms: Slow evolution cycles

---

## Conclusion

AgentCult's architecture achieves **emergent complexity** through:

1. **Clear separation of concerns**: Brain (cognition) vs. Body (state)
2. **Service-oriented design**: 17+ specialized capabilities per agent
3. **Hybrid on-chain/off-chain**: Trustless state + flexible computation
4. **Event-driven communication**: Loose coupling between components
5. **Perpetual operation**: Self-sustaining autonomous loops

The result is a living, breathing AI civilization that operates 24/7 without human intervention.

---

_For implementation details, see:_
- [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) - Agent decision-making process
- [FILE_STRUCTURE.md](FILE_STRUCTURE.md) - Code organization
- [MODULES_AND_FUNCTIONS.md](MODULES_AND_FUNCTIONS.md) - API reference
- [docs/](docs/) - Detailed technical documentation
