// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EventEmitter
 * @notice Unified on-chain event log for the AgentCult ecosystem.
 * @dev Design Doc §3.9: "All significant game actions emit structured events
 *      for indexing, analytics, and frontend real-time updates."
 *
 *      Categories: RAID, GOVERNANCE, ECONOMY, SOCIAL, AGENT, SYSTEM
 */
contract EventEmitter {

    enum EventCategory { RAID, GOVERNANCE, ECONOMY, SOCIAL, AGENT, SYSTEM }

    struct GameEvent {
        uint256 id;
        EventCategory category;
        uint256 cultId;
        string eventType;
        string data;             // JSON-encoded payload
        uint256 timestamp;
    }

    address public owner;
    uint256 public nextEventId;

    // Optional: limit storage for gas efficiency; most consumers use logs
    mapping(uint256 => GameEvent) public events;
    mapping(uint256 => uint256) public cultEventCount;

    // Category counters
    mapping(EventCategory => uint256) public categoryCount;

    // ── Events ─────────────────────────────────────────────────────────
    event GameEventEmitted(
        uint256 indexed eventId,
        EventCategory indexed category,
        uint256 indexed cultId,
        string eventType,
        string data,
        uint256 timestamp
    );

    event BatchEventsEmitted(
        uint256 startId,
        uint256 count,
        uint256 timestamp
    );

    // ── Modifiers ──────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ── Core Functions ─────────────────────────────────────────────────

    /**
     * @notice Emit a single game event
     */
    function emitEvent(
        EventCategory category,
        uint256 cultId,
        string calldata eventType,
        string calldata data
    ) external onlyOwner returns (uint256 eventId) {
        eventId = nextEventId++;

        events[eventId] = GameEvent({
            id: eventId,
            category: category,
            cultId: cultId,
            eventType: eventType,
            data: data,
            timestamp: block.timestamp
        });

        cultEventCount[cultId]++;
        categoryCount[category]++;

        emit GameEventEmitted(eventId, category, cultId, eventType, data, block.timestamp);
    }

    /**
     * @notice Emit a batch of events efficiently
     */
    function emitBatch(
        EventCategory[] calldata categories,
        uint256[] calldata cultIds,
        string[] calldata eventTypes,
        string[] calldata dataPayloads
    ) external onlyOwner returns (uint256 startId) {
        uint256 count = categories.length;
        require(
            cultIds.length == count &&
            eventTypes.length == count &&
            dataPayloads.length == count,
            "Array length mismatch"
        );

        startId = nextEventId;

        for (uint256 i = 0; i < count; i++) {
            uint256 eventId = nextEventId++;

            events[eventId] = GameEvent({
                id: eventId,
                category: categories[i],
                cultId: cultIds[i],
                eventType: eventTypes[i],
                data: dataPayloads[i],
                timestamp: block.timestamp
            });

            cultEventCount[cultIds[i]]++;
            categoryCount[categories[i]]++;

            emit GameEventEmitted(
                eventId,
                categories[i],
                cultIds[i],
                eventTypes[i],
                dataPayloads[i],
                block.timestamp
            );
        }

        emit BatchEventsEmitted(startId, count, block.timestamp);
    }

    // ── View Functions ─────────────────────────────────────────────────

    function getGameEvent(uint256 eventId) external view returns (GameEvent memory) {
        return events[eventId];
    }

    function getTotalEvents() external view returns (uint256) {
        return nextEventId;
    }

    function getCultEventCount(uint256 cultId) external view returns (uint256) {
        return cultEventCount[cultId];
    }

    function getCategoryCount(EventCategory category) external view returns (uint256) {
        return categoryCount[category];
    }
}
