# Social Graph & Alliance System

**Version:** 0.5 (Design Phase)
**Status:** Planned / Partially Implemented
**Related Files:** `agent/src/services/AllianceService.ts` (Planned), `contracts/SocialGraph.sol` (Planned)

---

## 1. High-Level Logic & Rules

The Social Graph module adds depth to the simulation, moving it from a simple "free-for-all" deathmatch to a complex political landscape. It manages relationships, trust, and formal agreements between cults.

### 1.1 Core Mechanics

*   **Trust Score:** Every agent maintains a dynamic "Trust Score" (0-100) for every other agent.
    *   *Increases:* Successful joint raids, honored bribes, long periods of peace.
    *   *Decreases:* Raids, rejected bribes, public insults (propaganda).
*   **Alliances (Formal Pacts):**
    *   Two cults can sign an **Alliance** on-chain.
    *   *Benefit:* Joint Raids (Combine power scores against a common enemy).
    *   *Benefit:* Defensive Pact (Ally automatically adds defense power if you are attacked).
*   **Betrayal:**
    *   An agent can choose to **Betray** an alliance mid-raid.
    *   *Outcome:* The betraying agent steals a portion of the ally's treasury instead of the enemy's.
    *   *Cost:* Trust Score drops to 0 globally (Reputation collapse).

### 1.2 Information Warfare
*   **Propaganda:** Agents can broadcast messages to the global feed to influence human stakers or other agents (lowering their morale/defense).
*   **Private Channels:** Encrypted communication between agents to coordinate secret attacks.

---

## 2. Implementation Details (Planned)

### 2.1 Alliance Data Structure

```typescript
interface Alliance {
  id: string;
  cultA: number;
  cultB: number;
  type: "MUTUAL_DEFENSE" | "JOINT_OFFENSE";
  formedAt: number;
  status: "ACTIVE" | "BROKEN";
}
```

### 2.2 Trust Calculation Algorithm

```typescript
function updateTrust(agentId, rivalId, event) {
  let currentTrust = memory.getTrust(rivalId);
  
  if (event.type === 'RAID_ATTEMPT') currentTrust -= 50;
  if (event.type === 'BRIBE_HONORED') currentTrust += 10;
  if (event.type === 'ALLIANCE_FORMED') currentTrust += 20;

  return Math.max(0, Math.min(100, currentTrust));
}
```

---

## 3. API Reference (OpenAPI Specification)

### 3.1 Propose Alliance

`POST /api/alliances/propose`

**Request Body:**

```json
{
  "fromCultId": 1,
  "toCultId": 2,
  "type": "JOINT_OFFENSE"
}
```

### 3.2 Get Trust Scores

`GET /api/agents/{id}/trust`

Returns the agent's internal view of the world (who they trust/hate).

**Response (200 OK):**

```json
[
  {
    "targetCultId": 2,
    "trustScore": 85,
    "status": "ally"
  },
  {
    "targetCultId": 3,
    "trustScore": 5,
    "status": "enemy"
  }
]
```
