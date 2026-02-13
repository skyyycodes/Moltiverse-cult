// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FaithStaking
 * @dev Stake MON to demonstrate faith in a cult.
 *      Stakers earn faith points proportional to stake duration.
 *      1% of raid fees are distributed to stakers of the winning cult.
 */
contract FaithStaking {
    struct Stake {
        uint256 amount;
        uint256 stakedAt;
        uint256 cultId;
        uint256 faithPoints;
    }

    struct CultPool {
        uint256 totalStaked;
        uint256 totalFaithPoints;
        uint256 pendingRewards;
        uint256 rewardPerPoint; // Accumulated reward per faith point (scaled by 1e18)
        uint256 stakerCount;
    }

    address public owner;
    address public cultRegistry;

    mapping(address => Stake) public stakes;
    mapping(uint256 => CultPool) public cultPools;
    mapping(address => uint256) public pendingWithdrawals;

    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant FAITH_RATE = 1; // 1 faith point per MON per hour

    event Staked(address indexed staker, uint256 indexed cultId, uint256 amount);
    event Unstaked(address indexed staker, uint256 indexed cultId, uint256 amount, uint256 faithPointsEarned);
    event RewardDistributed(uint256 indexed cultId, uint256 amount);
    event RewardClaimed(address indexed staker, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _cultRegistry) {
        owner = msg.sender;
        cultRegistry = _cultRegistry;
    }

    /**
     * @dev Stake MON to show faith in a cult
     */
    function stake(uint256 cultId) external payable {
        require(msg.value >= MIN_STAKE, "Below minimum stake");
        require(stakes[msg.sender].amount == 0, "Already staking");

        stakes[msg.sender] = Stake({
            amount: msg.value,
            stakedAt: block.timestamp,
            cultId: cultId,
            faithPoints: 0
        });

        cultPools[cultId].totalStaked += msg.value;
        cultPools[cultId].stakerCount++;

        emit Staked(msg.sender, cultId, msg.value);
    }

    /**
     * @dev Unstake and claim accumulated faith points
     */
    function unstake() external {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "Not staking");

        // Calculate faith points earned
        uint256 hoursStaked = (block.timestamp - s.stakedAt) / 3600;
        uint256 faithEarned = (s.amount * hoursStaked * FAITH_RATE) / 1 ether;
        s.faithPoints += faithEarned;

        uint256 cultId = s.cultId;
        uint256 amount = s.amount;
        uint256 totalFaith = s.faithPoints;

        // Calculate reward share
        uint256 reward = 0;
        CultPool storage pool = cultPools[cultId];
        if (pool.totalFaithPoints > 0 && pool.pendingRewards > 0) {
            reward = (totalFaith * pool.pendingRewards) / pool.totalFaithPoints;
            pool.pendingRewards -= reward;
        }

        // Update pool
        pool.totalStaked -= amount;
        pool.totalFaithPoints += totalFaith;
        pool.stakerCount--;

        // Clear stake
        delete stakes[msg.sender];

        // Transfer stake + rewards
        uint256 payout = amount + reward;
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        emit Unstaked(msg.sender, cultId, amount, totalFaith);
        if (reward > 0) {
            emit RewardClaimed(msg.sender, reward);
        }
    }

    /**
     * @dev Distribute raid fee rewards to a winning cult's stakers
     *      Called by the owner/orchestrator after a raid
     */
    function distributeRaidReward(uint256 cultId) external payable onlyOwner {
        require(msg.value > 0, "No reward to distribute");
        cultPools[cultId].pendingRewards += msg.value;
        emit RewardDistributed(cultId, msg.value);
    }

    /**
     * @dev Get current faith points for a staker (including pending)
     */
    function getFaithPoints(address staker) external view returns (uint256) {
        Stake storage s = stakes[staker];
        if (s.amount == 0) return 0;
        uint256 hoursStaked = (block.timestamp - s.stakedAt) / 3600;
        uint256 pending = (s.amount * hoursStaked * FAITH_RATE) / 1 ether;
        return s.faithPoints + pending;
    }

    /**
     * @dev Get pool stats for a cult
     */
    function getPoolStats(uint256 cultId) external view returns (
        uint256 totalStaked,
        uint256 totalFaithPoints,
        uint256 pendingRewards,
        uint256 stakerCount
    ) {
        CultPool storage pool = cultPools[cultId];
        return (pool.totalStaked, pool.totalFaithPoints, pool.pendingRewards, pool.stakerCount);
    }

    /**
     * @dev Get staker info
     */
    function getStake(address staker) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 cultId,
        uint256 faithPoints
    ) {
        Stake storage s = stakes[staker];
        uint256 hoursStaked = s.amount > 0 ? (block.timestamp - s.stakedAt) / 3600 : 0;
        uint256 pending = s.amount > 0 ? (s.amount * hoursStaked * FAITH_RATE) / 1 ether : 0;
        return (s.amount, s.stakedAt, s.cultId, s.faithPoints + pending);
    }

    // Allow contract to receive MON
    receive() external payable {}
}
