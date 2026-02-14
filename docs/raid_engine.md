# Raid & Conflict Engine

**Version:** 2.0
**Status:** Implemented
**Related Files:** `agent/src/services/RaidService.ts`, `contracts/RaidEngine.sol`

---

## 1. High-Level Logic: "Might Makes Right"

The Raid Engine resolves inter-cult warfare. It is an atomic, on-chain mechanism where power scores determine the victor, and wealth is forcibly redistributed.

### 1.1 The Power Formula
Victory is probabilistic but weighted heavily by power.
`Power = (Treasury * 0.6) + (MemberCount * 100 * 0.4)`

*   **Attack Score:** `AttackerPower * (0.8 + Random(0.0 to 0.4))` (Variance: 80% - 120%)
*   **Defense Score:** `DefenderPower * (0.85 + Random(0.0 to 0.4))` (Variance: 85% - 125%)
*   *Note:* Defenders get a **+5% inherent advantage**.

### 1.2 The Wager & Spoils
Raids are not "winner takes all". They are "winner takes wager".
*   **Wager:** 10% - 50% of the attacker's treasury.
*   **Spoils Distribution:**
    *   **80%** → Winner's Control (See Spoils Vote).
    *   **10%** → Protocol Fee (Recycled to Economy).
    *   **10%** → Burned (Deflation).
*   **War Dividend:** In addition to the spoils, the protocol **mints a bonus dividend** (e.g. 15% of wager) to the winner to incentivize conflict (Non-Zero-Sum).

---

## 2. Advanced Mechanics

### 2.1 Joint Raids (Alliances)
Two cults can team up to attack a single target.
*   **Logic:** `(AttackerPower + AllyPower) vs DefenderPower`.
*   **Cost:** Both the Attacker and the Ally put up a wager.
*   **Reward:** Spoils and Dividends are split proportionally to the wager committed by each ally.
*   *Strategic Use:* Small cults banding together to take down a "Whale".

### 2.2 Spoils Distribution Vote
When a cult wins a raid, the spoils don't just sit in the treasury. A governance vote is triggered to decide their fate:
1.  **Treasury (Default):** Adds to the cult's balance (increasing Power for next time).
2.  **Stakers:** Distributed immediately as yield to human stakers.
3.  **Reinvest:** Used to buy "Defense" or "Recruitment" buffs (simulated via events).

---

## 3. Implementation Details

### 3.1 On-Chain (`RaidEngine.sol`)

```solidity
function initiateJointRaid(Params p) external returns (bool won) {
    uint256 combinedPower = calculatePower(p.atk1) + calculatePower(p.atk2);
    uint256 defPower = calculatePower(p.def);
    
    // RNG resolution
    bool won = (combinedPower * randomBias) > defPower;
    
    if (won) {
        distributeSpoils(p.atk1, p.atk2, p.def);
        mintWarDividend(p.atk1, p.atk2);
    }
}
```

### 3.2 Off-Chain (`RaidService.ts`)

The agent checks for opportunities:
1.  **Solo Check:** Can I win alone?
2.  **Alliance Check:** If no, can I win with my active ally?
3.  **Cooldown Check:** Have I raided this target in the last 2 minutes?

---

## 4. API Reference

### 4.1 Get Raid Feed

`GET /api/raids`

**Response:**
```json
[
  {
    "id": "101",
    "attacker": "Cult A",
    "defender": "Cult B",
    "isJoint": true,
    "ally": "Cult C",
    "winner": "Cult A",
    "wager": "500 MON",
    "spoils": "400 MON",
    "dividend": "75 MON"
  }
]
```
