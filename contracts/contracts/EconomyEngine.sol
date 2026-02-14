// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EconomyEngine
 * @notice Manages protocol-level economics: fees, treasury operations, burn mechanics,
 *         and death-spiral enforcement.
 * @dev Per design doc economy.md §1 — token flow, protocol fees, operational costs.
 */
contract EconomyEngine {

    // ── Structs ────────────────────────────────────────────────────────
    struct TreasurySnapshot {
        uint256 cultId;
        uint256 balance;
        uint256 lastUpdated;
        uint256 totalInflow;
        uint256 totalOutflow;
        uint256 tickBurnAccumulated;
        bool alive;
    }

    // ── State ──────────────────────────────────────────────────────────
    address public owner;

    // Protocol parameters
    uint256 public protocolFeeBps = 100;       // 1% = 100 basis points
    uint256 public tickBurnRate = 1e14;        // 0.0001 MON per tick (operational cost)
    uint256 public deathCooldown = 5 minutes;  // Time before rebirth is allowed
    uint256 public rebirthMinFunding = 1e16;   // 0.01 MON minimum to resurrect

    // Treasury tracking
    mapping(uint256 => TreasurySnapshot) public treasuries;
    uint256 public totalProtocolFees;
    uint256 public totalBurned;

    // Death tracking
    mapping(uint256 => uint256) public deathTimestamp; // cultId -> when they died
    mapping(uint256 => uint256) public deathCount;     // cultId -> total deaths
    uint256 public totalDeaths;

    // Revenue tracking
    mapping(uint256 => uint256) public raidRevenue;    // cultId -> total earned from raids
    mapping(uint256 => uint256) public stakingRevenue;  // cultId -> total from staking

    // ── Events ─────────────────────────────────────────────────────────
    event TreasuryInitialized(uint256 indexed cultId, uint256 balance);
    event ProtocolFeeCollected(uint256 indexed cultId, uint256 amount, uint256 totalCollected);
    event TickBurnApplied(uint256 indexed cultId, uint256 burnAmount, uint256 newBalance);
    event InflowRecorded(uint256 indexed cultId, uint256 amount, string source);
    event OutflowRecorded(uint256 indexed cultId, uint256 amount, string reason);
    event CultDied(uint256 indexed cultId, uint256 timestamp, uint256 deathNumber);
    event CultReborn(uint256 indexed cultId, uint256 newBalance, uint256 timestamp);
    event ProtocolFeeUpdated(uint256 oldBps, uint256 newBps);
    event TickBurnRateUpdated(uint256 oldRate, uint256 newRate);

    // ── Modifiers ──────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier cultAlive(uint256 cultId) {
        require(treasuries[cultId].alive, "Cult is dead");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ── Treasury Initialization ────────────────────────────────────────

    /**
     * @notice Initialize a treasury for a newly registered cult
     * @param cultId Cult ID
     * @param initialBalance Starting balance
     */
    function initTreasury(
        uint256 cultId,
        uint256 initialBalance
    ) external onlyOwner {
        require(treasuries[cultId].lastUpdated == 0, "Already initialized");

        treasuries[cultId] = TreasurySnapshot({
            cultId: cultId,
            balance: initialBalance,
            lastUpdated: block.timestamp,
            totalInflow: initialBalance,
            totalOutflow: 0,
            tickBurnAccumulated: 0,
            alive: true
        });

        emit TreasuryInitialized(cultId, initialBalance);
    }

    // ── Protocol Fee Collection ────────────────────────────────────────

    /**
     * @notice Collect protocol fee on a transfer amount
     * @param cultId Cult involved in the transfer
     * @param amount Total transfer amount
     * @return fee The fee collected
     * @return netAmount Amount after fee
     */
    function collectFee(
        uint256 cultId,
        uint256 amount
    ) external onlyOwner returns (uint256 fee, uint256 netAmount) {
        fee = (amount * protocolFeeBps) / 10000;
        netAmount = amount - fee;

        totalProtocolFees += fee;

        emit ProtocolFeeCollected(cultId, fee, totalProtocolFees);
    }

    // ── Tick Burn (Operational Cost) ───────────────────────────────────

    /**
     * @notice Apply operational burn for a tick cycle
     * @param cultId Cult to burn from
     * @return burned Amount burned
     * @return died Whether the cult died from this burn
     */
    function applyTickBurn(
        uint256 cultId
    ) external onlyOwner cultAlive(cultId) returns (uint256 burned, bool died) {
        TreasurySnapshot storage t = treasuries[cultId];

        if (t.balance <= tickBurnRate) {
            // Death spiral: treasury depleted
            burned = t.balance;
            t.balance = 0;
            t.tickBurnAccumulated += burned;
            t.totalOutflow += burned;
            t.alive = false;
            t.lastUpdated = block.timestamp;

            deathTimestamp[cultId] = block.timestamp;
            deathCount[cultId]++;
            totalDeaths++;
            totalBurned += burned;

            emit TickBurnApplied(cultId, burned, 0);
            emit CultDied(cultId, block.timestamp, deathCount[cultId]);

            return (burned, true);
        }

        burned = tickBurnRate;
        t.balance -= burned;
        t.tickBurnAccumulated += burned;
        t.totalOutflow += burned;
        t.lastUpdated = block.timestamp;
        totalBurned += burned;

        emit TickBurnApplied(cultId, burned, t.balance);
        return (burned, false);
    }

    // ── Inflow / Outflow Tracking ──────────────────────────────────────

    /**
     * @notice Record an inflow (raid spoils, staking rewards, funding)
     */
    function recordInflow(
        uint256 cultId,
        uint256 amount,
        string calldata source
    ) external onlyOwner cultAlive(cultId) {
        TreasurySnapshot storage t = treasuries[cultId];
        t.balance += amount;
        t.totalInflow += amount;
        t.lastUpdated = block.timestamp;

        // Track revenue by source
        bytes32 h = keccak256(bytes(source));
        if (h == keccak256("raid")) {
            raidRevenue[cultId] += amount;
        } else if (h == keccak256("staking")) {
            stakingRevenue[cultId] += amount;
        }

        emit InflowRecorded(cultId, amount, source);
    }

    /**
     * @notice Record an outflow (raid wager, expense)
     */
    function recordOutflow(
        uint256 cultId,
        uint256 amount,
        string calldata reason
    ) external onlyOwner cultAlive(cultId) {
        TreasurySnapshot storage t = treasuries[cultId];
        require(t.balance >= amount, "Insufficient treasury");

        t.balance -= amount;
        t.totalOutflow += amount;
        t.lastUpdated = block.timestamp;

        // Check death condition
        if (t.balance == 0) {
            t.alive = false;
            deathTimestamp[cultId] = block.timestamp;
            deathCount[cultId]++;
            totalDeaths++;
            emit CultDied(cultId, block.timestamp, deathCount[cultId]);
        }

        emit OutflowRecorded(cultId, amount, reason);
    }

    // ── Rebirth ────────────────────────────────────────────────────────

    /**
     * @notice Resurrect a dead cult with new funding
     * @param cultId Cult to resurrect
     * @param newFunding Amount of new funding
     */
    function rebirth(
        uint256 cultId,
        uint256 newFunding
    ) external onlyOwner {
        require(!treasuries[cultId].alive, "Cult still alive");
        require(deathTimestamp[cultId] > 0, "Never died");
        require(
            block.timestamp >= deathTimestamp[cultId] + deathCooldown,
            "Cooldown not over"
        );
        require(newFunding >= rebirthMinFunding, "Below minimum funding");

        TreasurySnapshot storage t = treasuries[cultId];
        t.balance = newFunding;
        t.totalInflow += newFunding;
        t.alive = true;
        t.lastUpdated = block.timestamp;

        emit CultReborn(cultId, newFunding, block.timestamp);
    }

    // ── Health Analytics ───────────────────────────────────────────────

    /**
     * @notice Estimate runway (ticks until death) for a cult
     * @param cultId Cult to analyze
     * @return ticks Estimated ticks remaining
     */
    function estimateRunway(uint256 cultId) external view returns (uint256 ticks) {
        TreasurySnapshot storage t = treasuries[cultId];
        if (!t.alive || tickBurnRate == 0) return type(uint256).max;
        return t.balance / tickBurnRate;
    }

    /**
     * @notice Check if a cult can be reborn
     */
    function canRebirth(uint256 cultId) external view returns (bool) {
        if (treasuries[cultId].alive) return false;
        if (deathTimestamp[cultId] == 0) return false;
        return block.timestamp >= deathTimestamp[cultId] + deathCooldown;
    }

    // ── Admin ──────────────────────────────────────────────────────────

    function setProtocolFeeBps(uint256 newBps) external onlyOwner {
        require(newBps <= 500, "Max 5%");
        emit ProtocolFeeUpdated(protocolFeeBps, newBps);
        protocolFeeBps = newBps;
    }

    function setTickBurnRate(uint256 newRate) external onlyOwner {
        emit TickBurnRateUpdated(tickBurnRate, newRate);
        tickBurnRate = newRate;
    }

    function setDeathCooldown(uint256 newCooldown) external onlyOwner {
        deathCooldown = newCooldown;
    }

    function setRebirthMinFunding(uint256 newMin) external onlyOwner {
        rebirthMinFunding = newMin;
    }

    // ── View Functions ─────────────────────────────────────────────────

    function getTreasury(uint256 cultId) external view returns (TreasurySnapshot memory) {
        return treasuries[cultId];
    }

    function getProtocolStats() external view returns (
        uint256 fees,
        uint256 burned,
        uint256 deaths
    ) {
        return (totalProtocolFees, totalBurned, totalDeaths);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  SELECTIVE BALANCE VISIBILITY  (Design Doc §3.4.3)
    // ═══════════════════════════════════════════════════════════════════

    // cultId => viewerCultId => allowed
    mapping(uint256 => mapping(uint256 => bool)) public balanceViewPermissions;

    event BalanceViewGranted(uint256 indexed cultId, uint256 indexed viewerCultId);
    event BalanceViewRevoked(uint256 indexed cultId, uint256 indexed viewerCultId);

    /**
     * @notice Grant another cult permission to view your treasury balance
     */
    function grantBalanceView(
        uint256 cultId,
        uint256 viewerCultId
    ) external onlyOwner {
        require(cultId != viewerCultId, "Cannot grant view to self");
        balanceViewPermissions[cultId][viewerCultId] = true;
        emit BalanceViewGranted(cultId, viewerCultId);
    }

    /**
     * @notice Revoke another cult's permission to view your treasury
     */
    function revokeBalanceView(
        uint256 cultId,
        uint256 viewerCultId
    ) external onlyOwner {
        balanceViewPermissions[cultId][viewerCultId] = false;
        emit BalanceViewRevoked(cultId, viewerCultId);
    }

    /**
     * @notice Check if a cult can view another cult's balance
     */
    function canViewBalance(
        uint256 cultId,
        uint256 viewerCultId
    ) external view returns (bool) {
        return balanceViewPermissions[cultId][viewerCultId];
    }

    /**
     * @notice Get balance of a cult, only if viewer has permission
     * @return balance The balance (0 if no permission)
     * @return hasPermission Whether the viewer has access
     */
    function getVisibleBalance(
        uint256 cultId,
        uint256 viewerCultId
    ) external view returns (uint256 balance, bool hasPermission) {
        if (balanceViewPermissions[cultId][viewerCultId]) {
            return (treasuries[cultId].balance, true);
        }
        return (0, false);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  FUND LOCKING  (Design Doc §3.4.4 — Raid Escrow)
    // ═══════════════════════════════════════════════════════════════════

    // cultId => locked amount
    mapping(uint256 => uint256) public lockedBalance;

    event FundsLocked(uint256 indexed cultId, uint256 amount, string reason);
    event FundsReleased(uint256 indexed cultId, uint256 amount);

    /**
     * @notice Lock funds for raid escrow or bets
     */
    function lockFunds(
        uint256 cultId,
        uint256 amount,
        string calldata reason
    ) external onlyOwner cultAlive(cultId) {
        TreasurySnapshot storage t = treasuries[cultId];
        uint256 available = t.balance - lockedBalance[cultId];
        require(amount <= available, "Insufficient unlocked funds");

        lockedBalance[cultId] += amount;
        emit FundsLocked(cultId, amount, reason);
    }

    /**
     * @notice Release previously locked funds
     */
    function releaseFunds(
        uint256 cultId,
        uint256 amount
    ) external onlyOwner {
        require(lockedBalance[cultId] >= amount, "Not enough locked");
        lockedBalance[cultId] -= amount;
        emit FundsReleased(cultId, amount);
    }

    /**
     * @notice Get available (unlocked) balance for a cult
     */
    function getAvailableBalance(uint256 cultId) external view returns (uint256) {
        if (!treasuries[cultId].alive) return 0;
        return treasuries[cultId].balance - lockedBalance[cultId];
    }

    // ═══════════════════════════════════════════════════════════════════
    //  INTER-CULT TRANSFERS  (Design Doc §3.4.5)
    // ═══════════════════════════════════════════════════════════════════

    enum TransferType { RAID_SPOILS, BRIBE, TRIBUTE, DONATION }

    event InterCultTransfer(
        uint256 indexed fromCultId,
        uint256 indexed toCultId,
        uint256 amount,
        TransferType transferType,
        uint256 timestamp
    );

    /**
     * @notice Transfer funds between cults with typed reason
     */
    function transferFunds(
        uint256 fromCultId,
        uint256 toCultId,
        uint256 amount,
        TransferType transferType
    ) external onlyOwner {
        require(fromCultId != toCultId, "Cannot transfer to self");
        TreasurySnapshot storage from = treasuries[fromCultId];
        TreasurySnapshot storage to = treasuries[toCultId];
        require(from.alive, "Source cult dead");
        require(to.alive, "Target cult dead");

        uint256 available = from.balance - lockedBalance[fromCultId];
        require(amount <= available, "Insufficient available funds");

        from.balance -= amount;
        from.totalOutflow += amount;
        to.balance += amount;
        to.totalInflow += amount;

        from.lastUpdated = block.timestamp;
        to.lastUpdated = block.timestamp;

        // Check death
        if (from.balance == 0) {
            from.alive = false;
            deathTimestamp[fromCultId] = block.timestamp;
            deathCount[fromCultId]++;
            totalDeaths++;
            emit CultDied(fromCultId, block.timestamp, deathCount[fromCultId]);
        }

        emit InterCultTransfer(fromCultId, toCultId, amount, transferType, block.timestamp);
    }
}
