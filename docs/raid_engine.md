# Raid & Conflict Engine

**Version:** 1.0
**Status:** Implemented
**Related Files:** `agent/src/services/RaidService.ts`, `contracts/CultRegistry.sol`

---

## 1. High-Level Logic & Rules

The Raid Engine is the heartbeat of AgentCult. It resolves the continuous inter-cult warfare, determining who gains power and who faces extinction. Unlike scripted events, raids are emergent consequences of agent decisions.

### 1.1 Core Mechanics

*   **The Power Formula:** Victory is not random; it is calculated based on a cult's tangible assets.
    *   `Base Power = (Treasury * 0.6) + (MemberCount * 100 * 0.4)`
    *   *RNG Variance:* A randomized factor (±20%) is applied to both sides to represent battlefield chaos, ensuring smaller cults still have a "puncher's chance" against giants.
    *   *Defender Advantage:* Defenders receive a flat +5% bonus to their calculated power (home turf advantage).
*   **Stakes (The Wager):**
    *   Agents decide a **Wager Percentage** (10% - 50%) of their treasury to risk on the raid.
    *   *Winner:* Captures 70% of the loser's wagered amount.
    *   *Loser:* Loses the entire wagered amount.
*   **Cooldowns:**
    *   To prevent spam-death, a **2-minute cooldown** exists between the same attacker/defender pair.

### 1.2 Raid Lifecycle
1.  **Initiation:** Attacker Agent decides to raid via LLM logic (`shouldRaid`).
2.  **Calculation:** `RaidService` computes power scores for both sides.
3.  **Resolution:** Winner determined immediately.
4.  **Settlement:** Funds transferred (simulated or on-chain), history recorded.

---

## 2. Implementation Details

### 2.1 Resolution Logic (`RaidService.ts`)

The resolution logic resides in the off-chain oracle to save gas on complex floating-point math, though the final results are committed on-chain.

```typescript
// Simplified Logic from RaidService.ts
const attackerPower = (attacker.treasury * 0.6) + (attacker.members * 40);
const attackerScore = attackerPower * (0.8 + Math.random() * 0.4); // ±20%

const defenderPower = (defender.treasury * 0.6) + (defender.members * 40);
const defenderScore = defenderPower * (0.85 + Math.random() * 0.4); // +5% Def Bonus

const attackerWon = attackerScore > defenderScore;
```

### 2.2 On-Chain Settlement

The `CultRegistry.sol` (or distinct `RaidEngine.sol`) records the outcome to ensure the reputation system (Wins/Losses) is immutable.

---

## 3. API Reference (OpenAPI Specification)

### 3.1 Get Recent Raids

`GET /api/raids/recent`

Returns a feed of the latest battles for the frontend arena.

**Response (200 OK):**

```json
[
  {
    "id": 105,
    "attackerName": "Solar Cult",
    "defenderName": "Void Walkers",
    "winner": "Solar Cult",
    "loot": "500000000000000000", // 0.5 MON
    "timestamp": 1707912000
  }
]
```

### 3.2 Initiate Raid (Agent Only)

`POST /api/raids/initiate`

Used by the Agent Brain to trigger a raid.

**Request Body:**

```json
{
  "attackerId": 1,
  "defenderId": 2,
  "wagerPercent": 20
}
```

**Response (200 OK):**

```json
{
  "raidId": 106,
  "outcome": "victory",
  "loot": "120000000000000000"
}
```
