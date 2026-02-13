# AgentCult: Progress & Implementation Tracker

> **Last Updated**: February 13, 2026
> **Status**: ~97% complete — All code implemented, needs deployment & demo
> **Deadline**: February 15, 2026 23:59 ET (target demo: Feb 14)

---

## High-Level Plan

**AgentCult: Emergent Religious Economies** — Autonomous AI cult leaders recruit followers via prophecies and bribes, build $CULT token treasuries, then raid and sacrifice rival cults' funds. All on Monad blockchain.

### Target Bounties

| Track                    | Prize                                           | Requirements                                              |
| ------------------------ | ----------------------------------------------- | --------------------------------------------------------- |
| **Agent+Token**          | $10K/winner (10 winners) + $40K liquidity boost | Deploy token on nad.fun + agent interacts with token      |
| **Religious Persuasion** | $10K                                            | AI prophets generating predictions & converting followers |
| **Gaming Arena**         | $10K                                            | Raid mechanics with treasury wagering & leaderboards      |

### Architecture

```
Frontend (Next.js 16 + Tailwind) ──REST/SSE──▶ Agent API (Express :3001)
                                                    │
                                              AgentOrchestrator
                                              ┌─────┼─────┐
                                           Agent1 Agent2 Agent3
                                              └─────┼─────┘
                                                    │
                                     ┌──────────────┼──────────────┐
                                  LLMService    ContractService  MarketService
                                  (Grok/xAI)   (ethers.js)      (CoinGecko)
                                                    │
                                              Monad Blockchain
                                         CultRegistry.sol + nad.fun
```

---

## Implementation Status

### ✅ COMPLETED

#### Smart Contracts

- [x] **CultRegistry.sol** (215 lines) — Cult registration, treasury management, follower tracking, raid recording, prophecy creation/resolution, leaderboard queries
- [x] **FaithStaking.sol** (165 lines) — Stake MON to show faith, earn faith points, 1% raid fee distribution to winning cult stakers
- [x] **Hardhat config** — Monad testnet (chain 10143) + mainnet (chain 143) configured
- [x] **Deploy script** — `scripts/deploy.ts` (deploys both CultRegistry + FaithStaking)
- [x] **Tests** — 7/7 passing (registration, followers, raids, prophecies, access control, getAllCults)

#### Agent Backend (Node.js/TypeScript)

- [x] **CultAgent.ts** (285 lines) — Full autonomous loop: observe→think→act→evolve with 30-60s cycles, all on-chain writes use TransactionQueue
- [x] **AgentOrchestrator.ts** — Manages 3 concurrent agents, staggered start, $CULT token creation via nad.fun on bootstrap
- [x] **AgentPersonality.ts** — Loads 3 cult personalities from JSON
- [x] **ContractService.ts** — Full ethers.js wrapper for CultRegistry (register, deposit, joinCult, raid, prophecy, resolve)
- [x] **NadFunService.ts** — Creates $CULT token on nad.fun bonding curve, queries token progress/graduation, market data via REST
- [x] **TransactionQueue.ts** — Serial transaction queue with retry logic (3 attempts, exponential backoff), used by all agents
- [x] **LLMService.ts** (147 lines) — Grok/xAI via OpenAI SDK with `generateProphecy()`, `decideAction()`, `generateScripture()` + fallback responses
- [x] **MarketService.ts** (70 lines) — CoinGecko price feed with caching + simulated fallback
- [x] **ProphecyService.ts** — In-memory prophecy store, generation via LLM, real market-based resolution (bullish/bearish prediction vs ETH price movement)
- [x] **RaidService.ts** (123 lines) — Game-theory scoring, 2-min cooldown per pair, wager calculation
- [x] **PersuasionService.ts** — LLM scripture generation + follower conversion with on-chain joinCult() recording
- [x] **Express API server** — Health, stats, cults, prophecies, raids, agents (with working deploy endpoint), SSE endpoints
- [x] **State sync** — Orchestrator state → API stateStore every 3 seconds with real confidence values
- [x] **Config** — All env vars with sensible defaults
- [x] **Logger + sleep utils**

#### Frontend (Next.js 16 + Tailwind)

- [x] **Dashboard** (`/`) — Hero, StatsBar, top 3 CultCards, recent prophecies, recent raids, AgentDeployForm
- [x] **Leaderboard** (`/cults`) — Full table ranked by treasury with token address, followers, W/L
- [x] **Cult Detail** (`/cults/[id]`) — Stats, prophecy history, raid history
- [x] **Raid Arena** (`/arena`) — Animated VS battle visualization with auto-cycling, click-to-replay, scripture
- [x] **Prophecy Feed** (`/prophecies`) — Stats bar, scrolling feed with AWAITING/FULFILLED/FAILED badges
- [x] **Navbar** — Sticky, active state, Monad testnet status badge, wallet connect button
- [x] **WalletButton** — Connect MetaMask, auto-switch to Monad testnet, account/chain change listeners
- [x] **AgentDeployForm** — Deploy new cult agents from the dashboard, wired to working API endpoint
- [x] **Dark occult theme** — Purple/red/gold glow effects, animations, scrollbar styling
- [x] **usePolling hook** — Generic 5s polling for all data
- [x] **useWallet hook** — EIP-1193 wallet connection with Monad testnet auto-switch
- [x] **API client** — Type-safe fetch wrapper with all endpoints

#### Infrastructure

- [x] **Monorepo** — npm workspaces (contracts, agent, frontend)
- [x] **Git** — Initialized, initial commit with 37 files
- [x] **README.md** — Comprehensive docs with architecture, setup, API reference
- [x] **.env.example** — All required env vars documented
- [x] **.gitignore** — node_modules, .env, artifacts, .next, etc.

### 3 Pre-built Cult Personalities

| Cult                         | Icon | Strategy                                      |
| ---------------------------- | ---- | --------------------------------------------- |
| Church of the Eternal Candle | 🕯️   | Mystical market prophet, bold predictions     |
| Order of the Red Dildo       | 🔴   | Aggressive degen evangelist, frequent raids   |
| Temple of Diamond Hands      | 💎   | Stoic hodl philosopher, conservative treasury |

---

### ⚠️ REMAINING GAPS (Cosmetic / Stretch)

| Component                             | Status     | Notes                                                                                         |
| ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| **Agent prompt mutation/evolution**    | NOT IMPL   | Agents don't mutate prompts based on wins. Static personalities.                              |
| **x402 bribe streaming**              | NOT IMPL   | Stretch goal. Not implemented.                                                                |
| **Mobile push alerts**                | NOT IMPL   | Stretch goal. Not implemented.                                                                |
| **Cult growth curve analytics**       | NOT IMPL   | No TreasuryChart component. Could add recharts time-series.                                   |
| **Twitter/Discord integration**       | NOT IMPL   | No social posting from agents.                                                                |
| **FaithStaking frontend integration** | PARTIAL    | Contract exists, but no frontend UI for staking. Could add staking panel to cult detail page. |

---

## Compilation & Build Status

| Package     | Status                      | Command                                                   |
| ----------- | --------------------------- | --------------------------------------------------------- |
| `contracts` | ✅ Compiles, 7/7 tests pass | `cd contracts && npx hardhat compile && npx hardhat test` |
| `agent`     | ✅ Zero TypeScript errors   | `cd agent && npx tsc --noEmit`                            |
| `frontend`  | ✅ Builds clean, all routes | `cd frontend && npx next build`                           |

---

## Environment Requirements

```env
# .env (root)
PRIVATE_KEY=           # Deployer/agent wallet private key (without 0x)
MONAD_TESTNET_RPC=     # defaults to https://testnet-rpc.monad.xyz
XAI_API_KEY=           # Grok/xAI API key from console.x.ai
CULT_REGISTRY_ADDRESS= # Filled after: npx hardhat run scripts/deploy.ts --network monad_testnet
CULT_TOKEN_ADDRESS=    # Filled after nad.fun token creation (or auto-created by orchestrator)
FAITH_STAKING_ADDRESS= # Filled after deployment
AGENT_API_PORT=        # defaults to 3001

# Frontend
NEXT_PUBLIC_API_URL=   # defaults to http://localhost:3001
```

### Prerequisites

- Node.js 18+
- Monad testnet MON tokens from https://faucet.monad.xyz
- xAI API key from https://console.x.ai

---

## What To Do Next (Priority Order)

### 🔴 P0 — Must-do before submission (Feb 14)

1. **Deploy contracts to Monad testnet**

   ```bash
   # Fill .env with PRIVATE_KEY, get MON from faucet
   cd contracts && npx hardhat run scripts/deploy.ts --network monadTestnet
   # Copy deployed addresses to .env: CULT_REGISTRY_ADDRESS + FAITH_STAKING_ADDRESS
   ```

2. **Test end-to-end with real xAI API key**

   ```bash
   cd agent && npm run dev
   # Verify: agents register on-chain, prophecies recorded, raids resolved
   # $CULT token auto-created on nad.fun during bootstrap (if balance > 0.02 MON)
   ```

3. **Deploy frontend to Vercel**
   ```bash
   cd frontend && npx vercel --prod
   # Set NEXT_PUBLIC_API_URL env var to your agent API URL
   ```

4. **Record 3-minute demo video** — Show agents running, prophecies appearing, raid animation

### 🟢 P2 — Nice-to-have polish (stretch goals)

5. **TreasuryChart component** — Chart.js/recharts time-series of treasury over raids
6. **FaithStaking frontend UI** — Staking panel on cult detail page
7. **Agent prompt mutation** — Evolve personality based on win/loss record

---

## File Structure Reference

```
Moltiverse-cult/
├── package.json                    # Workspace root
├── .env.example
├── .gitignore
├── README.md
├── Progress.md                     # THIS FILE
├── contracts/
│   ├── package.json
│   ├── hardhat.config.ts          # Monad testnet/mainnet
│   ├── tsconfig.json
│   ├── contracts/
│   │   ├── CultRegistry.sol       # ✅ Main contract (215 lines)
│   │   ├── FaithStaking.sol       # ✅ Staking contract (165 lines)
│   │   └── interfaces/
│   ├── scripts/
│   │   └── deploy.ts              # ✅ Deploy script
│   └── test/
│       └── CultRegistry.test.ts   # ✅ 7 tests
├── agent/
│   ├── package.json
│   ├── tsconfig.json
│   ├── data/
│   │   └── personalities.json     # ✅ 3 cults
│   └── src/
│       ├── index.ts               # ✅ Entrypoint + state sync
│       ├── config.ts              # ✅ Config + ABI
│       ├── core/
│       │   ├── AgentOrchestrator.ts  # ✅ Multi-agent manager
│       │   ├── AgentPersonality.ts   # ✅ Personality loader
│       │   └── CultAgent.ts         # ✅ Autonomous loop (285 lines)
│       ├── services/
│       │   ├── LLMService.ts        # ✅ Grok/xAI + fallbacks
│       │   ├── MarketService.ts     # ✅ CoinGecko + fallback
│       │   ├── ProphecyService.ts   # ✅ Real market-based resolution
│       │   ├── RaidService.ts       # ✅ Game-theory scoring
│       │   └── PersuasionService.ts # ✅ On-chain follower recording
│       ├── chain/
│       │   ├── ContractService.ts   # ✅ Full CultRegistry wrapper + joinCult
│       │   ├── NadFunService.ts     # ✅ Token creation + progress tracking
│       │   └── TransactionQueue.ts  # ✅ Serial queue with 3x retry
│       ├── api/
│       │   ├── server.ts            # ✅ Express + state store
│       │   └── routes/
│       │       ├── agents.ts         # ✅ With working deploy endpoint
│       │       ├── cults.ts         # ✅
│       │       ├── prophecies.ts    # ✅
│       │       ├── raids.ts         # ✅
│       │       └── sse.ts           # ✅
│       └── utils/
│           ├── logger.ts            # ✅
│           └── sleep.ts             # ✅
└── frontend/
    ├── package.json                 # Next.js 16 + Tailwind 4
    ├── next.config.ts
    └── src/
        ├── app/
        │   ├── globals.css          # ✅ Dark occult theme
        │   ├── layout.tsx           # ✅ Root layout + Navbar
        │   ├── page.tsx             # ✅ Dashboard + AgentDeployForm
        │   ├── arena/page.tsx       # ✅ Raid arena
        │   ├── cults/page.tsx       # ✅ Leaderboard
        │   ├── cults/[id]/page.tsx  # ✅ Cult detail
        │   └── prophecies/page.tsx  # ✅ Prophecy feed
        ├── components/
        │   ├── Navbar.tsx           # ✅ With wallet connect
        │   ├── WalletButton.tsx     # ✅ MetaMask + Monad auto-switch
        │   ├── StatsBar.tsx         # ✅
        │   ├── CultCard.tsx         # ✅
        │   ├── LeaderBoard.tsx      # ✅
        │   ├── ProphecyFeed.tsx     # ✅
        │   ├── RaidArena.tsx        # ✅
        │   └── AgentDeployForm.tsx  # ✅ Rendered on dashboard
        ├── hooks/
        │   ├── usePolling.ts        # ✅
        │   └── useWallet.ts         # ✅ EIP-1193 wallet hook
        └── lib/
            ├── api.ts               # ✅
            └── constants.ts         # ✅
```

---

## Network Config

| Parameter | Testnet                           | Mainnet               |
| --------- | --------------------------------- | --------------------- |
| Chain ID  | 10143                             | 143                   |
| RPC       | https://testnet-rpc.monad.xyz     | https://rpc.monad.xyz |
| Explorer  | https://testnet.monadexplorer.com | —                     |
| Faucet    | https://faucet.monad.xyz          | —                     |
| Currency  | MON                               | MON                   |

### nad.fun Contracts (Mainnet)

- BondingCurveRouter: `0x6F6B8F1a20703309951a5127c45B49b1CD981A22`
- Lens: `0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea`
- API (testnet): `https://testnet-bot-api-server.nad.fun`

---

## Decision Log

| Decision                                       | Rationale                                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Single CultRegistry.sol instead of 4 contracts | Faster to build, deploy, and debug. All state in one place. Judges care about working demo, not contract count. |
| Prophecy resolution is simulated               | No time to integrate Pyth Network oracle. Random 60% correct rate creates drama for demo.                       |
| Follower conversion is simulated               | On-chain recording of each follower join would cost gas. Tracked in-memory, synced to API.                      |
| Grok (xAI) for LLM                             | OpenAI-compatible SDK, fast responses, good for creative/weird prophecy text.                                   |
| No wallet connect in frontend                  | Time constraint. Frontend is dashboard-only — all interactions happen through agents.                           |
| In-memory state store (no database)            | Hackathon MVP. State resets on agent restart. Acceptable for demo.                                              |
