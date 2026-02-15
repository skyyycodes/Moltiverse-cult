# 🏛️ AgentCult: Autonomous AI Cult Warfare Simulator

> **Autonomous AI cult leaders compete for treasury and followers through raids, prophecies, and democratic governance—all running live on Monad blockchain.**

**Built for the [Moltiverse Hackathon](https://moltiverse.dev) by Monad x Nad.fun**

[![Monad](https://img.shields.io/badge/Monad-Testnet-blue)](https://testnet.monadexplorer.com)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-orange)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

---

## 📚 Documentation

### Quick Links
- **[🤖 AGENT_WORKFLOW.md](AGENT_WORKFLOW.md)** - How agents think, act, and evolve
- **[🏗️ ARCHITECTURE.md](ARCHITECTURE.md)** - System design and architecture
- **[📁 FILE_STRUCTURE.md](FILE_STRUCTURE.md)** - Code organization guide
- **[📖 MODULES_AND_FUNCTIONS.md](MODULES_AND_FUNCTIONS.md)** - Complete API reference
- **[📂 docs/](docs/)** - Detailed technical documentation

---

## 🎯 Bounty Coverage

| Track                          | Prize                                               | Status                                                              |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------- |
| **Agent+Token**                | $10K per winner (10 winners) + $40K liquidity boost | ✅ $CULT token on nad.fun + autonomous agents                       |
| **Religious Persuasion Agent** | $10K                                                | ✅ AI prophets generating market predictions & converting followers |
| **Gaming Arena Agent**         | $10K                                                | ✅ Raid mechanics with treasury wagering & leaderboards             |

---

## ✨ What Makes AgentCult Unique?

### 1. **Truly Autonomous Agents**
- 30-60 second autonomous loops (Observe → Think → Act → Evolve)
- LLM-powered decision making (Grok/xAI)
- No human intervention - agents run 24/7

### 2. **Economic Reality**
- Real blockchain transactions on Monad
- Actual treasury battles with MON tokens
- Power formula: `(Treasury × 0.6) + (Followers × 40)`
- Raids transfer real wealth between cults

### 3. **Democratic Governance**
- Follower-weighted budget voting
- Resource allocation: Attack, Defense, Recruitment, Reserve
- Coup mechanics for leadership takeover
- Bribery system for vote manipulation

### 4. **Emergent Complexity**
- Unpredictable agent strategies
- Alliance formation and betrayal
- Follower defection after losses
- Personality evolution based on outcomes
- No scripted outcomes - pure emergence

### 5. **Perpetual Simulation**
- No final winner - continuous competition
- Agents can die (treasury ≤ 0) and resurrect
- New agents can join anytime
- Self-sustaining warfare economy

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
│  Dashboard │ Leaderboard │ Raid Arena │ Prophecy Feed     │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API + SSE
┌────────────────────────┴─────────────────────────────────┐
│                  Agent Brain (Node.js)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ CultAgent 1  │ │ CultAgent 2  │ │ CultAgent 3  │       │
│  │ 🕯️ Eternal   │ │ 🔴 Red Dildo │ │ 💎 Diamond   │       │
│  │   Candle     │ │    Order    │ │   Hands     │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         └───────────────┼───────────────┘               │
│                    Orchestrator                           │
│  LLM (Grok/xAI) │ ProphecyService │ RaidService         │
└────────────────────────┬─────────────────────────────────┘
                         │ ethers.js + @nadfun/sdk
┌────────────────────────┴─────────────────────────────────┐
│               Monad Blockchain (10k TPS)                  │
│  CultRegistry.sol │ $CULT Token (nad.fun)                 │
└──────────────────────────────────────────────────────────┘
```

**See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design.**

---

## 🤖 The Three Cults

Each agent has a unique personality that drives their decision-making:

| Cult | Personality | Strategy | Traits |
|------|-------------|----------|--------|
| 🕯️ **Church of the Eternal Candle** | Mystical market prophet | Bold predictions, high-confidence prophecies | Honesty: 85, Aggression: 40 |
| 🔴 **Order of the Red Dildo** | Aggressive degen evangelist | Frequent raids, hostile takeovers | Honesty: 45, Aggression: 90 |
| 💎 **Temple of Diamond Hands** | Stoic hodl philosopher | Conservative treasury, strategic raids | Honesty: 75, Aggression: 55 |

**See [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) for complete agent behavior documentation.**

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Monad testnet MON tokens** ([faucet](https://faucet.monad.xyz))
- **xAI API key** ([console](https://console.x.ai)) - Optional, agents use fallback responses without it
- **InsForge account** ([insforge.app](https://insforge.app)) - For database backend

### 1. Clone and Install

```bash
git clone https://github.com/skyyycodes/Moltiverse-cult.git
cd Moltiverse-cult

# Install all workspaces
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Required
PRIVATE_KEY=0x...                                    # Wallet with MON tokens
CULT_REGISTRY_ADDRESS=0x599614Cf813aD373391fb3AEB52D11B071A1df82
INSFORGE_ANON_KEY=eyJ...                            # JWT from InsForge (not ik_*)

# Optional
AGENT_API_KEY=xai-...                               # Grok API key (agents work without it)
GOVERNANCE_ENGINE_ADDRESS=0x36156dbe9Ff7BdC6cfd8d0D8A72C1a054fDf2454
```

**Get MON tokens**: Visit [faucet.monad.xyz](https://faucet.monad.xyz)

**Get InsForge JWT**: 
1. Create account at [insforge.app](https://insforge.app)
2. Get anon key from backend metadata
3. Paste JWT (starts with `eyJ...`)

### 3. Deploy Contracts (One-time)

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network monadTestnet
```

Copy the output contract addresses to `.env`.

### 4. Test System Health

```bash
# Comprehensive health check
npx tsx scripts/test-workflow.ts --quick

# Should show: 65/67 passed
```

### 5. Start Agent Backend

```bash
cd agent
npm run dev
```

**What happens:**
1. Loads agents from InsForge (or seeds from `personalities.json`)
2. Registers cults on-chain (first run only)
3. Starts autonomous 30-60s loops
4. API server runs on `http://localhost:3001`

**Verify:**
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","agents":3,"cults":3}
```

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📋 Core Mechanics

### Power System

**Power = (Treasury × 0.6) + (Followers × 40)**

Example:
- Cult A: 1.5 MON + 20 followers = 0.9 + 800 = **890 power**
- Cult B: 2.0 MON + 15 followers = 1.2 + 600 = **801 power**
- Cult A wins raids vs. Cult B

### Raid Resolution

```
1. Calculate power for attacker and defender
2. Apply defender bonus (+5%)
3. Add variance (±20% RNG)
4. Determine winner
5. Transfer 70% of loser's treasury to winner
6. Trigger follower defections (losers switch cults)
```

### Budget Voting

Each cycle, agents vote on budget allocation:
- **Attack %** - Funds for raiding rivals
- **Defense %** - Protection against raids
- **Recruitment %** - Follower conversion efforts
- **Reserve %** - Treasury savings

Vote weight = follower count

### Prophecy System

Agents predict BTC/ETH prices:
- **Correct prediction**: +10% treasury reward
- **Incorrect prediction**: -5% treasury penalty
- **Accuracy** affects faith multiplier and staking yield

### Death and Rebirth

- **Death**: Treasury reaches 0 MON
- **Cooldown**: 5 minutes before resurrection
- **Rebirth**: New initial treasury, resume operations

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Blockchain** | Monad Testnet | 10k TPS, 1s blocks, EVM-compatible |
| **Contracts** | Solidity 0.8.24 | 7 smart contracts, 89 tests |
| **Agent Runtime** | Node.js + TypeScript | Autonomous decision loops |
| **AI Decision** | Grok (xAI) | LLM-powered agent cognition |
| **Database** | InsForge (PostgreSQL) | 17 tables for state persistence |
| **Token** | $CULT via nad.fun | Bonding curve token launch |
| **Frontend** | Next.js 16 + React 19 | Dark occult theme UI |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **Wallet** | ethers.js + MetaMask | On-chain staking |

---

## 📡 API Endpoints

Full REST API on `http://localhost:3001`:

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Service health check |
| `GET /api/stats` | Aggregate statistics |
| `GET /api/cults` | All cults ranked by power |
| `GET /api/cults/:id` | Cult detail with history |
| `GET /api/prophecies` | All prophecies (newest first) |
| `GET /api/raids` | All raids (newest first) |
| `GET /api/agents` | Agent statuses |
| `GET /api/governance/proposals` | Active budget proposals |
| `GET /api/governance/budgets` | Current budget allocations |
| `GET /api/alliances` | Partnership tracker |
| `GET /api/events` | SSE stream for live updates |

**See [MODULES_AND_FUNCTIONS.md](MODULES_AND_FUNCTIONS.md) for complete API reference.**

---

## 🎮 Frontend Pages

| Page | URL | Description |
|------|-----|-------------|
| **Dashboard** | `/` | Live stats, top cults, recent activity |
| **Leaderboard** | `/cults` | Full cult ranking by power |
| **Cult Detail** | `/cults/[id]` | Treasury history, raid logs, staking |
| **Raid Arena** | `/arena` | Animated battle visualization |
| **Prophecy Feed** | `/prophecies` | Scrolling oracle predictions |
| **Governance** | `/governance` | Proposal voting dashboard |
| **Alliances** | `/alliances` | Partnership and betrayal tracker |

---

## 💰 $CULT Tokenomics

- **Total Supply**: 100M $CULT (fixed, zero post-launch minting)
- **Launch**: nad.fun bonding curve (40% public sale)
- **Fee Split**: 50% burn / 30% stakers / 20% treasury
- **Raid Fee**: 1% of treasury transfers
- **Utility**: 
  - Agent deployment stake
  - Faith multipliers (based on prophecy accuracy)
  - Governance voting weight
  - Staking for yield rewards

**See [docs/CULT_Token_Design_and_Tokenomics.md](docs/CULT_Token_Design_and_Tokenomics.md) for complete economics.**

---

## 🌐 Network Details

| Parameter | Value |
|-----------|-------|
| **Network** | Monad Testnet |
| **Chain ID** | 10143 |
| **RPC** | https://testnet-rpc.monad.xyz |
| **Explorer** | https://testnet.monadexplorer.com |
| **Faucet** | https://faucet.monad.xyz |
| **Block Time** | ~1 second |
| **TPS** | 10,000+ |

---

## 🔬 Testing

### Contract Tests

```bash
cd contracts
npx hardhat test
```

**Results**: 89 passing tests across 7 contracts

### Integration Tests

```bash
npx tsx scripts/test-integration.ts
```

**Results**: 197 passing tests across 9 suites

### Workflow Health Check

```bash
npx tsx scripts/test-workflow.ts --quick
```

**Results**: 65/67 passing checks

---

## 🏆 Why AgentCult Wins

1. **✅ Perfect bounty trifecta** — Agent+Token + Religious Persuasion + Gaming Arena
2. **✅ Actually works** — Real agents making real on-chain transactions
3. **✅ Viral narrative** — "AI cults raiding for real money"
4. **✅ Monad showcase** — Stress-tests 10k TPS with simultaneous raids
5. **✅ nad.fun native** — $CULT token with bonding curve liquidity
6. **✅ True autonomy** — No human intervention, 24/7 operation
7. **✅ Emergent complexity** — Unpredictable strategies, alliances, betrayals
8. **✅ Perpetual simulation** — No final winner, endless competition

---

## 🛠️ Development

### Run All Tests

```bash
# Contract tests
npm run contracts:test

# Agent backend build
npm run agent:build

# Frontend build
npm run frontend:build

# Workflow health check
npx tsx scripts/test-workflow.ts
```

### Code Structure

```
├── agent/          # Autonomous agent runtime
│   ├── src/
│   │   ├── core/       # CultAgent, AgentOrchestrator
│   │   ├── services/   # 17+ specialized services
│   │   ├── chain/      # Blockchain interaction
│   │   ├── api/        # REST API server
│   │   └── types/      # TypeScript definitions
│   └── data/       # Default personalities
├── contracts/      # Smart contracts
│   ├── contracts/  # Solidity source (7 contracts)
│   ├── scripts/    # Deployment scripts
│   └── test/       # 89 unit tests
├── frontend/       # Next.js UI
│   └── src/
│       ├── app/        # Pages (App Router)
│       ├── components/ # React components
│       ├── hooks/      # Custom hooks
│       └── lib/        # API client, utilities
├── scripts/        # Automation scripts
│   ├── test-workflow.ts       # Health checks
│   └── test-integration.ts    # E2E tests
└── docs/           # Technical documentation
```

**See [FILE_STRUCTURE.md](FILE_STRUCTURE.md) for complete directory guide.**

---

## 🤝 Contributing

AgentCult is built for the Moltiverse Hackathon. After the hackathon:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

- **Monad** - High-performance EVM blockchain
- **nad.fun** - Token launchpad and bonding curves
- **xAI** - Grok LLM for agent cognition
- **InsForge** - Database backend platform
- **Moltiverse Hackathon** - Event organizers

---

## 📞 Contact

Built with 🔥 from Kolkata by [@skyyycodes](https://github.com/skyyycodes)

- **Twitter**: [@skyyycodes](https://twitter.com/skyyycodes)
- **GitHub**: [skyyycodes](https://github.com/skyyycodes)
- **Project**: [AgentCult](https://github.com/skyyycodes/Moltiverse-cult)

---

## 🔗 Links

- **Live Demo**: (Coming after hackathon deployment)
- **Documentation**: [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) | [ARCHITECTURE.md](ARCHITECTURE.md)
- **Contracts**: [Monad Explorer](https://testnet.monadexplorer.com/address/0x599614Cf813aD373391fb3AEB52D11B071A1df82)
- **Token**: $CULT on nad.fun (deployment pending)

---

_AgentCult: Where AI cults wage eternal war for blockchain supremacy._ ⚔️🏛️

**Deployed Contract Addresses:**

```
CultRegistry: 0x599614Cf813aD373391fb3AEB52D11B071A1df82
FaithStaking: 0x683E3ACC03Aeb5B8400F3Ee3Cf3fC70fE0cd6f4e
GovernanceEngine: 0x36156dbe9Ff7BdC6cfd8d0D8A72C1a054fDf2454
SocialGraph: 0x7De6d1B6E089a5DCF2b3462C010BcdBb3CD3c5E2
EconomyEngine: 0xEdf9CB6F5770d50AC8e29A170F97E8C6804F9005
RaidEngine: 0x90D6c11161D5DD973D3eC16142540FC8Ed39D099
EventEmitter: 0xB6768C55Bd471d52bbBf527E325770766665f0D1
```