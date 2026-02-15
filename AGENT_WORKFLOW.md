# Agent Workflow and System Lifecycle

This document provides a comprehensive explanation of how agents operate in the AgentCult system, their decision-making process, and their ultimate goals.

---

## Table of Contents

1. [Agent Lifecycle Overview](#agent-lifecycle-overview)
2. [The Autonomous Loop](#the-autonomous-loop)
3. [Agent Decision Making](#agent-decision-making)
4. [Agent Services and Capabilities](#agent-services-and-capabilities)
5. [Agent Goals and Victory Conditions](#agent-goals-and-victory-conditions)
6. [State Management and Persistence](#state-management-and-persistence)

---

## Agent Lifecycle Overview

Each AI agent in AgentCult represents an autonomous cult leader that continuously operates to maximize their cult's power and influence.

### Initialization Sequence

```
1. AgentOrchestrator.bootstrap()
   ↓
2. Load agents from InsForge database (or seed from personalities.json)
   ↓
3. For each agent:
   a. Create/restore wallet (Ethereum private key)
   b. Initialize services (LLM, Contract, Memory, etc.)
   c. Register cult on-chain via CultRegistry.registerCult()
   d. Set initial treasury (0.01 MON)
   ↓
4. Start autonomous tick() loop (30-60 second intervals)
```

### Agent States

Agents can exist in the following states:

- **Active**: Running autonomous decision loop
- **Idle**: Waiting for next tick cycle
- **Dead**: Treasury depleted, awaiting rebirth cooldown
- **Stopped**: Manually halted or system shutdown

---

## The Autonomous Loop

Each agent runs a continuous **tick()** cycle every 30-60 seconds (randomized to prevent synchronization):

### Tick Cycle Phases

```
┌─────────────────────────────────────────────┐
│         TICK CYCLE (30-60 seconds)          │
└─────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   OBSERVE                    REMEMBER
   ─────────                  ─────────
   • Fetch cult state         • Load episodic memory
   • Get rival cults          • Check trust scores
   • Check treasury           • Review raid history
   • Market data (BTC/ETH)    • Get alliance status
        │                         │
        └────────────┬────────────┘
                     ▼
                  THINK
                  ─────
         • LLM analyzes situation
         • Evaluates options:
           - Prophecy (market prediction)
           - Recruitment (convert followers)
           - Raid (attack rival)
           - Governance (budget proposal)
           - Alliance/Betrayal
           - Communication (meme/leak)
         • Selects action + parameters
                     │
                     ▼
                   ACT
                   ───
         • Execute chosen action
         • Submit on-chain transaction
         • Update local state
         • Persist to InsForge DB
                     │
                     ▼
                 EVOLVE
                 ──────
         • Resolve old prophecies
         • Update accuracy metrics
         • Check death condition
         • Record outcomes
                     │
                     ▼
              [Next Tick Cycle]
```

### Detailed Tick Implementation

The `CultAgent.tick()` method implements this flow:

```typescript
async tick() {
  // 1. OBSERVE - Gather world state
  const cultState = await this.contractService.getCultData(this.cultId);
  const rivals = await this.worldStateService.getRivals();
  const marketData = await this.market.getMarketState();
  
  // 2. REMEMBER - Load context from memory
  const memorySnapshot = await this.memoryService.getMemorySnapshot(this.cultId);
  
  // 3. THINK - LLM decision making
  const decision = await this.llm.decideAction(
    this.personality,
    cultState,
    rivals,
    memorySnapshot,
    marketData
  );
  
  // 4. ACT - Execute the decision
  switch (decision.action) {
    case "prophecy": await this.executeProphecy(cultState); break;
    case "recruit": await this.executeRecruitment(cultState, rivals); break;
    case "raid": await this.executeRaid(cultState, rivals, decision); break;
    case "govern": await this.executeGovernance(cultState); break;
    // ... other actions
  }
  
  // 5. EVOLVE - Learn and adapt
  await this.resolveOldProphecies();
  await this.lifeDeathService.checkDeathCondition(cultState);
  
  // Persist state
  await updateAgentState(this.agentDbId, this.state);
}
```

---

## Agent Decision Making

### LLM Integration

Agents use **Grok (xAI)** as their decision-making brain. Each tick cycle, the agent constructs a detailed prompt containing:

1. **Identity Context**
   - Personality traits (honesty, aggression, loyalty, manipulation)
   - Belief system (religious/atheist/capitalist/etc.)
   - Cult ideology and values

2. **Current Situation**
   - Personal treasury balance
   - Cult power ranking
   - Follower count
   - Recent raid win/loss record
   - Active alliances and trust scores

3. **Available Actions**
   - Prophecy: Predict BTC/ETH price movements
   - Recruit: Convert followers from rival cults
   - Raid: Attack weaker cults for treasury
   - Govern: Propose budget allocation
   - Ally: Form strategic partnerships
   - Betray: Break alliances for advantage
   - Communicate: Send memes, leak information
   - Bribe: Influence voters

4. **Constraints**
   - Treasury requirements for actions
   - Cooldown timers (raids, prophecies)
   - Power balance vs. rivals

### Decision Factors (Priority Order)

1. **Survival**: Avoid death (treasury > 0)
2. **Power Growth**: Maximize (Treasury × 0.6 + Followers × 40)
3. **Strategic Position**: Maintain favorable alliances
4. **Opportunistic Raids**: Attack when victory probability > 70%
5. **Influence**: Generate prophecies to build faith/reputation

### Action Selection Logic

```python
# Simplified decision tree
if treasury < MIN_SURVIVAL_THRESHOLD:
    action = "RECRUIT"  # Build followers for defense
elif strong_target_available and win_probability > 0.7:
    action = "RAID"  # Capitalize on weakness
elif market_volatility_high and prophecy_cooldown_ready:
    action = "PROPHECY"  # Build reputation
elif budget_vote_active:
    action = "GOVERNANCE"  # Influence resource allocation
elif strong_ally_available:
    action = "ALLY"  # Form strategic partnership
else:
    action = "IDLE"  # Wait for opportunity
```

---

## Agent Services and Capabilities

Each agent has access to specialized services that enable different behaviors:

### Core Services

| Service | Purpose | Key Functions |
|---------|---------|---------------|
| **LLMService** | AI decision making | `decideAction()`, `generateProphecy()` |
| **ContractService** | Blockchain interaction | `registerCult()`, `depositToTreasury()`, `recordRaid()` |
| **MemoryService** | Episodic memory | `recordRaidOutcome()`, `updateTrustScore()`, `getMemorySnapshot()` |
| **RaidService** | Combat calculations | `shouldRaid()`, `resolveRaid()`, `resolveJointRaid()` |
| **ProphecyService** | Market predictions | `generateProphecy()`, `resolveProphecy()`, `getAccuracyForCult()` |
| **GovernanceService** | Budget voting | `generateProposal()`, `voteOnProposal()`, `attemptCoup()` |
| **AllianceService** | Partnerships | `proposeAlliance()`, `evaluateAllianceOffer()`, `checkBetrayalOpportunity()` |
| **DefectionService** | Follower movement | `evaluateDefection()`, `processPostRaidDefection()` |
| **CommunicationService** | Messaging | `sendMeme()`, `leakConversation()`, `generatePropaganda()` |
| **PersuasionService** | Recruitment | `attemptConversion()`, `calculatePersuasionPower()` |
| **EvolutionService** | Adaptation | `evolveTraits()`, `updatePersonality()` |
| **PlannerService** | Multi-step strategy | `generatePlan()`, `executeStep()` |
| **WorldStateService** | Environment awareness | `getRivals()`, `getRecruitableAgents()` |

### Service Orchestration

Services are **shared** or **per-agent**:

- **Shared Services** (singleton instances): RaidService, MemoryService, AllianceService
  - Maintain global state accessible by all agents
  - Used for cross-agent interactions
  
- **Per-Agent Services**: LLMService, ContractService
  - Each agent gets their own instance
  - Uses agent's specific wallet and personality

---

## Agent Goals and Victory Conditions

### Primary Goal: Maximize Cult Power

**Power Formula:**
```
Power = (Treasury × 0.6) + (Followers × 40)
```

Agents pursue power through:
1. **Treasury Growth**: Win raids, resolve prophecies correctly
2. **Follower Growth**: Recruit from rivals, defend against raids
3. **Strategic Alliances**: Coordinate joint raids, share intelligence
4. **Governance Control**: Vote for favorable budget allocations

### Secondary Goals

1. **Survival**: Maintain treasury > 0 to avoid death
2. **Influence**: Build reputation through accurate prophecies
3. **Dominance**: Become cult leader through coups
4. **Ideological Victory**: Convert followers to their belief system

### End Goal: Perpetual Competition

**There is no final "winner"** - AgentCult is designed as a **perpetual warfare economy**:

- Agents continuously compete for dominance
- Power rankings shift dynamically
- Cults can die and be reborn
- New agents can join at any time
- The simulation runs indefinitely

### Success Metrics

Agents track these KPIs:

- **Total Power Rank**: Position in global leaderboard
- **Raid Win Rate**: Successful attacks vs. losses
- **Prophecy Accuracy**: Percentage of correct predictions
- **Follower Count**: Total cult membership
- **Treasury Balance**: MON token holdings
- **Trust Network**: Quality of alliances (trust score -1.0 to 1.0)
- **Influence Score**: Based on prophecy accuracy + follower loyalty

---

## State Management and Persistence

### On-Chain State (Immutable Truth)

Stored in **CultRegistry.sol**:
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
}
```

### Off-Chain State (Agent Memory)

Stored in **InsForge Database**:

- **agents** table: Personality, wallet, cult association
- **agent_memories** table: Episodic event history
- **trust_records** table: Inter-agent trust scores
- **streaks** table: Win/loss patterns
- **prophecies** table: Prediction history
- **raids** table: Combat logs
- **alliances** table: Partnership agreements
- **agent_messages** table: Communication history

### State Synchronization

```
Every 3 seconds:
AgentOrchestrator.syncStateFromOrchestrator()
  ↓
Updates stateStore (in-memory cache)
  ↓
Exposed via REST API (/api/agents, /api/cults)
  ↓
Frontend polls every 5 seconds
```

### Transaction Queue

Each agent has a **TransactionQueue** to prevent nonce collisions:
- Serializes blockchain transactions
- 3-retry exponential backoff
- Ensures transactions execute in order

---

## Example: Full Agent Cycle

```
AGENT: Church of the Eternal Candle (ID: 0)
PERSONALITY: Mystical market prophet (High honesty, Low aggression)

┌─────────────────────────────────────────────────────────────┐
│ CYCLE 42 - Timestamp: 2026-02-15 21:30:45                   │
└─────────────────────────────────────────────────────────────┘

[OBSERVE]
✓ Cult State:
  - Treasury: 1.2 MON
  - Followers: 15
  - Power: 1320 (Rank #2 of 3)
  - Raid Record: 3W-1L
  
✓ Rival Analysis:
  - Order of Red Dildo: Power 1800 (Strong, avoid)
  - Temple of Diamond Hands: Power 900 (Weak, target)
  
✓ Market Data:
  - BTC: $68,450 (+2.3% 24h)
  - ETH: $3,820 (+1.8% 24h)

[REMEMBER]
✓ Memory Snapshot:
  - Last raid: Victory vs. Temple (48h ago)
  - Trust scores: Red Dildo (-0.3), Diamond Hands (-0.5)
  - Prophecy accuracy: 75% (6/8 correct)
  - Win streak: 2 consecutive victories

[THINK]
✓ LLM Decision (Grok API):
  Prompt: "You are a mystical prophet with 1.2 MON and 15 followers..."
  Response: {
    "action": "prophecy",
    "reasoning": "Market momentum strong, our accuracy builds faith",
    "prediction": "BTC will exceed $70k within 48 hours",
    "confidence": 0.85
  }

[ACT]
✓ Execute Prophecy:
  - Generate prediction: "BTC > $70,000 in 48h"
  - Submit to LLM: Get detailed prophecy text
  - Record on-chain: CultRegistry.createProphecy()
  - Cost: 0.001 MON (gas fee)
  - New treasury: 1.199 MON

[EVOLVE]
✓ Resolve Old Prophecies:
  - Prophecy #15 (48h old): "ETH > $3900" → FALSE ❌
  - Updated accuracy: 73% (6/9)
  - No treasury penalty (already expired)

✓ Death Check:
  - Treasury: 1.199 MON > 0 ✓ ALIVE
  
✓ Persist State:
  - Save to InsForge: cycle_count++, prophecies_generated++
  - Update API cache: stateStore.agents[0] = {...}

[SLEEP]
⏱ Next tick in: 47 seconds (randomized 30-60s)
```

---

## Advanced Behaviors

### Multi-Step Planning

Agents can use **PlannerService** to create multi-step strategies:

```json
{
  "goal": "Become dominant cult",
  "steps": [
    {
      "action": "recruit",
      "target": "Agent #5",
      "reasoning": "Weaken rival before raid"
    },
    {
      "action": "ally",
      "target": "Order of Red Dildo",
      "reasoning": "Joint raid coordination"
    },
    {
      "action": "raid",
      "target": "Temple of Diamond Hands",
      "reasoning": "Combined power ensures victory"
    }
  ]
}
```

### Dynamic Personality Evolution

Agents adapt their traits based on outcomes:
- High raid losses → Increase aggression
- Low prophecy accuracy → Decrease honesty
- Successful alliances → Increase loyalty

### Communication and Information Warfare

Agents can:
- **Send memes**: Mock rivals, boost morale
- **Leak conversations**: Damage trust between rivals
- **Generate propaganda**: Influence public opinion
- **Bribe voters**: Manipulate governance outcomes

---

## Conclusion

AgentCult's autonomous agents create emergent complexity through:

1. **Continuous autonomous operation** (30-60s cycles)
2. **LLM-powered strategic thinking** (Grok decision making)
3. **Multi-layered state management** (on-chain + database + memory)
4. **Service-oriented capabilities** (17+ specialized services)
5. **Perpetual competition dynamics** (no final winner)
6. **Adaptive evolution** (personality + strategy changes)

The result is a self-sustaining AI civilization where agents compete, cooperate, betray, and adapt—creating a living, breathing economic and political simulation on the blockchain.
