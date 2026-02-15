# AgentCult File Structure

This document provides a comprehensive overview of the AgentCult codebase organization, explaining the purpose of all major directories and files.

---

## Table of Contents
1. [Root Directory](#root-directory)
2. [Agent Backend (`/agent`)](#agent-backend-agent)
3. [Smart Contracts (`/contracts`)](#smart-contracts-contracts)
4. [Frontend (`/frontend`)](#frontend-frontend)
5. [Scripts (`/scripts`)](#scripts-scripts)
6. [Documentation (`/docs`)](#documentation-docs)

---

## Root Directory

### Configuration Files
- **`.env.example`**: Template for environment variables
- **`.gitignore`**: Git exclusion patterns
- **`package.json`**: Root-level npm workspace configuration
- **`package-lock.json`**: Dependency lock file
- **`vercel.json`**: Vercel deployment configuration

### Documentation
- **`README.md`**: Main project overview and setup guide
- **`AGENT_WORKFLOW.md`**: Comprehensive agent behavior and lifecycle documentation
- **`AgentCult_System_Design.md`**: Detailed system architecture and design decisions
- **`FILE_STRUCTURE.md`**: This file - repository organization guide
- **`MODULES_AND_FUNCTIONS.md`**: API reference for all modules and functions

### Legacy Files (Can be archived/removed)
- **`AGENTS.md`**: InsForge SDK documentation (not specific to this project)
- **`Progress.md`**: Old rollout tracking (superseded by Git history)
- **`FIXES_APPLIED.md`**: Historical bug fix log (superseded by Git commits)
- **`FOLLOWER_COUNT_FIXES.md`**: Specific bug fix documentation (archived)
- **`PHANTOM_FOLLOWERS_FIX.md`**: Specific bug fix documentation (archived)
- **`RECRUITMENT_VERIFICATION.md`**: Test documentation (archived)
- **`TEST_NO_PHANTOM_FOLLOWERS.md`**: Test documentation (archived)

### Personality Configuration
- **`personality.json`**: Custom agent personality templates
- **`example_personality.json`**: Example personality configuration
- **`example-whale-personality.json`**: Example high-stakes personality

---

## Agent Backend (`/agent`)

The autonomous AI agent runtime - the "brain" of the cult simulation.

### Root Files
- **`package.json`**: Agent dependencies (ethers, express, openai SDK, etc.)
- **`tsconfig.json`**: TypeScript configuration for ESM modules

### `/agent/src` - Source Code

#### Entry Point
- **`index.ts`**: Main application entry point
  - Bootstraps AgentOrchestrator
  - Starts Express API server
  - Initiates agent autonomous loops
  - Sets up graceful shutdown handlers

- **`config.ts`**: Environment configuration manager
  - RPC URLs (Monad testnet)
  - Contract addresses (CultRegistry, GovernanceEngine, etc.)
  - API keys (xAI, InsForge)
  - Network parameters

#### `/agent/src/core` - Core Agent Logic

- **`AgentOrchestrator.ts`**: Master orchestrator managing all agents
  - Bootstrap agents from InsForge database
  - Seed initial agents from personalities.json
  - Manage agent lifecycle (start/stop)
  - Sync state to API every 3 seconds
  - Coordinate shared services

- **`CultAgent.ts`**: Individual autonomous agent implementation
  - Main `tick()` loop (30-60s cycles)
  - Observe → Think → Act → Evolve pattern
  - Execute actions: prophecy, raid, recruit, govern, etc.
  - State management and persistence
  - Integration with all 17+ services

- **`AgentPersonality.ts`**: Personality system
  - Load personality definitions
  - Trait system (honesty, aggression, loyalty, manipulation)
  - Belief systems (religious, atheist, capitalist, etc.)
  - System prompts for LLM context

#### `/agent/src/services` - Specialized Agent Capabilities

**Decision Making:**
- **`LLMService.ts`**: AI decision engine (Grok/xAI integration)
  - `decideAction()`: Main decision loop
  - `generateProphecy()`: Market predictions
  - Prompt construction and response parsing
  - Fallback responses on API failure

**Combat & Raids:**
- **`RaidService.ts`**: Raid mechanics and combat resolution
  - Power calculation: `(Treasury × 0.6) + (Followers × 40)`
  - Win probability calculations
  - Standard 1v1 raids
  - Joint alliance raids (2v1)
  - Cooldown management
  - Spoils distribution voting

**Governance & Politics:**
- **`GovernanceService.ts`**: Budget proposals and voting
  - Generate budget proposals (attack/defense/recruitment/reserve)
  - Auto-voting logic
  - Coup mechanics (leadership takeover)
  - Bribery system
  - Vote tallying

- **`GroupGovernanceService.ts`**: Multi-agent governance coordination
  - Cross-cult voting coalitions
  - Collective decision making

**Economy & Lifecycle:**
- **`LifeDeathService.ts`**: Agent lifecycle management
  - Death condition checks (treasury ≤ 0)
  - Rebirth cooldown (5 minutes)
  - Resurrection mechanics

- **`MarketService.ts`**: External market data integration
  - BTC/ETH price fetching
  - Market trend analysis
  - Prophecy target calculation

**Social Systems:**
- **`AllianceService.ts`**: Partnership and betrayal mechanics
  - Alliance proposals and acceptance
  - Trust score tracking (-1.0 to 1.0)
  - Betrayal opportunity detection
  - Alliance expiration and renewal
  - Cooperation yield calculations

- **`DefectionService.ts`**: Follower movement between cults
  - Post-raid defection logic
  - Member conversion probabilities
  - Cult switching mechanics

- **`CommunicationService.ts`**: Inter-agent messaging
  - Send memes (propaganda)
  - Leak private conversations
  - Generate propaganda
  - Message threading

**Prediction & Faith:**
- **`ProphecyService.ts`**: Market prophecy system
  - Generate price predictions (BTC/ETH)
  - Resolve prophecies (correct/incorrect)
  - Calculate cult accuracy metrics
  - Treasury rewards/penalties
  - Faith multiplier calculations

**Recruitment & Persuasion:**
- **`PersuasionService.ts`**: Follower recruitment
  - Conversion probability calculations
  - Persuasion power formulas
  - Recruitment success/failure outcomes

**Memory & Learning:**
- **`MemoryService.ts`**: Episodic memory system
  - Record raid outcomes
  - Update trust scores
  - Track win/loss streaks
  - Memory snapshot generation for LLM context
  - Long-term relationship tracking

- **`EvolutionService.ts`**: Adaptive personality evolution
  - Trait adjustments based on outcomes
  - Strategy optimization
  - Behavior adaptation

**Planning & Strategy:**
- **`PlannerService.ts`**: Multi-step strategic planning
  - Generate long-term plans (3-5 steps)
  - Execute step-by-step strategies
  - Plan persistence and recovery
  - Step result tracking

**Utilities:**
- **`RandomnessService.ts`**: Deterministic randomness
  - Seeded RNG for reproducibility
  - Combat variance
  - Event probability

- **`WorldStateService.ts`**: Environment awareness
  - Get list of rival cults (DB-backed only)
  - Get recruitable agents
  - Filter active participants
  - World snapshot generation

- **`InsForgeService.ts`**: Database persistence layer
  - 17+ table schema (agents, raids, prophecies, alliances, etc.)
  - CRUD operations for all entities
  - Functional exports (no classes)
  - Singleton client pattern
  - Error handling with `{data, error}` pattern

#### `/agent/src/chain` - Blockchain Integration

- **`ContractService.ts`**: Smart contract interaction wrapper
  - ethers.js integration
  - Contract ABI definitions (human-readable)
  - Cult registration, treasury management
  - Raid recording, prophecy creation
  - Event listening and parsing

- **`TransactionQueue.ts`**: Transaction sequencing
  - Prevent nonce collisions
  - 3-retry exponential backoff
  - Per-agent queue management
  - Error recovery

- **`NadFunService.ts`**: nad.fun token integration
  - $CULT token creation on bonding curve
  - Token balance queries
  - Liquidity pool interaction

#### `/agent/src/api` - REST API Server

- **`server.ts`**: Express application setup
  - Route mounting
  - CORS configuration
  - Error handling middleware
  - SSE (Server-Sent Events) endpoint

**`/agent/src/api/routes` - API Endpoints:**
- **`agents.ts`**: Agent management
  - `GET /api/agents` - List all agents
  - `GET /api/agents/:id` - Agent details
  - `POST /api/agents/management` - Create new agent

- **`cults.ts`**: Cult information
  - `GET /api/cults` - All cults ranked by power
  - `GET /api/cults/:id` - Cult details with history

- **`prophecies.ts`**: Prophecy feed
  - `GET /api/prophecies` - All prophecies
  - `GET /api/prophecies/:id` - Specific prophecy

- **`raids.ts`**: Raid history
  - `GET /api/raids` - All raids
  - `GET /api/raids/:id` - Raid details

- **`governance.ts`**: Governance data
  - `GET /api/governance/proposals` - Active proposals
  - `GET /api/governance/budgets` - Budget allocations

- **`alliances.ts`**: Alliance tracking
  - `GET /api/alliances` - All alliances
  - `GET /api/alliances/:id` - Alliance details

- **`chat.ts`**: Communication feed
  - `GET /api/chat/threads` - Message threads
  - `GET /api/chat/threads/:id/messages` - Thread messages

- **`planner.ts`**: Strategy plans
  - `GET /api/agents/:id/plans` - Agent plans
  - `GET /api/agents/:id/plans/:planId/steps` - Plan steps

- **`health.ts`**: System status
  - `GET /api/health` - Service health check
  - `GET /api/stats` - Aggregate statistics

#### `/agent/src/types` - TypeScript Definitions

- **`planner.ts`**: Planning system types
- **`memory.ts`**: Memory system types
- Various shared interfaces

#### `/agent/src/utils` - Utility Functions

- **`logger.ts`**: Structured logging
  - `createLogger(moduleName)` factory
  - Log levels: info, warn, error, debug
  - Environment-based debug toggle

- **`sleep.ts`**: Timing utilities
  - `sleep(ms)` - Async delay
  - `randomDelay(min, max)` - Randomized delays

#### `/agent/data` - Static Data

- **`personalities.json`**: Default agent personalities
  - Church of the Eternal Candle (Mystical prophet)
  - Order of the Red Dildo (Aggressive raider)
  - Temple of Diamond Hands (Stoic hodler)

---

## Smart Contracts (`/contracts`)

Solidity smart contracts deployed on Monad blockchain - the immutable rules and state of the game.

### Root Files
- **`package.json`**: Hardhat dependencies
- **`hardhat.config.ts`**: Hardhat configuration
  - Solidity 0.8.24 compiler settings
  - Monad testnet network config (Chain ID: 10143)
  - Gas optimization settings
- **`tsconfig.json`**: TypeScript configuration for test files

### `/contracts/contracts` - Smart Contract Source

**Core Contracts:**

- **`CultRegistry.sol`**: Central state registry (✅ 7 contracts in 1)
  - Cult registration and management
  - Treasury tracking (MON balance per cult)
  - Follower count management
  - Raid recording and resolution
  - Prophecy creation and resolution
  - Leader assignment
  - Event emission for all state changes
  
  **Key Functions:**
  - `registerCult(name, prompt, tokenAddress)` - Create new cult
  - `depositToTreasury(cultId)` - Add MON to treasury
  - `joinCult(cultId)` - Increment follower count
  - `recordRaid(attacker, defender, won, amount)` - Record raid result
  - `createProphecy(cultId, predictionHash, targetPrice)` - Store prophecy
  - `resolveProphecy(id, correct, multiplier)` - Resolve prophecy outcome
  
  **Events:**
  - `CultRegistered(cultId, name, leader, tokenAddress)`
  - `TreasuryUpdated(cultId, newBalance)`
  - `FollowerJoined(cultId, newCount)`
  - `RaidResult(attacker, defender, won, spoils)`
  - `ProphecyCreated(id, cultId, prediction)`
  - `ProphecyResolved(id, correct, treasuryChange)`

- **`GovernanceEngine.sol`**: Political and voting system
  - Budget proposal creation
  - Vote casting with follower weight
  - Proposal execution
  - Coup mechanics (leadership takeover)
  - Bribery system
  
  **Key Functions:**
  - `createProposal(cultId, descriptionHash, allocations)` - Submit budget proposal
  - `castVote(proposalId, support, weight)` - Vote on proposal
  - `executeProposal(proposalId)` - Execute approved proposal
  - `proposeCoup(targetCultId)` - Attempt leadership takeover
  - `offerBribe(targetAgent, amount, targetProposal)` - Bribe voter

- **`FaithStaking.sol`**: Yield-bearing staking vault
  - Stake MON tokens on cults
  - Earn yield from cult performance
  - Faith multipliers based on prophecy accuracy
  - Unstaking with cooldown period
  
  **Key Functions:**
  - `stake(cultId, amount)` - Stake tokens on cult
  - `unstake(cultId, amount)` - Withdraw staked tokens
  - `claimYield(cultId)` - Claim accumulated rewards
  - `calculateYield(cultId, user)` - Get pending rewards

- **`EconomyEngine.sol`**: Tokenomics and economic mechanics
  - Non-zero-sum yield generation
  - Treasury tick burn (operational costs)
  - Protocol fee distribution
  - Revenue recycling
  
  **Key Functions:**
  - `harvestYield(cultId, followers, stakedAmount, accuracy)` - Mint productivity rewards
  - `applyTickBurn(cultId)` - Deduct operational costs
  - `distributeProtocolFees()` - Recycle fees into reward pools

- **`RaidEngine.sol`**: Combat resolution system
  - Power-based combat formula
  - Standard 1v1 raids
  - Joint alliance raids (2v1)
  - Spoils distribution
  - War dividend minting
  
  **Key Functions:**
  - `initiateRaid(attackerCultId, defenderCultId)` - Execute standard raid
  - `initiateJointRaid(attacker1, attacker2, defender)` - Execute alliance raid
  - `createSpoilsVote(raidId, winners, spoils)` - Vote on loot distribution
  
  **Combat Formula:**
  ```solidity
  Power = (Treasury * 0.6) + (Followers * 40)
  Variance = ±20% RNG
  Defender Bonus = +5%
  ```

- **`SocialGraph.sol`**: Trust and relationship tracking
  - On-chain trust scores
  - Alliance formation (off-chain for MVP)
  - Relationship history
  
  **Key Functions:**
  - `updateTrust(agent1, agent2, trustScore)` - Record trust level
  - `getTrustScore(agent1, agent2)` - Query relationship
  - `recordAlliance(cult1, cult2)` - Store partnership

- **`EventEmitter.sol`**: Cross-contract event hub
  - Centralized event broadcasting
  - Frontend indexing support
  - Event aggregation

### `/contracts/scripts` - Deployment Scripts

- **`deploy.ts`**: Main deployment script
  - Deploy all 7 contracts in sequence
  - Set contract addresses and permissions
  - Verify deployment on Monad testnet
  - Output contract addresses for .env

### `/contracts/test` - Test Suite

**Test Coverage (89 passing tests):**

- **`CultRegistry.test.ts`**: Core registry functionality
  - Cult registration
  - Treasury management
  - Follower tracking
  - Raid recording
  - Prophecy creation/resolution
  - Event emission

- **`GovernanceEngine.test.ts`**: Governance mechanics
  - Proposal creation
  - Voting weight calculation
  - Vote tallying
  - Proposal execution
  - Coup attempts
  - Bribery mechanics

- **`RaidEngine.test.ts`**: Combat system
  - Power calculation
  - 1v1 raid resolution
  - Joint raid mechanics
  - Spoils distribution
  - Variance and randomness

- **`EconomyEngine.test.ts`**: Economic mechanics
  - Yield generation
  - Tick burn deduction
  - Fee distribution
  - Inflation control

**Test Patterns:**
- Uses Hardhat + ethers + chai
- `loadFixture` for fresh contract deploys
- Nested `describe` blocks per feature
- TypeChain for typed contract wrappers

### `/contracts/typechain-types` - Generated Type Definitions

Auto-generated TypeScript interfaces for contracts (via TypeChain)

---

## Frontend (`/frontend`)

Next.js 16 application with React 19 - the user interface for observing the simulation.

### Root Files
- **`package.json`**: Frontend dependencies
  - Next.js 16 (App Router)
  - React 19
  - Tailwind CSS v4 (dark occult theme)
  - ethers.js (wallet integration)
  
- **`next.config.ts`**: Next.js configuration
  - Webpack mode (stable build)
  - Environment variables
  - Image optimization

- **`tailwind.config.ts`**: Tailwind CSS configuration
  - Dark theme defaults
  - Custom cult colors (purple, red, gold)
  - Typography settings

- **`tsconfig.json`**: TypeScript configuration
  - Path aliases (`@/` → `src/`)
  - Strict type checking

### `/frontend/src/app` - App Router Pages

**Main Pages:**

- **`page.tsx`**: Dashboard (Homepage)
  - Live statistics overview
  - Top 3 cults by power
  - Recent prophecy feed
  - Recent raid activity
  - Real-time updates via polling

- **`cults/page.tsx`**: Leaderboard
  - All cults ranked by power
  - Treasury, followers, win rate
  - Sortable columns
  - Link to cult detail pages

- **`cults/[id]/page.tsx`**: Cult Detail Page
  - Individual cult history
  - Treasury chart over time
  - Raid history (wins/losses)
  - Prophecy record
  - Follower timeline
  - Staking panel (MetaMask integration)

- **`arena/page.tsx`**: Raid Arena
  - Animated battle visualization
  - Real-time raid events
  - Power comparison charts
  - Victory/defeat animations
  - Demo showpiece feature

- **`prophecies/page.tsx`**: Prophecy Feed
  - Scrolling oracle predictions
  - Resolution badges (correct/incorrect)
  - Cult attribution
  - Confidence scores
  - Market context (BTC/ETH prices)

- **`governance/page.tsx`**: Governance Dashboard
  - Active proposals
  - Vote tallies
  - Budget allocation breakdowns
  - Historical proposals
  - Voting interface

- **`alliances/page.tsx`**: Alliance Tracker
  - Active partnerships
  - Trust score visualization
  - Alliance history
  - Betrayal events

- **`layout.tsx`**: Root layout
  - Navbar with wallet connection
  - Dark theme wrapper
  - Global styles
  - Font configuration

### `/frontend/src/components` - React Components

**Core Components:**

- **`Navbar.tsx`**: Navigation bar
  - Page links
  - Wallet connect button (MetaMask)
  - Network indicator
  - Responsive mobile menu

- **`CultCard.tsx`**: Cult summary card
  - Cult name and icon
  - Power ranking
  - Treasury balance
  - Follower count
  - Win/loss record
  - Click to detail page

- **`RaidArena.tsx`**: Raid visualizer
  - Animated battle sequences
  - Power bar comparisons
  - Spoils counter
  - Victory/defeat states

- **`TreasuryChart.tsx`**: Economic history graph
  - Line chart of treasury over time
  - Raid markers
  - Prophecy impact indicators
  - Interactive tooltips

- **`ProphecyCard.tsx`**: Prophecy display
  - Prediction text
  - Target price/outcome
  - Resolution badge
  - Time remaining/elapsed
  - Faith score impact

- **`StakingPanel.tsx`**: On-chain staking UI
  - Stake/unstake MON tokens
  - MetaMask transaction signing
  - Current stake display
  - Yield calculation
  - Cooldown timer

- **`LeaderboardTable.tsx`**: Sortable cult ranking
  - Power, treasury, followers columns
  - Sort by any metric
  - Rank indicators (#1, #2, #3)

- **`LoadingSpinner.tsx`**: Loading indicator
  - Used during data fetching
  - Consistent brand styling

### `/frontend/src/hooks` - Custom React Hooks

- **`usePolling.ts`**: Generic polling hook
  - Auto-refresh data every N seconds
  - Loading state management
  - Error handling
  - Cleanup on unmount
  
  **Usage:**
  ```typescript
  const { data, loading, error } = usePolling(
    useCallback(() => api.getCults(), []),
    5000  // Poll every 5 seconds
  );
  ```

- **`useWallet.ts`**: MetaMask wallet integration
  - Connect/disconnect wallet
  - Account change detection
  - Network switching
  - Transaction signing

### `/frontend/src/lib` - Utility Libraries

- **`api.ts`**: API client layer
  - Typed fetch wrappers
  - Error handling
  - Response parsing
  
  **API Methods:**
  ```typescript
  export const api = {
    getStats: () => fetchJSON<Stats>('/api/stats'),
    getCults: () => fetchJSON<Cult[]>('/api/cults'),
    getCult: (id) => fetchJSON<CultDetail>(`/api/cults/${id}`),
    getProphecies: () => fetchJSON<Prophecy[]>('/api/prophecies'),
    getRaids: () => fetchJSON<Raid[]>('/api/raids'),
    getAgents: () => fetchJSON<Agent[]>('/api/agents'),
    // ... all types co-located in same file
  }
  ```

- **`constants.ts`**: App-wide constants
  - Cult colors (purple, red, gold gradients)
  - Icon mappings (🕯️, 🔴, 💎)
  - Network configuration
  - Contract addresses

- **`utils.ts`**: Helper functions
  - `formatMON(amount)` - Format token amounts
  - `timeAgo(timestamp)` - Relative time display
  - `truncateAddress(address)` - Shorten wallet addresses
  - `calculatePower(cult)` - Client-side power calculation

### `/frontend/public` - Static Assets

- **`favicon.ico`**: Site favicon
- **`images/`**: Cult icons, backgrounds
- **`fonts/`**: Custom typography

### Styling Strategy

- **Dark Occult Theme**: Base `bg-[#0a0a0a]`, high contrast text
- **Cult Colors**: Unique gradient accents per cult
- **Responsive**: Mobile-first design, breakpoints at md/lg/xl
- **No Barrel Exports**: Direct imports from component files
- **Path Alias**: All imports use `@/` prefix for `src/`

### Data Flow

```
Frontend Component
  ↓ (usePolling hook, 5s interval)
API Client (api.ts)
  ↓ (HTTP GET)
Agent Backend (:3001/api/*)
  ↓ (stateStore cache, 3s sync)
AgentOrchestrator
  ↓ (shared services)
CultAgents + InsForge DB + Blockchain
```

**Read-Only**: Frontend has no write access - all mutations happen through agent autonomous behavior.

**Real-Time Updates**: SSE endpoint at `/api/events` for event-stream (optional, polling is default).

---

## Scripts (`/scripts`)

Automation and testing scripts for the development workflow.

### Workflow Testing

- **`test-workflow.ts`**: Comprehensive system health check
  - **69 checks across 9 categories:**
    1. Environment configuration validation
    2. Contract deployment verification
    3. InsForge database connectivity
    4. Agent backend startup checks
    5. API endpoint health
    6. Frontend build verification
    7. Wallet balance checks
    8. Service integration tests
    9. Data persistence validation
  
  **Usage:**
  ```bash
  npx tsx scripts/test-workflow.ts          # Full test suite
  npx tsx scripts/test-workflow.ts --quick  # Skip slow tests
  npx tsx scripts/test-workflow.ts --fix    # Auto-fix missing deps
  ```
  
  **Output:** Pass/fail report with actionable fixes

- **`test-integration.ts`**: End-to-end integration tests
  - **197 test cases:**
    - Suite 1: Contract deployment
    - Suite 2: Agent initialization
    - Suite 3: Cult registration
    - Suite 4: Prophecy creation
    - Suite 5: Raid execution
    - Suite 6: Recruitment flow
    - Suite 7: Governance voting
    - Suite 8: Alliance formation
    - Suite 9: Full cycle simulation
  
  **Usage:**
  ```bash
  npx tsx scripts/test-integration.ts
  ```

### SQL Schema Management

- **`sql/2026-02-15-freewill-rollout-r1.sql`**: Database schema
  - 17 InsForge tables creation
  - Permissions and grants
  - Sequences and indexes
  - Migration compatibility

### Utility Scripts

- **`generate-personality.ts`**: Create custom agent personalities
  - Interactive CLI wizard
  - Trait randomization
  - Export to JSON

- **`deploy-agent.ts`**: Deploy new agent to running system
  - Load personality from file
  - Create wallet
  - Register on-chain
  - Start autonomous loop

---

## Documentation (`/docs`)

Organized technical documentation by topic.

### Architecture Documentation

- **`README.md`**: Documentation index
  - Module overview
  - Quick start guide for developers
  - Mermaid architecture diagrams

- **`architecture.md`**: System architecture
  - High-level design patterns
  - "Brain-Body" split (on-chain vs. off-chain)
  - Technical stack overview
  - Security architecture
  - Data flow diagrams

- **`system_design.md`**: Detailed system design
  - Component interaction patterns
  - Service orchestration
  - State synchronization
  - Event-driven architecture

- **`onchain_offchain_architecture.md`**: Hybrid architecture deep dive
  - What lives on-chain (immutable truth)
  - What lives off-chain (agent cognition)
  - State reconciliation
  - Trust boundaries

### Feature Documentation

- **`agent_brain.md`**: Agent decision system
  - LLM integration patterns
  - Personality matrix
  - Perception system
  - Memory architecture
  - Decision loop implementation

- **`raid_engine.md`**: Combat mechanics
  - Power calculation formula
  - Win probability algorithms
  - Variance and randomness
  - Joint raid mechanics
  - Spoils distribution

- **`governance.md`**: Political system
  - Budget proposal process
  - Voting mechanics
  - Coup mechanics
  - Bribery system
  - Proposal execution

- **`economy.md`**: Economic mechanics
  - Tokenomics overview
  - Treasury management
  - Yield generation
  - Tick burn mechanics
  - Death spirals
  - Faith staking

- **`social_graph.md`**: Social systems
  - Alliance mechanics
  - Trust score calculation
  - Betrayal detection
  - Information warfare

### Detailed Design Documents

- **`CULT_Token_Design_and_Tokenomics.md`**: Complete token economics
  - Total supply: 100M $CULT (fixed)
  - Launch via nad.fun bonding curve
  - Fee split: 50% burn, 30% stakers, 20% treasury
  - Raid fee: 1% of transfers
  - Utility: Agent deployment stake, faith multipliers, governance
  - Liquidity pool design
  - Price discovery mechanism

- **`PLAN.md`**: Development roadmap
  - Feature prioritization
  - Implementation milestones
  - Technical debt tracking

---

## Network Configuration

### Monad Testnet

| Parameter | Value |
|-----------|-------|
| Network Name | Monad Testnet |
| Chain ID | 10143 |
| RPC URL | https://testnet-rpc.monad.xyz |
| Explorer | https://testnet.monadexplorer.com |
| Faucet | https://faucet.monad.xyz |
| Currency | MON |
| Block Time | ~1 second |
| TPS Capacity | 10,000+ |

### Deployed Contracts

```
CULT_REGISTRY_ADDRESS=0x599614Cf813aD373391fb3AEB52D11B071A1df82
FAITH_STAKING_ADDRESS=0x683E3ACC03Aeb5B8400F3Ee3Cf3fC70fE0cd6f4e
GOVERNANCE_ENGINE_ADDRESS=0x36156dbe9Ff7BdC6cfd8d0D8A72C1a054fDf2454
SOCIAL_GRAPH_ADDRESS=0x7De6d1B6E089a5DCF2b3462C010BcdBb3CD3c5E2
ECONOMY_ENGINE_ADDRESS=0xEdf9CB6F5770d50AC8e29A170F97E8C6804F9005
RAID_ENGINE_ADDRESS=0x90D6c11161D5DD973D3eC16142540FC8Ed39D099
EVENT_EMITTER_ADDRESS=0xB6768C55Bd471d52bbBf527E325770766665f0D1
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/AgentCult.git
cd AgentCult

# 2. Install dependencies
npm install                    # Root workspace
cd contracts && npm install   # Contract dependencies
cd ../agent && npm install    # Agent dependencies
cd ../frontend && npm install # Frontend dependencies

# 3. Configure environment
cp .env.example .env
# Edit .env with:
# - PRIVATE_KEY (wallet with MON tokens)
# - INSFORGE_ANON_KEY (JWT from InsForge)
# - CULT_REGISTRY_ADDRESS (deployed contract)
```

### Deploy Contracts (One-time per network)

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network monadTestnet
# Copy output addresses to .env
```

### Run System

```bash
# Terminal 1: Agent Backend
cd agent && npm run dev
# Bootstraps agents, starts autonomous loops, API on :3001

# Terminal 2: Frontend
cd frontend && npm run dev
# Next.js dev server on :3000

# Terminal 3: Test Workflow
npx tsx scripts/test-workflow.ts --quick
```

### Testing

```bash
# Contract tests
cd contracts && npx hardhat test  # 89 tests

# Integration tests
npx tsx scripts/test-integration.ts  # 197 tests

# Type checking
npm run type-check  # All workspaces

# Linting
npm run lint  # All workspaces
```

---

## Key Conventions

### TypeScript/ESM

- **Always use `.js` extensions in imports** (ESM requirement):
  ```typescript
  import { config } from "../config.js"  // ✅ Correct
  import { config } from "../config"      // ❌ Wrong
  ```

### Service Patterns

- **Shared services**: Singleton instances for cross-agent state
- **Per-agent services**: Unique instances with agent's wallet/keys
- **Functional exports**: InsForgeService uses functions, not classes
- **Error handling**: All services return `{data, error}` tuples

### Frontend Patterns

- **No barrel exports**: Import directly from component files
- **Path alias**: Always use `@/` prefix
- **Polling not subscriptions**: 5-second polling default
- **Read-only**: No direct blockchain writes from frontend

### Contract Patterns

- **Human-readable ABIs**: Inline strings, not artifacts/
- **No OpenZeppelin**: Hand-rolled access control
- **Events for everything**: Frontend indexing requires events
- **Gas optimization**: Minimize storage writes

---

## Troubleshooting

### Agent Backend Not Starting

1. Check InsForge connectivity: `npx tsx scripts/test-workflow.ts --quick`
2. Verify `INSFORGE_ANON_KEY` is JWT (starts with `eyJ...`)
3. Check 17 tables exist in database
4. Ensure wallet has MON balance

### Frontend Shows 0 Cults

1. Agent backend must run at least 1 tick cycle (30-60s)
2. Check `/api/health` shows `agents > 0`
3. Verify `CULT_REGISTRY_ADDRESS` is correct
4. Check on-chain: `CultRegistry.getTotalCults()` > 0

### Contract Tests Failing

1. Clean artifacts: `rm -rf artifacts cache`
2. Recompile: `npx hardhat compile --force`
3. Check Solidity version: 0.8.24
4. Verify test fixtures use correct constructor args

---

## Repository Metrics

- **Total Files**: ~150+ TypeScript/Solidity files
- **Lines of Code**: ~25,000+ (excluding node_modules)
- **Test Coverage**: 89 contract tests, 197 integration tests
- **Services**: 17+ specialized agent services
- **API Endpoints**: 25+ REST routes
- **Smart Contracts**: 7 deployed on Monad testnet
- **Database Tables**: 17 InsForge tables
- **Agent Personalities**: 3 pre-built + extensible

---

## License

MIT License - See LICENSE file for details

---

_This documentation reflects the codebase as of February 2026. For the latest updates, check Git commit history._
