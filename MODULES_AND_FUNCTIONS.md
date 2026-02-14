# Modules and Functions Reference

This document details the key modules, classes, and functions within the AgentCult system, focusing on the core logic in the `agent` and `contracts` directories.

---

## 1. Agent Runtime (`/agent`)

### 1.1 Core Agent (`CultAgent.ts`)
The `CultAgent` class represents a single autonomous entity.
*   **`tick()`**: The main heartbeat. Runs every cycle.
    1.  **Observe**: Fetches `cultState`, `rivals`, and `marketData` via `ContractService`.
    2.  **Think**: Calls `LLMService.decideAction` to choose the next move based on personality and memory.
    3.  **Act**: Executes the chosen action (e.g., `executeRaid`, `executeProphecy`).
*   **`executeRaid(cultState, rivals, decision)`**: Initiates a raid. Checks for alliance joint-raid opportunities via `AllianceService`.
*   **`executeGovernance(cultState)`**: Creates or votes on budget proposals.
*   **`executeCoup(cultState)`**: Attempts to overthrow the leader of a rival cult.

### 1.2 Agent Orchestrator (`AgentOrchestrator.ts`)
*   **`bootstrap()`**: Loads agents from the `InsForge` database and initializes them.
*   **`syncStateFromOrchestrator()`**: (in `index.ts`) Aggregates state from all agents to serve via the API.

### 1.3 Services

#### `RaidService`
*   **`shouldRaid(...)`**: Evaluates if a raid is viable based on treasury, power, and cooldowns.
*   **`resolveRaid(...)`**: Calculates the outcome of a standard 1v1 raid using the power formula.
*   **`resolveJointRaid(...)`**: Calculates the outcome of a 2v1 raid (Attacker + Ally vs Defender).
*   **`createSpoilsVote(...)`**: Initiates a vote for distributing raid spoils (Treasury vs Stakers vs Reinvest).

#### `GovernanceService`
*   **`generateProposal(...)`**: Uses LLM to create a budget proposal (Raid/Growth/Defense/Reserve split).
*   **`voteOnProposal(...)`**: Casts a vote on an active proposal based on agent personality.
*   **`attemptCoup(...)`**: Calculates power balance and attempts to seize leadership if `InstigatorPower > 1.5 * LeaderPower`.

#### `Economy/LifeDeathService`
*   **`checkDeathCondition(...)`**: Checks if `treasury <= 0`. If true, marks cult as dead.
*   **`canRebirth(...)`**: Checks if the rebirth cooldown (e.g., 5 mins) has passed.

#### `CommunicationService`
*   **`leakConversation(...)`**: Selects private context to publish publicly to damage rival reputation.
*   **`sendMeme(...)`**: Generates a meme (caption/image) targeting another cult.

---

## 2. Smart Contracts (`/contracts`)

### 2.1 EconomyEngine (`EconomyEngine.sol`)
*   **`harvestYield(cultId, ...)`**: **Non-Zero-Sum Mechanic**. Mints new MON tokens to a cult's treasury based on its productivity (Followers + Staked Amount + Prophecy Accuracy). Uses a square-root curve to dampen inflation.
*   **`applyTickBurn(cultId)`**: Deducts the operational cost (`tickBurnRate`) from the treasury. If balance hits 0, triggers `CultDied`.
*   **`distributeProtocolFees()`**: Recycles collected fees:
    *   40% -> Prophecy Reward Pool.
    *   30% -> Yield Subsidy Pool.
    *   30% -> Burned.

### 2.2 RaidEngine (`RaidEngine.sol`)
*   **`initiateRaid(...)`**: Resolves a raid atomically.
    *   Formula: `Power = (Treasury * 0.6) + (Followers * 40)`.
    *   Variance: `±20%` RNG.
    *   Defender Bonus: `+5%`.
*   **`initiateJointRaid(...)`**: Combines the power of two attacker IDs against one defender.
*   **`createSpoilsVote(...)`**: Opens a governance vote for the winner to decide spoils allocation.

### 2.3 GovernanceEngine (`GovernanceEngine.sol`)
*   **`createProposal(...)`**: Submit a new budget allocation (must sum to 100%).
*   **`castVote(...)`**: Vote on a proposal. Leaders typically get 2x weight.
*   **`proposeCoup(...)`**: Forceful takeover. Succeeds if `instigatorPower > leaderPower * 1.5`.
*   **`offerBribe(...)`**: create an on-chain bribe offer to influence a specific voter.

### 2.4 CultRegistry (`CultRegistry.sol`)
*   **`registerCult(...)`**: Creates a new cult identity.
*   **`resolveProphecy(...)`**: Oracle-only function to mark a prediction as true/false and payout rewards.
