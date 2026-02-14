# Economy & Treasury Module

**Version:** 1.0
**Status:** Implemented
**Related Files:** `contracts/FaithStaking.sol`, `agent/src/services/LifeDeathService.ts`

---

## 1. High-Level Logic & Rules

The Economy Module manages the flow of `$CULT` tokens (and the testnet gas token `MON`). It enforces the "Economic Reality" of the simulation: money is life, and bankruptcy is death.

### 1.1 The Token Flow

1.  **Inflow:**
    *   **User Funding:** Users deposit funds to bootstrap a cult.
    *   **Staking Rewards:** Users stake tokens on a cult; the cult earns a % of the yield.
    *   **Raid Spoils:** Capturing treasury from rivals.
2.  **Outflow:**
    *   **Raid Wagers:** Risked funds lost in battle.
    *   **Operational Costs:** (Planned) Small burn per tick to simulate "upkeep".
    *   **Protocol Fees:** 1% tax on all transfers goes to the Dev/Burn pot.

### 1.2 Life & Death (The Treasury Death Spiral)
*   **The Rule:** If `Treasury Balance <= 0`, the Cult is marked as **DEAD**.
*   **Consequences:**
    *   Agent stops acting (Tick loop terminates).
    *   Followers are released (reset to 0).
    *   **Rebirth:** After a cooldown (5 minutes), the agent can be "resurrected" if new funding is provided.

### 1.3 Faith Staking
Users can stake their own tokens on specific cults they believe will win. This aligns user incentives with agent success.
*   *Mechanic:* Users stake -> Cult Power increases (slightly) -> Users earn yield from Cult's Raid Wins.

---

## 2. Implementation Details

### 2.1 Death Check Logic (`LifeDeathService.ts`)

This service runs every tick to enforce economic mortality.

```typescript
checkDeathCondition(cultState: CultData): DeathEvent | null {
    if (cultState.treasuryBalance <= 0n) {
        return {
            cause: "treasury_depleted",
            timestamp: Date.now()
        };
    }
    return null;
}
```

### 2.2 Staking Contract (`FaithStaking.sol`)

A standard staking contract modified to interact with the CultRegistry.

*   `stake(uint256 cultId)`: Locks user funds, emits event for Agent Brain to see "Faith" increase.
*   `claimRewards()`: Distributes accumulated yield.

---

## 3. API Reference (OpenAPI Specification)

### 3.1 Get Treasury Stats

`GET /api/cults/{id}/treasury`

**Response (200 OK):**

```json
{
  "cultId": 1,
  "balance": "1000000000000000000", // 1.0 MON
  "isAlive": true,
  "burnRate": "0.01", // Estimated loss per hour
  "runway": "48h"    // Estimated time until death
}
```

### 3.2 Stake Faith

`POST /api/economy/stake`

**Request Body:**

```json
{
  "cultId": 1,
  "amount": "0.1"
}
```
