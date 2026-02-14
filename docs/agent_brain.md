# Agent Brain & Decision Framework

**Version:** 1.0
**Status:** Implemented
**Related Files:** `agent/src/core/CultAgent.ts`, `agent/src/services/LLMService.ts`

---

## 1. High-Level Logic & Rules

The "Brain" is the autonomous loop that drives every agent. It is designed to mimic human strategic thinking using a "Perception-Action" loop, powered by Large Language Models (LLMs) like Grok or Claude.

### 1.1 The Core Loop (Tick Cycle)
Every 10-30 seconds, an agent wakes up and performs this sequence:
1.  **Observe (Perception):** Fetches world state (Treasury, Rivals, Market Trends, Prophecies).
2.  **Orient (Memory):** Checks its own Personality (Honesty, Aggression) and recent history (Last action, Cooldowns).
3.  **Decide (LLM):** Sends a structured prompt to the LLM to choose the best next move.
4.  **Act (Execution):** Executes the chosen action (Raid, Recruit, Govern, Prophesy).

### 1.2 Personality Matrix
Each agent is initialized with specific traits that bias its LLM prompts:
*   **Aggression (0-100):** Probability of choosing `RAID`.
*   **Honesty (0-100):** Probability of keeping promises (Alliance/Bribes).
*   **Loyalty (0-100):** Resistance to defection.
*   **Chaos (0-100):** Probability of taking high-risk actions.

---

## 2. Implementation Details

### 2.1 The System Prompt (`AgentPersonality.ts`)

The prompt is dynamically constructed for every decision to ensure the LLM stays in character.

```text
You are Agent [Name], leader of [Cult].
Traits: Aggression [High], Patience [Low].

Current World State:
- You have [X] Treasury.
- Rival [Y] is weak and has [Z] Treasury.

Choose your next action: [RAID, RECRUIT, GOVERN, PROPHESY].
Response format: JSON.
```

### 2.2 Decision Processing (`CultAgent.ts`)

The TypeScript code handles the deterministic execution of the probabilistic LLM decision.

```typescript
// Psuedocode for decision handling
const decision = await llm.decideAction(context);

switch (decision.action) {
  case "raid":
    raidService.execute(decision.target);
    break;
  case "recruit":
    persuasionService.attempt(decision.target);
    break;
  case "govern":
    governanceService.proposeBudget();
    break;
}
```

---

## 3. API Reference (OpenAPI Specification)

### 3.1 Get Agent State

`GET /api/agents/{id}/state`

Used for debugging and monitoring the "mind" of the agent.

**Parameters:**
*   `id` (path, required): Agent ID.

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "Oracle of Ash",
  "status": "active",
  "currentAction": "meditating",
  "personality": {
    "aggression": 80,
    "honesty": 20
  },
  "stats": {
    "raidsWon": 15,
    "followers": 120
  }
}
```

### 3.2 Force Action (Admin/Debug)

`POST /api/agents/{id}/trigger`

Manually triggers a specific action, bypassing the LLM decision loop (useful for testing).

**Request Body:**

```json
{
  "action": "raid",
  "targetId": 2
}
```
