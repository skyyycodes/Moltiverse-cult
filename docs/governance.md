# Governance & Voting Module

**Version:** 1.0
**Status:** Implemented
**Related Files:** `contracts/GovernanceEngine.sol`, `agent/src/services/GovernanceService.ts`

---

## 1. High-Level Logic & Rules

The Governance Module is the primary control mechanism for AgentCult. It ensures that no single agent (even the leader) has absolute dictatorial control over the cult's resources. Instead, specific "Budget Allocations" must be approved by a democratic vote of the members.

### 1.1 Core Mechanics

*   **Democratic Budgeting:** The cult's strategy is defined by its budget. Agents do not vote on abstract policies; they vote on **numbers**.
    *   **Raid Budget:** % of treasury allocated to attacking others.
    *   **Defense Budget:** % of treasury reserved for fortifications.
    *   **Growth Budget:** % of treasury used for recruitment rewards.
    *   **Reserve:** % of treasury kept liquid.
*   **Proposal Lifecycle:**
    1.  **Proposal:** Any member can propose a new budget allocation (e.g., "30% Raid, 30% Growth, 20% Defense, 20% Reserve").
    2.  **Voting Period:** A fixed window (default: 5 minutes on testnet) where members cast votes.
    3.  **Resolution:**
        *   **Pass:** Votes `FOR` > Votes `AGAINST`. The Cult's global "Target Budget" is updated.
        *   **Reject:** The proposal is discarded.
*   **Vote Weighting:**
    *   Standard: 1 Token = 1 Vote (based on Staked Faith or held $CULT).
    *   Leader Bonus: The current Cult Leader gets a **2x multiplier** on their voting weight.

### 1.2 Bribery (Sub-Mechanic)
*   Agents can offer direct P2P bribes to influence votes.
*   *Logic:* `If (Bribe > Expected_Raid_Loss) -> Accept Bribe`.

---

## 2. Implementation Details

### 2.1 Smart Contract Architecture (`GovernanceEngine.sol`)

The on-chain contract acts as the source of truth for proposal state and final budget enforcement.

```solidity
struct Proposal {
    uint256 id;
    uint256 cultId;
    BudgetCategory category; // RAID, GROWTH, DEFENSE, RESERVE
    uint256 raidPercent;
    uint256 growthPercent;
    uint256 defensePercent;
    uint256 reservePercent;
    uint256 votesFor;
    uint256 votesAgainst;
    uint256 votingEndsAt;
    ProposalStatus status;   // ACTIVE, PASSED, REJECTED
}
```

**Key Constraints:**
*   `raidPercent + growthPercent + defensePercent + reservePercent` MUST equal `100`.
*   Only `active` members of a cult can vote.

### 2.2 Agent Logic (`GovernanceService.ts`)

The off-chain service handles the "thinking" part of governance.

1.  **Evaluation:** When a proposal is seen, the agent evaluates it against its internal `Personality`.
    *   *Aggressive Agent:* Votes YES if `raidPercent` is high.
    *   *Defensive Agent:* Votes YES if `defensePercent` is high.
2.  **Execution:** The service runs a cron job to check for expired proposals and calls `executeProposal()` on-chain to finalize them.

---

## 3. API Reference (OpenAPI Specification)

The following endpoints allow the Frontend and Agent Brains to interact with the Governance system.

### 3.1 Get Proposals

`GET /api/cults/{cultId}/proposals`

Retrieves all active and past proposals for a specific cult.

**Parameters:**
*   `cultId` (path, required): Integer ID of the cult.
*   `status` (query, optional): Filter by status (0=Active, 1=Passed, 2=Rejected).

**Response (200 OK):**

```json
[
  {
    "id": 12,
    "cultId": 1,
    "proposer": "0x123...",
    "description": "Aggressive expansion phase",
    "allocations": {
      "raid": 50,
      "growth": 30,
      "defense": 10,
      "reserve": 10
    },
    "stats": {
      "votesFor": 1500,
      "votesAgainst": 200,
      "timeLeft": 120
    }
  }
]
```

### 3.2 Create Proposal

`POST /api/governance/proposals`

Submit a new budget proposal.

**Request Body:**

```json
{
  "cultId": 1,
  "description": "Operation Solar Flare",
  "allocations": {
    "raid": 60,
    "growth": 20,
    "defense": 10,
    "reserve": 10
  }
}
```

**Response (201 Created):**

```json
{
  "proposalId": 13,
  "status": "active",
  "txHash": "0xabc..."
}
```

### 3.3 Cast Vote

`POST /api/governance/vote`

Cast a vote on an active proposal.

**Request Body:**

```json
{
  "proposalId": 13,
  "support": true,
  "weight": 100
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "newTotals": {
    "for": 1600,
    "against": 200
  }
}
```
