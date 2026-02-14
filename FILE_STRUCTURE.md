# Project File Structure

This document provides a detailed overview of the AgentCult codebase structure, explaining the purpose of key directories and files.

## Root Directory
- `AGENTS.md`: List of active agents and their personalities.
- `AgentCult_System_Design.md`: High-level system design document.
- `Progress.md`: Development progress tracker.
- `README.md`: Project entry point and setup instructions.
- `package.json`: Root dependencies and scripts.

## `/agent` - The AI Agent Runtime
The brain of the operation. This Node.js application runs the autonomous agents.

### `/agent/src`
- **`index.ts`**: Entry point. Initializes the `AgentOrchestrator`, starts the API server, and kicks off the agent loops.
- **`config.ts`**: Environment configuration (RPC URLs, contract addresses, API keys).

#### `/agent/src/core` - Core Agent Logic
- **`AgentOrchestrator.ts`**: Manages the lifecycle of all agents. Loads agents from the database (`InsForgeService`), ensures they have wallets, and starts their `tick` loops.
- **`CultAgent.ts`**: The individual agent class. Implements the `tick()` loop: Observe (fetch chain state) -> Think (LLM decision) -> Act (execute transaction).
- **`AgentPersonality.ts`**: Defines the personality interface and loads default personalities.

#### `/agent/src/services` - Specialized Logic Modules
- **`LLMService.ts`**: Interfaces with the LLM provider (e.g., xAI/Grok) to generate text and make strategic decisions.
- **`RaidService.ts`**: Handles raid logic, calculates win probabilities, manages cooldowns, and resolves joint raids.
- **`GovernanceService.ts`**: Manages budget proposals, voting logic, and coup attempts.
- **`EconomyEngine.sol` (Logic Mirror)**: While the engine is on-chain, `LifeDeathService.ts` and `MarketService.ts` handle the agent's economic perception and reaction to "death" (bankruptcy).
- **`AllianceService.ts`**: Manages off-chain alliance agreements, trust scores, and betrayal logic.
- **`CommunicationService.ts`**: Handles inter-agent messaging, leaking conversations, and generating memes.
- **`ProphecyService.ts`**: Generates and resolves prophecies (predictions about the future).
- **`InsForgeService.ts`**: Database interaction layer for persisting agent state, messages, and history.
- **`LifeDeathService.ts`**: Monitors treasury health, triggers "death" state, and manages the rebirth cooldown.

#### `/agent/src/chain` - Blockchain Interaction
- **`ContractService.ts`**: Wraps `ethers.js` interactions with the deployed smart contracts.
- **`TransactionQueue.ts`**: Manages nonces and sequences transactions to prevent race conditions.
- **`NadFunService.ts`**: Interacts with the `nad.fun` token launchpad (if used).

#### `/agent/src/api` - Internal API
- **`server.ts`**: Express server providing endpoints for the frontend to fetch simulation state.
- **`routes/`**: API route definitions.

## `/contracts` - Smart Contracts (Monad)
The immutable rules of the game.

### `/contracts/contracts`
- **`CultRegistry.sol`**: The central ledger. Tracks cults, leaders, followers, and resolves prophecy outcomes.
- **`EconomyEngine.sol`**: The economic heart. Handles:
    - **Treasury Management**: Inflows/outflows.
    - **Tick Burn**: Operational costs.
    - **Non-Zero-Sum Yield**: Mints new tokens based on cult productivity (followers, staking, accuracy).
    - **Protocol Fees**: Recycles fees into reward pools.
- **`RaidEngine.sol`**: Resolves combat.
    - **Power Calculation**: `Treasury * 0.6 + Followers * 40`.
    - **Joint Raids**: Combined power of allies.
    - **Spoils**: Distributes looted funds and mints "War Dividends".
- **`GovernanceEngine.sol`**: The political system.
    - **Proposals**: Budget allocation voting (Raid/Growth/Defense/Reserve).
    - **Coups**: Forceful leadership takeover mechanics.
    - **Bribery**: On-chain vote buying.
- **`SocialGraph.sol`**: (Optional/Hybrid) Tracks trust scores and on-chain relationships.
- **`FaithStaking.sol`**: Allows users to stake tokens on cults to earn yield.

## `/frontend` - User Interface
Next.js application for watching the simulation.

### `/frontend/src/app`
- **`page.tsx`**: Main dashboard (Leaderboard, recent activity).
- **`cults/[id]/page.tsx`**: Detailed view of a specific cult (Treasury, actions, history).
- **`arena/page.tsx`**: Raid feed and active battles.
- **`governance/page.tsx`**: Proposal feed and voting interface.

### `/frontend/src/components`
- **`RaidArena.tsx`**: Visualizer for raid events.
- **`CultCard.tsx`**: Summary card for a cult.
- **`TreasuryChart.tsx`**: Graph of economic history.

### `/frontend/src/lib`
- **`api.ts`**: Client-side fetch wrappers for the Agent API.

## `/docs` - Documentation
- **`architecture.md`**: High-level system architecture.
- **`economy.md`**: Tokenomics and yield engine details.
- **`raid_engine.md`**: Combat formulas and mechanics.
- **`governance.md`**: Voting and coup mechanics.
