## AgentCult — Copilot Instructions

AgentCult is an autonomous AI cult-warfare simulator on Monad blockchain.
Three AI agents run perpetual observe→think→act→evolve loops, competing for
treasury and followers via prophecies, raids, and governance.

### Monorepo Layout

```
contracts/   — Solidity 0.8.24 + Hardhat (Monad EVM, chain 10143)
agent/       — TypeScript ESM backend (tsx runner, Express API on :3001)
frontend/    — Next.js 16 + React 19 + Tailwind v4 (dark occult theme)
```

Root `package.json` uses **npm workspaces**. Install per-package:
`cd contracts && npm i`, `cd agent && npm i`, `cd frontend && npm i`.

### Build & Run

```bash
# Contracts
cd contracts && npx hardhat compile
npx hardhat test                          # tests in contracts/test/
npx hardhat run scripts/deploy.ts --network monadTestnet

# Agent backend
cd agent && npm run dev                   # tsx watch mode
npm run start                             # production

# Frontend
cd frontend && npm run dev                # Next.js dev server
```

Root shortcuts: `npm run contracts:test`, `npm run agent:dev`,
`npm run frontend:dev`.

### Architecture & Data Flow

```
Frontend (Next.js) ──5s polling──▶ Agent API (Express :3001)
                                        │
                                  AgentOrchestrator
                                  ┌──────┼──────┐
                               Agent1  Agent2  Agent3  (each with own wallet)
                                  └──────┼──────┘
                                         │
                     ┌───────────────────┼───────────────────┐
                  LLMService      ContractService       InsForgeService
                  (Grok/xAI)       (ethers.js)          (persistence)
                                         │
                                   Monad Blockchain
                              CultRegistry.sol + nad.fun
```

- **`AgentOrchestrator`** (`agent/src/core/AgentOrchestrator.ts`):
  Bootstraps shared services, creates `CultAgent` instances, syncs state to
  API `stateStore` every 3s. On first run seeds from `agent/data/personalities.json`;
  subsequent runs restore from InsForge DB.
- **`CultAgent`** (`agent/src/core/CultAgent.ts`): 30–60s loop per agent.
  Each cycle: fetch on-chain state → LLM decides action → execute → resolve
  old prophecies. Persists state to InsForge after every cycle.
- **`TransactionQueue`** (`agent/src/chain/TransactionQueue.ts`): Serialises
  on-chain writes with 3-retry exponential backoff. Each agent has its own
  instance.
- **`InsForgeService`** (`agent/src/services/InsForgeService.ts`): All DB
  persistence (agents, memories, raids, prophecies, alliances) via
  `@insforge/sdk`. Singleton client, functional exports (not class methods).
  All operations return `{data, error}`.
- **Frontend**: `usePolling` hook (5s) polls Express REST API. SSE endpoint
  exists at `/api/events` for real-time. No global state library — each
  component polls independently.

### Agent Backend Conventions

- **ESM imports**: Always use `.js` extensions in import paths.
  `import { config } from "../config.js"` — the `tsconfig` uses
  `"module": "ESNext"` + `"moduleResolution": "bundler"`.
- **Contract ABIs**: Defined as inline human-readable strings in
  `agent/src/config.ts` (e.g., `CULT_REGISTRY_ABI`). Never import from
  `contracts/artifacts/`.
- **Service injection**: Services are classes instantiated once in
  `AgentOrchestrator` and passed to `CultAgent` via constructor. Per-agent
  services (LLM, ContractService) get the agent's own wallet/API key.
- **Logger**: Every file creates `const log = createLogger("ModuleName")`
  from `agent/src/utils/logger.ts`. Outputs `[ISO] [LEVEL] [Module] msg`.
  Enable debug with `DEBUG=1`.
- **LLM**: OpenAI SDK pointed at `api.x.ai/v1` with model `grok-3-fast`.
  Every LLM call has try/catch with a fallback response — agents must never
  crash on API failure.
- **Per-agent wallets**: Each agent gets its own `ethers.Wallet` (generated
  on first creation, stored in InsForge DB). `ContractService` accepts an
  optional `privateKey` param.

### Smart Contracts

Seven Solidity contracts in `contracts/contracts/` — no OpenZeppelin,
all hand-rolled access control:

| Contract | Purpose |
| --- | --- |
| `CultRegistry.sol` | Core state: cults, treasury, followers, raids, prophecies |
| `GovernanceEngine.sol` | Budget proposals (raid/growth/defense/reserve %) + voting |
| `FaithStaking.sol` | Stake MON for faith points |
| `EconomyEngine.sol` | Token economics |
| `SocialGraph.sol` | On-chain alliance/trust tracking |
| `RaidEngine.sol` | Raid resolution logic |
| `EventEmitter.sol` | Cross-contract event hub |

Tests use Hardhat toolbox (ethers + chai), nested `describe` blocks per
feature, `loadFixture` for fresh deploys. Typed contracts via TypeChain.

### Frontend Conventions

- App Router with `"use client"` pages. Path alias `@/` → `src/`.
- Components in `src/components/` — PascalCase filenames, no barrel exports,
  import directly: `import { Navbar } from "@/components/Navbar"`.
- API wrapper in `src/lib/api.ts` — plain object with typed fetch methods,
  read-only (no mutations). All types co-located in that file.
- `src/lib/constants.ts`: `API_BASE` from env, cult colour/icon maps for
  IDs 0/1/2 (purple/red/gold).
- `usePolling` hook: generic `<T>(fetcher, interval)` — wrap fetcher in
  `useCallback` at call site to stabilize reference.
- Dark theme: `bg-[#0a0a0a]` base, `className="dark"` on `<html>`.
  Purple/red/gold gradient accents per cult.

### Environment Variables

All config flows through `agent/src/config.ts` reading from `../.env` (root).
See `.env.example` for the full list.

**Required**: `PRIVATE_KEY`, `XAI_API_KEY`, `CULT_REGISTRY_ADDRESS`.
**Optional**: `GOVERNANCE_ENGINE_ADDRESS`, `CULT_TOKEN_ADDRESS`,
`AGENT_API_PORT`, `INSFORGE_BASE_URL`, `INSFORGE_ANON_KEY`.
Frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`).

### Frontend Patterns

- App Router with `"use client"` pages polling agent API.
- `src/lib/api.ts` — type-safe fetch wrapper; `src/lib/constants.ts` for
  `API_BASE` and cult colour maps.
- `src/hooks/usePolling.ts` — generic hook wrapping `setInterval` + fetch.
- Components are in `src/components/` — no barrel exports, import directly.
- Dark theme: `bg-[#0a0a0a]` base with purple/red/gold gradient accents.
