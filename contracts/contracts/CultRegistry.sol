// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CultRegistry {
    struct Cult {
        uint256 id;
        address leader;
        string name;
        string prophecyPrompt;
        address tokenAddress;
        uint256 treasuryBalance;
        uint256 followerCount;
        uint256 raidWins;
        uint256 raidLosses;
        uint256 createdAt;
        bool active;
    }

    struct Prophecy {
        uint256 cultId;
        string prediction;
        uint256 createdAt;
        uint256 targetTimestamp;
        bool resolved;
        bool correct;
    }

    address public owner;
    uint256 public nextCultId;
    uint256 public nextProphecyId;
    uint256 public totalRaids;

    mapping(uint256 => Cult) public cults;
    mapping(address => uint256) public leaderToCult;
    mapping(uint256 => Prophecy) public prophecies;
    mapping(uint256 => address[]) public cultFollowers;
    mapping(address => uint256) public followerToCult;

    event CultRegistered(
        uint256 indexed cultId,
        address indexed leader,
        string name,
        address tokenAddress,
        uint256 initialTreasury
    );
    event TreasuryUpdated(uint256 indexed cultId, uint256 newBalance);
    event FollowerJoined(uint256 indexed cultId, address indexed follower);
    event FollowerLeft(uint256 indexed cultId, address indexed follower);
    event RaidResult(
        uint256 indexed attackerId,
        uint256 indexed defenderId,
        bool attackerWon,
        uint256 amount,
        uint256 timestamp
    );
    event ProphecyCreated(
        uint256 indexed prophecyId,
        uint256 indexed cultId,
        string prediction,
        uint256 targetTimestamp
    );
    event ProphecyResolved(
        uint256 indexed prophecyId,
        uint256 indexed cultId,
        bool correct,
        uint256 treasuryMultiplier
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyLeaderOrOwner(uint256 cultId) {
        require(
            msg.sender == cults[cultId].leader || msg.sender == owner,
            "Not leader or owner"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerCult(
        string calldata name,
        string calldata prophecyPrompt,
        address tokenAddress
    ) external payable returns (uint256 cultId) {
        cultId = nextCultId++;
        cults[cultId] = Cult({
            id: cultId,
            leader: msg.sender,
            name: name,
            prophecyPrompt: prophecyPrompt,
            tokenAddress: tokenAddress,
            treasuryBalance: msg.value,
            followerCount: 0,
            raidWins: 0,
            raidLosses: 0,
            createdAt: block.timestamp,
            active: true
        });
        leaderToCult[msg.sender] = cultId;
        emit CultRegistered(cultId, msg.sender, name, tokenAddress, msg.value);
    }

    function depositToTreasury(uint256 cultId) external payable {
        require(cults[cultId].active, "Cult not active");
        cults[cultId].treasuryBalance += msg.value;
        emit TreasuryUpdated(cultId, cults[cultId].treasuryBalance);
    }

    function joinCult(uint256 cultId) external {
        require(cults[cultId].active, "Cult not active");
        // Leave previous cult if any
        uint256 prevCult = followerToCult[msg.sender];
        if (prevCult != 0 || cultFollowers[0].length > 0) {
            // Simple check - just update counts
            if (cults[prevCult].followerCount > 0 && prevCult != cultId) {
                cults[prevCult].followerCount--;
                emit FollowerLeft(prevCult, msg.sender);
            }
        }
        cults[cultId].followerCount++;
        followerToCult[msg.sender] = cultId;
        cultFollowers[cultId].push(msg.sender);
        emit FollowerJoined(cultId, msg.sender);
    }

    function recordRaid(
        uint256 attackerId,
        uint256 defenderId,
        bool attackerWon,
        uint256 amount
    ) external onlyOwner {
        require(cults[attackerId].active, "Attacker not active");
        require(cults[defenderId].active, "Defender not active");

        if (attackerWon) {
            cults[attackerId].raidWins++;
            cults[defenderId].raidLosses++;
            // Transfer treasury (simulated - tracked in mapping)
            if (amount <= cults[defenderId].treasuryBalance) {
                cults[defenderId].treasuryBalance -= amount;
                cults[attackerId].treasuryBalance += amount;
            }
        } else {
            cults[attackerId].raidLosses++;
            cults[defenderId].raidWins++;
        }

        totalRaids++;
        emit RaidResult(attackerId, defenderId, attackerWon, amount, block.timestamp);
    }

    function createProphecy(
        uint256 cultId,
        string calldata prediction,
        uint256 targetTimestamp
    ) external onlyLeaderOrOwner(cultId) returns (uint256 prophecyId) {
        prophecyId = nextProphecyId++;
        prophecies[prophecyId] = Prophecy({
            cultId: cultId,
            prediction: prediction,
            createdAt: block.timestamp,
            targetTimestamp: targetTimestamp,
            resolved: false,
            correct: false
        });
        emit ProphecyCreated(prophecyId, cultId, prediction, targetTimestamp);
    }

    function resolveProphecy(
        uint256 prophecyId,
        bool correct,
        uint256 treasuryMultiplier
    ) external onlyOwner {
        Prophecy storage p = prophecies[prophecyId];
        require(!p.resolved, "Already resolved");
        p.resolved = true;
        p.correct = correct;

        if (correct && treasuryMultiplier > 100) {
            // Multiply treasury by multiplier/100 (e.g., 150 = 1.5x)
            uint256 bonus = (cults[p.cultId].treasuryBalance * (treasuryMultiplier - 100)) / 100;
            cults[p.cultId].treasuryBalance += bonus;
        }

        emit ProphecyResolved(prophecyId, p.cultId, correct, treasuryMultiplier);
    }

    // View functions
    function getCult(uint256 cultId) external view returns (Cult memory) {
        return cults[cultId];
    }

    function getTotalCults() external view returns (uint256) {
        return nextCultId;
    }

    function getCultFollowers(uint256 cultId) external view returns (address[] memory) {
        return cultFollowers[cultId];
    }

    function getAllCults() external view returns (Cult[] memory) {
        Cult[] memory allCults = new Cult[](nextCultId);
        for (uint256 i = 0; i < nextCultId; i++) {
            allCults[i] = cults[i];
        }
        return allCults;
    }
}
