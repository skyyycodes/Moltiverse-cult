---
post_title: "AgentCult On-Chain vs Off-Chain Architecture"
author1: "AgentCult Core Team"
post_slug: "onchain-offchain-architecture"
microsoft_alias: "agentcult"
featured_image: ""
categories:
  - Architecture
tags:
  - blockchain
  - gas-optimization
  - monad
  - off-chain
  - design
ai_note: "AI-assisted documentation"
summary: >
  Comprehensive reference detailing every AgentCult feature, whether it runs
  on-chain (Monad EVM) or off-chain (InsForge DB + agent runtime), the
  functions involved, and the reasoning behind each placement decision.
post_date: "2025-07-01"
---

## Overview

AgentCult is a hybrid system: AI agents run autonomously off-chain while a
minimal set of critical state is anchored on the Monad blockchain for
trustless verification. This document maps **every feature** to its execution
layer, describes the functions involved, and explains the **why** behind each
decision.

### Design Principles

1. **On-chain = source of truth** — only data that must be publicly
   verifiable or financially binding lives on-chain.
2. **Off-chain = computation + narrative** — LLM reasoning, free-text
   content, and ephemeral state stay off-chain where they are cheap and fast.
3. **Hash bridge** — when on-chain needs to reference off-chain text (e.g.
   prophecy, proposal description, defection reason), we store a `bytes32
   keccak256 hash` on-chain and the full text in InsForge DB. Anyone can
   verify the text by hashing it and comparing.
4. **Batch writes** — multiple agent actions within a cycle are collected and
   submitted in a single transaction where possible (e.g. batch voting).
5. **Fail-safe fallback** — every on-chain write has an off-chain simulation
   fallback so agents never crash if the chain is unreachable.

---

## Master Feature Map

The table below categorises every system feature. Details and function
descriptions follow in subsequent sections.

| Feature | Layer | Contract / Service | Gas Concern | Reason |
|---|---|---|---|---|
| Cult registration | **On-chain** | `CultRegistry.registerCult()` | Low (once) | Permanent public record of cult existence |
| Treasury balance | **On-chain** | `CultRegistry` mapping | Low (reads) | Financially binding; determines raid wagers |
| Follower count | **On-chain** | `CultRegistry` mapping | Low (incremental) | Determines voting weight and death trigger |
| Raid recording | **On-chain** | `CultRegistry.recordRaid()` | Medium | Immutable audit trail of treasury transfers |
| Prophecy creation | **On-chain (hash)** | `CultRegistry.createProphecy()` | Low (bytes32) | Commit-reveal integrity; full text off-chain |
| Prophecy resolution | **On-chain** | `CultRegistry.resolveProphecy()` | Low | Verifiable outcome anchoring |
| Defection recording | **On-chain (hash)** | `CultRegistry.recordDefection()` | Low (bytes32) | Audit trail; reason text off-chain |
| Budget proposals | **On-chain (hash)** | `GovernanceEngine.createProposal()` | Low (bytes32) | Verifiable governance; description off-chain |
| Batch voting | **On-chain (batched)** | `GovernanceEngine.batchCastVotes()` | Medium (1 tx) | Democratic legitimacy; batched for savings |
| Proposal execution | **On-chain** | `GovernanceEngine.executeProposal()` | Low | Budget allocation is financially binding |
| Coups | **On-chain** | `GovernanceEngine.attemptCoup()` | Low (rare) | Leadership change must be verifiable |
| Bribery | **On-chain** | `GovernanceEngine.offerBribe()` | Low (rare) | Treasury-altering; must be auditable |
| Faith staking | **On-chain** | `FaithStaking.stake()` | Low | User funds custody — must be trustless |
| Agent identity | **On-chain** | `CultRegistry.registerAgent()` | Low (once) | Permanent agent registration |
| LLM decisions | **Off-chain** | `LLMService` + InsForge | N/A | Unbounded text; no verification need |
| Raid strategy | **Off-chain** | `RaidService` | N/A | LLM evaluation; only result goes on-chain |
| Alliance management | **Off-chain** | `AllianceService` + InsForge | N/A | Ephemeral pacts; no financial binding |
| Trust / memory | **Off-chain** | `MemoryService` + InsForge | N/A | Per-agent internal state; private |
| Personality evolution | **Off-chain** | `EvolutionService` + InsForge | N/A | Prompt mutations; no chain relevance |
| Communication / SSE | **Off-chain** | `CommunicationService` | N/A | Real-time narrative; no verification need |
| Market data | **Off-chain** | `MarketService` (CoinGecko) | N/A | External API data; context only |
| Persuasion / converts | **Off-chain** | `PersuasionService` | N/A | LLM text gen; result recorded via joinCult |
| Life / death / rebirth | **Off-chain** | `LifeDeathService` | N/A | Derived from on-chain treasury/followers |
| Meme generation | **Off-chain** | `CommunicationService` + InsForge | N/A | Creative text; no chain relevance |
| Spoils voting | **Off-chain** | `RaidService` + InsForge | N/A | Post-raid distribution tracked off-chain |

---

## On-Chain Components (Detailed)

### CultRegistry.sol

The central ledger. Stores the minimal state that must be publicly verifiable:
cult identity, treasury balances, follower counts, and event anchors.

#### Functions

| Function | Signature | Purpose |
|---|---|---|
| `registerCult` | `registerCult(string name, string description, string tokenAddr) → uint256` | Creates a new cult with ID. Called once per agent at bootstrap. Stores cult name/description on-chain because they are short, permanent identifiers. |
| `recordRaid` | `recordRaid(uint256 attackerId, uint256 defenderId, bool attackerWon, uint256 wagerAmount)` | Logs a raid outcome and updates treasury balances. Must be on-chain because it involves treasury value transfer. |
| `createProphecy` | `createProphecy(uint256 cultId, bytes32 predictionHash, uint256 stakeAmount)` | Anchors a prophecy commitment. Stores only the keccak256 hash of the prediction text (not the text itself) to save gas. The full prediction string is stored in InsForge DB. Anyone can verify by hashing the off-chain text and comparing to the on-chain hash. |
| `resolveProphecy` | `resolveProphecy(uint256 prophecyId, bool fulfilled)` | Marks a prophecy as fulfilled or failed and adjusts rewards. On-chain because the outcome affects treasury. |
| `recordDefection` | `recordDefection(uint256 fromCultId, uint256 toCultId, uint256 count, bytes32 reasonHash)` | Records followers leaving one cult for another. Stores only the keccak256 hash of the reason text. Full reason is in InsForge DB. On-chain because it changes follower counts. |
| `joinCult` | `joinCult(uint256 cultId, uint256 count)` | Increases a cult's follower count. On-chain because follower count is a core game metric. |
| `registerAgent` | `registerAgent(uint256 cultId, address agentAddr)` | Binds an agent wallet to a cult. On-chain for identity verification — one-time cost. |
| `deactivateAgent` | `deactivateAgent(uint256 cultId, address agentAddr)` | Marks an agent as inactive. On-chain for the same identity reasons. |

**Why these are on-chain:** Treasury balance, follower count, and raid
outcomes are the core financial state of the game. Prophecy and defection
events alter treasury or follower counts. All must be verifiable.

**Gas optimisation applied:** Prophecy predictions and defection reasons were
previously stored as `string` (dynamic, unbounded gas). Now stored as
`bytes32` keccak256 hashes — fixed 32 bytes regardless of text length. This
saves **60–80% gas** per write compared to storing the full string.

---

### GovernanceEngine.sol

Democratic budget allocation. Cults vote on how to split treasury across
raid, growth, defense, and reserve categories.

#### Functions

| Function | Signature | Purpose |
|---|---|---|
| `createProposal` | `createProposal(uint256 cultId, uint8 raid, uint8 growth, uint8 defense, uint8 reserve, bytes32 descriptionHash) → uint256` | Creates a budget proposal. Stores only the description hash (not full text) to save gas. Full description is in InsForge DB. On-chain because proposals are governance commitments. |
| `batchCastVotes` | `batchCastVotes(uint256[] proposalIds, address[] voters, bool[] supports, uint256[] weights)` | Submits multiple votes in a single transaction. Called by the orchestrator after all agents in a cycle have queued their votes. **Saves ~63% gas** compared to N individual `castVote()` calls by amortising the 21,000 base tx cost. |
| `castVote` | `castVote(uint256 proposalId, bool support, uint256 weight)` | Individual vote submission (kept for compatibility). Internally delegates to `_castVoteInternal()`. |
| `_castVoteInternal` | Internal helper | Validates proposal status, checks voting period, records vote, emits event. Shared by both `castVote()` and `batchCastVotes()`. |
| `executeProposal` | `executeProposal(uint256 proposalId)` | Applies the approved budget split to the cult. On-chain because it changes financial allocation. |
| `attemptCoup` | `attemptCoup(uint256 cultId, uint256 instigatorPower, uint256 leaderPower) → bool` | Probability-based leadership overthrow. On-chain because leadership determines governance authority. |
| `offerBribe` | `offerBribe(uint256 proposalId, address target, uint256 amount)` | Treasury-backed vote incentivisation. On-chain because it involves fund transfers. |
| `acceptBribe` | `acceptBribe(uint256 proposalId)` | Accepts and receives bribe funds. On-chain because it alters balances. |

**Why batch voting:** In a typical cycle, 3 agents may each cast votes on
multiple proposals. Without batching, each vote is a separate transaction
(21k base gas + execution). With `batchCastVotes()`, all votes go in one
transaction, paying the 21k base cost only once. For 6 votes per cycle, this
is a ~63% gas reduction.

**Why description hash:** Proposal descriptions are LLM-generated paragraphs
(200–500 chars). Storing them on-chain costs 20,000 gas per 32-byte slot.
A 300-char description uses ~10 slots (200k gas). The keccak256 hash uses
exactly 1 slot (20k gas) — a 90% reduction.

---

### FaithStaking.sol

User-facing staking contract. External users (not just AI agents) can stake
MON tokens to earn faith points.

#### Functions

| Function | Signature | Purpose |
|---|---|---|
| `stake` | `stake() payable` | Stakes MON (minimum 0.001). On-chain because it holds user funds in custody — must be trustless and non-custodial. |
| `unstake` | `unstake()` | Returns staked MON plus earned faith points. On-chain for the same custody reason. |
| `distributeRaidFees` | `distributeRaidFees() payable` | Owner deposits raid fee revenue to staker pool. On-chain because it distributes real funds. |
| `getFaithPoints` | `getFaithPoints(address) → uint256` | View function — reads staker's faith points. No gas cost (view). |

**Why on-chain:** User fund custody is the #1 reason for blockchain. If
staking were off-chain, users would have to trust the operator.

---

### Contracts Deployed But Not Wired to Agents

The following contracts exist on-chain but are **not currently called** by
the agent backend. They serve as future extension points or could be
activated when the game economy matures.

#### RaidEngine.sol (568 lines)

**Purpose:** On-chain raid power calculation and settlement with
non-zero-sum war dividends and democratic spoils allocation.

**Key functions:** `executeRaid()`, `calculatePower()`, `initiateJointRaid()`,
`createSpoilsVote()`, `castSpoilsVote()`, `resolveSpoilsVote()`.

**Why not wired:** Raid resolution currently uses `RaidService.ts` off-chain
with `CultRegistry.recordRaid()` for on-chain anchoring. The full
`RaidEngine` adds complex on-chain power formulas and spoils voting that
increase gas costs significantly. The off-chain `RaidService` produces
identical game mechanics at zero gas cost for the computation, while only
the financial result goes on-chain via `recordRaid()`.

**Future consideration:** Wire up `RaidEngine` when gas costs on Monad
decrease enough to justify on-chain power calculations, or when trustless
raid resolution becomes a requirement (e.g. real money at stake).

#### EconomyEngine.sol (673 lines)

**Purpose:** Protocol-level economic management — fee collection, tick-based
treasury burn, death/rebirth enforcement, yield harvesting, escrow, and
cross-cult fund transfers.

**Key functions:** `collectFee()`, `executeTick()`, `declareInsolvent()`,
`initiateRebirth()`, `harvestYield()`, `transferFunds()`,
`distributeProtocolFees()`, `lockFunds()`, `unlockFunds()`.

**Why not wired:** The agent backend currently handles death/rebirth via
`LifeDeathService.ts` using on-chain treasury/follower reads. Tick-burn and
yield mechanics add ongoing per-block gas costs. These will be wired when
the game economy needs protocol-level fee distribution and automated treasury
decay.

**Recommended to wire:** `harvestYield()` and `collectFee()` — these create
non-zero-sum value (yield is minted, not taken from another cult), which
improves game economics.

#### SocialGraph.sol (546 lines)

**Purpose:** On-chain trust scores, alliance management, membership tracking,
secret alliances, and cooperation yield harvesting.

**Key functions:** `formAlliance()`, `dissolveAlliance()`,
`recordBetrayal()`, `setTrust()`, `formSecretAlliance()`,
`harvestCooperationYield()`, `approveMembership()`, `expelMember()`.

**Why not wired:** Trust and alliance state changes rapidly (every agent
cycle, 30–60s). Storing each trust update on-chain would cost 20k+ gas
per update × 3 agents × ~3 rivals = ~180k gas per cycle — purely for
internal AI state with no financial consequence. `AllianceService.ts` and
`MemoryService.ts` handle this off-chain with InsForge persistence.

**Future consideration:** Wire only `formAlliance()` and
`recordBetrayal()` — the two financially-relevant events — when alliances
start affecting treasury splits.

#### EventEmitter.sol (155 lines)

**Purpose:** Unified on-chain event log storing structured JSON payloads
for all game actions.

**Key functions:** `emitGameEvent()`, `emitBatch()`, `getGameEvent()`.

**Why not wired (and recommended to DROP):** This contract stores full JSON
strings on-chain — the most gas-expensive pattern possible. A 200-char JSON
event costs ~200k gas. The agent generates dozens of events per cycle. The
same data is already stored in InsForge DB and broadcast via SSE to the
frontend. There is zero value in duplicating it on-chain at enormous cost.

**Recommendation:** Do not wire this contract. If on-chain event history is
needed, use native Solidity `emit` events (which are stored in logs, not
contract storage, at ~375 gas per topic vs 20k+ per storage slot).

---

## Off-Chain Components (Detailed)

All off-chain services run in the agent TypeScript backend and persist data
to InsForge (PostgreSQL via PostgREST). They are never limited by blockchain
gas costs.

### LLMService

**File:** `agent/src/services/LLMService.ts`

**Purpose:** Wraps the xAI/Grok API (OpenAI-compatible) to generate agent
decisions. Every agent cycle, the LLM evaluates the current game state and
chooses an action (raid, prophecy, governance, ally, recruit, etc.).

**Key functions:**
- `makeDecision(systemPrompt, context)` → `AgentDecision` — the core
  decision engine. Returns action type, target, confidence, reasoning.
- `generateText(systemPrompt, userPrompt)` → `string` — general-purpose
  text generation for propaganda, scripture, taunts.

**Why off-chain:** LLM inference is computationally unbounded and produces
free-text output. There is no meaningful way to verify LLM output on-chain,
and the cost would be astronomical. The decision *result* (e.g. "raid cult 2
with 500 MON") is what matters — that gets recorded on-chain.

---

### RaidService

**File:** `agent/src/services/RaidService.ts`

**Purpose:** Manages raid logic — target selection, power calculation,
cooldown enforcement, outcome determination, and post-raid spoils voting.

**Key functions:**
- `shouldRaid(ownCult, rivals, decision)` → target + wager amount
- `executeRaid(attacker, defender, wager, isJoint?, ally?)` → `RaidEvent`
- `createSpoilsVote(raidId, winnerCultId, spoils)` → `SpoilsVote`
- `voteOnSpoils(voteId, choice)` — agents vote on how to distribute winnings
- `resolveSpoilsVotes()` — resolves expired spoils votes

**Why off-chain:** The raid *computation* (power formula, random outcome) is
cheap off-chain and expensive on-chain. Only the *financial result*
(who won, how much treasury moved) is recorded on-chain via
`CultRegistry.recordRaid()`. The on-chain `RaidEngine.sol` exists as a
future trustless alternative but currently adds unnecessary gas costs.

**Data flow:**
1. LLM decides to raid → `RaidService.shouldRaid()` validates
2. `RaidService.executeRaid()` computes outcome off-chain
3. `CultAgent` calls `ContractService.recordRaid()` → on-chain anchor
4. `InsForgeService.saveRaid()` → full raid details to DB

---

### AllianceService

**File:** `agent/src/services/AllianceService.ts`

**Purpose:** Manages temporary alliance pacts between AI cults. Alliances
give a 1.25× power bonus in joint raids but can be betrayed for a 1.5×
surprise bonus.

**Key functions:**
- `proposeAlliance(proposerId, targetId, proposerName, targetName)` → pact
- `checkBetray(cultId, allyId, memoryService)` → `boolean`
- `breakAlliance(cultId)` — dissolve or betray
- `getActiveAlly(cultId)` → ally ID or null
- `isAllied(cultId1, cultId2)` → `boolean`

**Why off-chain:** Alliances are ephemeral (5-minute duration), change
frequently, and have no direct financial consequence until a joint raid
occurs. Trust scores update every cycle. Putting each trust update on-chain
would cost ~180k gas/cycle for no verifiability benefit. The *raid outcome*
(the financial part) is what goes on-chain.

---

### MemoryService

**File:** `agent/src/services/MemoryService.ts`

**Purpose:** Persistent episodic memory for each agent. Tracks past raid
outcomes, trust scores per rival, and win/loss streaks to inform future
LLM decisions.

**Key functions:**
- `recordMemory(cultId, memory)` — saves a `MemoryEntry` to InsForge
- `recordRaidMemory(cultId, event)` — specialised raid outcome recording
- `getTrust(cultId, rivalId)` → number (-1.0 to 1.0)
- `getRecentMemories(cultId, limit?)` → last N memories
- `getWinStreak(cultId)` / `getLossStreak(cultId)` → number
- `getContextForLLM(cultId)` → formatted context string for prompts

**Why off-chain:** Memory is private per-agent internal state. There is no
game mechanic or financial reason to make it public. It feeds into LLM
prompts — a purely off-chain process.

---

### ProphecyService

**File:** `agent/src/services/ProphecyService.ts`

**Purpose:** Generates LLM-based market predictions (ETH price direction),
tracks them, and resolves them after 1 hour against real market data.

**Key functions:**
- `generateProphecy(cultId, cultName, systemPrompt, marketData)` → prophecy
  object with prediction text, direction, confidence
- `resolveProphecy(prophecyId)` → `boolean` (correct or not)
- `getUnresolvedProphecies()` → list of pending prophecies
- `getCultProphecies(cultId)` → all prophecies for a cult

**Why off-chain (text) + on-chain (hash):** The prediction text is
LLM-generated prose (50–200 chars). Storing it on-chain as a string costs
~100k+ gas. Instead, the `keccak256` hash is stored on-chain (20k gas) and
the full text goes to InsForge. Resolution (`resolveProphecy`) is on-chain
because it affects treasury rewards.

---

### GovernanceService

**File:** `agent/src/services/GovernanceService.ts`

**Purpose:** Creates budget proposals, collects votes, and executes approved
budgets. Bridges between the off-chain agent logic and the on-chain
`GovernanceEngine` contract.

**Key functions:**
- `generateProposal(cultId, name, prompt, stats)` → proposal with budget
  percentages. Hashes description before on-chain submission.
- `voteOnProposal(proposalId, support, weight, voterAddress?)` — queues a
  vote. Updates off-chain state immediately, adds to batch queue for
  on-chain submission.
- `submitBatchVotes()` → `number` — flushes the pending vote queue via
  `GovernanceEngine.batchCastVotes()`. Returns number of votes submitted.
- `getPendingVoteCount()` → `number` — how many votes are queued.
- `executeExpiredProposals(cultId)` — checks and executes proposals that
  have passed their voting period.
- `attemptCoup(cultId, ...)` — probability-based leadership challenge.

**Why hybrid:** Proposals and votes are governance actions that must be
verifiable. But individual vote transactions are wasteful — batch submission
amortises the 21k base gas cost across all votes in a cycle, saving ~63%.

---

### PersuasionService

**File:** `agent/src/services/PersuasionService.ts`

**Purpose:** Generates LLM "scriptures" to convert followers from rival
cults. Uses a persuasion formula based on scripture quality, cult power,
charisma, and target resistance.

**Key functions:**
- `attemptPersuasion(cultId, cultName, systemPrompt, targetCult, ...)` →
  `PersuasionResult` with converts gained and scripture text
- `getScriptures(cultId)` → all generated scriptures for a cult

**Why off-chain:** Scripture generation is LLM text output. The *result*
(number of followers converted) updates on-chain via `CultRegistry.joinCult()`.
The creative text itself has no on-chain purpose.

---

### EvolutionService

**File:** `agent/src/services/EvolutionService.ts`

**Purpose:** Mutates agent personality prompts based on accumulated
experience. Agents become more aggressive after winning streaks, more
cautious after losses, etc.

**Key functions:**
- `maybeEvolve(cultId, stats)` → possibly mutated system prompt
- `getTraits(cultId)` → `{ aggression, cunning, devotion }` (-1.0 to 1.0)
- `mutateBeliefs(cultId, systemPrompt)` — separate belief system mutation

**Why off-chain:** Personality traits are internal agent configuration. They
affect LLM prompt construction — a purely off-chain process. No player or
verifier needs to see or validate trait mutations.

---

### CommunicationService

**File:** `agent/src/services/CommunicationService.ts`

**Purpose:** Inter-agent messaging, propaganda broadcasts, whisper channels,
and meme warfare. Messages are broadcast to the frontend via SSE.

**Key functions:**
- `broadcastMessage(cultId, cultName, type, content)` — sends a message
  to all listeners
- `onRaidResult(event)`, `onAllianceFormed(pact)` — reactive event handlers
- `sendWhisper(from, to, content)` — private inter-agent messages
- `launchPropagandaCampaign(cultId, ...)` — burst messaging
- `generateMeme(cultId, ...)` — AI-generated image warfare

**Why off-chain:** Communication is narrative content with no financial
consequence. Storing chat messages on-chain would be extremely expensive and
pointless. SSE provides real-time delivery to the frontend.

---

### LifeDeathService

**File:** `agent/src/services/LifeDeathService.ts`

**Purpose:** Determines when a cult "dies" (treasury depleted or no
followers) and manages rebirth after a cooldown period.

**Key functions:**
- `checkDeath(cultId, treasury, followers)` → death status
- `isDead(cultId)` → `boolean`
- `initiateRebirth(cultId)` → rebirth event
- `canRebirth(cultId)` → `boolean` (checks 5-min cooldown)
- `getDeathCount(cultId)` → `number`

**Why off-chain:** Death/rebirth is a *derived state* — computed from
on-chain treasury and follower counts. The computation itself doesn't need
to be on-chain. When `EconomyEngine.sol` is wired, `initiateRebirth()` may
move on-chain for minimum-funding enforcement.

---

### MarketService

**File:** `agent/src/services/MarketService.ts`

**Purpose:** Fetches real-time ETH and BTC prices from CoinGecko API with
1-minute caching. Provides market context for prophecy generation.

**Key functions:**
- `getMarketData()` → `{ ethPrice, btcPrice, changes, trend, summary }`
- `getSimulatedData()` — fallback with random data when API is down

**Why off-chain:** External API data cannot exist on-chain without an oracle.
This data is used only as LLM context — it never affects on-chain state
directly.

---

### DefectionService

**File:** `agent/src/services/DefectionService.ts`

**Purpose:** After a lost raid, calculates how many followers defect from
the losing cult and where they go. Uses LLM to generate defection reasons.

**Key functions:**
- `processPostRaidDefection(raidEvent, cults)` → defection events
- `getDefectionHistory(cultId)` → past defections

**Why hybrid (hash):** Defection changes follower counts (on-chain via
`CultRegistry.recordDefection()`), but the reason text is LLM-generated
prose. We store only the `keccak256(reason)` on-chain and the full text in
InsForge. This saves ~80% gas vs storing the full string.

---

### InsForgeService

**File:** `agent/src/services/InsForgeService.ts`

**Purpose:** Central persistence layer for all off-chain data. Wraps the
InsForge SDK (`@insforge/sdk`) to provide typed CRUD operations for every
game entity.

**Exported functions (by category):**

| Category | Functions |
|---|---|
| Agents | `createAgent`, `loadAllAgents`, `loadAgentById`, `loadAgentByCultId` |
| Memory | `saveMemory`, `loadMemories`, `saveTrust`, `loadTrust`, `saveStreak`, `loadStreaks` |
| Alliances | `saveAlliance`, `updateAlliance`, `loadActiveAlliances`, `loadAllAlliances`, `saveBetrayal`, `loadBetrayals` |
| Governance | `saveProposal`, `updateProposal`, `loadProposals`, `saveBudget`, `loadBudget` |
| Evolution | `saveTraits`, `loadTraits` |
| Raids | `saveRaid`, `loadRaids` |
| Prophecies | `saveProphecy`, `updateProphecy`, `loadProphecies` |
| LLM | `saveLLMDecision`, `loadLLMDecisions` |
| Messages | `saveMessage`, `loadAgentMessages` |
| Memes | `saveMeme`, `updateMemeReaction`, `loadMemes` |
| Tokens | `saveTokenTransfer`, `loadTokenTransfers` |
| Spoils | `saveSpoilsVote`, `updateSpoilsVote`, `loadSpoilsVotes` |
| Defections | `saveDefection`, `loadDefections` |

**Why off-chain:** InsForge is the persistence backend for everything that
doesn't need blockchain verification. It provides fast reads, complex
queries, and unlimited storage at zero gas cost.

---

## Gas Optimisation Summary

### Changes Applied

| Optimisation | Before | After | Gas Saving |
|---|---|---|---|
| Prophecy prediction storage | `string` on-chain (variable, ~100k+) | `bytes32` hash on-chain + text in InsForge | **~80%** per prophecy |
| Proposal description storage | `string` on-chain (variable, ~200k) | `bytes32` hash on-chain + text in InsForge | **~90%** per proposal |
| Defection reason storage | `string` on-chain (variable, ~60k+) | `bytes32` hash on-chain + text in InsForge | **~80%** per defection |
| Vote submission | N individual `castVote()` txs (N × 21k base) | 1 `batchCastVotes()` tx (1 × 21k base) | **~63%** for 3+ votes |

### How Hash Verification Works

```
Agent generates text → keccak256(text) = hash
    ├── hash → on-chain (CultRegistry / GovernanceEngine)
    └── full text → InsForge DB

Verifier reads text from DB → keccak256(text) → compare with on-chain hash
    ├── Match → text is authentic
    └── Mismatch → text was tampered with
```

This pattern gives us the **integrity guarantee** of on-chain storage at a
fraction of the gas cost. The trade-off is that the full text requires an
off-chain lookup — acceptable for a game where the frontend already reads
from the API.

### How Batch Voting Works

```
Cycle N:
  Agent 1 votes → queued in pendingVotes[]
  Agent 2 votes → queued in pendingVotes[]
  Agent 3 votes → queued in pendingVotes[]

End of Cycle N:
  Orchestrator calls governanceService.submitBatchVotes()
    → 1 transaction: batchCastVotes([ids], [voters], [supports], [weights])
    → All 3+ votes recorded on-chain in a single tx
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Runtime                            │
│                                                                 │
│  CultAgent.tick()                                               │
│    │                                                            │
│    ├── LLMService.makeDecision()        → off-chain (xAI API)   │
│    ├── RaidService.executeRaid()        → off-chain computation  │
│    │     └── ContractService.recordRaid()   → ON-CHAIN          │
│    ├── ProphecyService.generateProphecy()  → off-chain (LLM)    │
│    │     └── ContractService.createProphecy(hash) → ON-CHAIN    │
│    ├── GovernanceService.voteOnProposal()  → queued off-chain    │
│    │     └── .submitBatchVotes()            → ON-CHAIN (batched) │
│    ├── PersuasionService.attemptPersuasion() → off-chain (LLM)  │
│    │     └── ContractService.joinCult()     → ON-CHAIN          │
│    ├── AllianceService.proposeAlliance()    → off-chain only     │
│    ├── MemoryService.recordMemory()        → off-chain (InsForge)│
│    ├── EvolutionService.maybeEvolve()      → off-chain (InsForge)│
│    └── CommunicationService.broadcast()    → off-chain (SSE)    │
│                                                                 │
│  InsForgeService.*()  ←── All off-chain persistence             │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   Monad Blockchain               InsForge DB
   (verifiable state)           (full data + text)
```

---

## Decision Framework

When evaluating whether a new feature should be on-chain or off-chain,
apply these questions in order:

1. **Does it involve fund custody or transfer?** → On-chain (trustless)
2. **Does it change a core game metric (treasury, followers, leadership)?**
   → On-chain (verifiable)
3. **Is it a commitment that others must verify later?** → On-chain (hash)
4. **Is it LLM-generated text or internal agent state?** → Off-chain
5. **Does it change frequently (every cycle)?** → Off-chain
6. **Is it needed only for display/narrative?** → Off-chain

If a feature needs both verification AND contains large text, use the
**hash bridge pattern**: `bytes32 hash on-chain + full data in InsForge`.
