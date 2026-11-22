// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IVelvetPokerRoom} from "./IVelvetPokerRoom.sol";
import {PokerLedgerMerkle} from "./PokerLedgerMerkle.sol";

interface IChipRunner {
    function onMarkedHand(address caller, uint256 lastId) external;
}

contract VelvetPokerRoom is IVelvetPokerRoom {
    uint256 public constant MAX_PRESSURE = 100;
    uint256 public constant MAX_HEAT = 10;
    uint256 public constant BASE_BANKROLL = 10_000;
    uint256 public constant TABLE_IMAGE_BONUS = 100;
    bytes4 public constant BANNED_BUYIN_SELECTOR = bytes4(keccak256("takeSeat()"));

    string public roomName;
    PitBoss private pitBoss;
    PokerTable[] public tables;
    mapping(address => uint256) public tableOf;
    mapping(address => CardSharp) public sharkOf;
    uint256 public sharkCount;
    mapping(address => bool) public vipPass;

    PocketHand[] private hands;
    SidePot[] private sidePots;
    mapping(uint256 => address) public handOwner;
    mapping(uint256 => uint256) public handSlotById;
    mapping(uint256 => uint256) private starterHandOfShark;
    uint256 private nextHandId;
    mapping(address => address) public runnerOf;

    uint8 private shuffleDepth;
    address private shuffleCaller;
    uint8 private runnerDepth;
    address private runnerCaller;

    event SharkRegistered(address indexed account, uint256 indexed sharkId, uint256 starterHandId);
    event TableImageRaised(address indexed account, uint256 image, uint256 bankroll);
    event HandDealt(address indexed account, uint256 indexed handId, uint256 slot);
    event HandTabled(address indexed account, uint256 indexed handId, uint256 pressure, uint256 heat);
    event JackpotSweetened(address indexed account, uint256 indexed handId, uint256 jackpotCharge);
    event PitBossCleanedOut(address indexed account);

    constructor() {
        roomName = "Velvet Royale";
        pitBoss = PitBoss({
            tableRep: 9000,
            stack: 1_000_000_000_000,
            seated: true,
            rakeHit: 100_000
        });
        tables.push(PokerTable({host: address(this), dealerButton: true, seatedCount: 0}));
        _seedSidePot("Deep Stack", 77, 1312, 1, 3_000_000_000_000, true);
        _seedSidePot("River Monster", 10, 42, 2, 25, true);
    }

    modifier onlyVip() {
        _assertVip(msg.sender);
        _;
    }

    modifier onlyHost() {
        uint256 seatId = _tableIdOf(msg.sender);
        require(tables[seatId].host == msg.sender, "NOT_HOST");
        _;
    }

    modifier onlyShuffle() {
        require(shuffleDepth == 2, "DECK_NOT_READY");
        require(msg.sender == address(this), "HOUSE_ONLY");
        _;
    }

    modifier velvetRope(bytes memory payload) {
        _checkVelvetRope(payload);
        _;
    }

    function buyIn(bytes memory payload) public velvetRope(payload) {
        _routeToSelf(payload, "BUYIN_BOUNCED");
    }

    function takeSeat() external {
        require(msg.sender == address(this), "NO_MARKER");
        vipPass[tx.origin] = true;
    }

    function shuffleDeck(bytes memory payload) public {
        uint8 phase = shuffleDepth;
        if (phase == 1) {
            require(msg.sender == address(this), "SHUFFLE_FAIL");
            shuffleDepth = 2;
            return;
        }
        if (phase != 0) {
            revert("SHUFFLE_FAIL");
        }

        shuffleCaller = msg.sender;
        shuffleDepth = 1;
        _routeToSelf(payload, "SHUFFLE_FAIL");
        require(shuffleDepth == 2, "SHUFFLE_FAIL");
        delete shuffleDepth;
        delete shuffleCaller;
    }

    function sweetenJackpot(uint256 handId) external {
        shuffleDeck("");
        this.markJackpot(handId);
    }

    function sweetenJackpotBatch(uint256[] calldata handIds) external {
        shuffleDeck("");

        for (uint256 i; i < handIds.length; ) {
            _tableForShuffle(shuffleCaller, handIds[i]);
            this.markJackpot(handIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    function joinTable(uint256 tableId) external onlyVip {
        require(tableOf[msg.sender] == 0, "ALREADY_SEATED");
        require(tableId < tables.length, "UNKNOWN_TABLE");

        PokerTable storage pokerTable = tables[tableId];
        tableOf[msg.sender] = tableId + 1;
        pokerTable.seatedCount += 1;
    }

    function registerShark() external onlyVip {
        require(sharkOf[msg.sender].bankroll == 0, "SHARK_EXISTS");

        uint256 sharkId = sharkCount;
        uint256 handId = nextHandId;
        uint256 slot = hands.length;

        sharkCount = sharkId + 1;
        nextHandId = handId + 1;

        require(handSlotById[handId] == 0, "HAND_EXISTS");

        hands.push(PocketHand({id: handId, pressure: 1, heat: 1, sharkId: sharkId}));
        handSlotById[handId] = slot + 1;
        handOwner[handId] = msg.sender;
        starterHandOfShark[sharkId] = handId;
        sharkOf[msg.sender] = CardSharp({
            id: sharkId,
            bankroll: BASE_BANKROLL,
            tableImage: 1,
            activeHandId: handId
        });

        emit SharkRegistered(msg.sender, sharkId, handId);
    }

    function readTheRoom() external onlyVip {
        CardSharp storage shark = _activeShark(msg.sender);
        shark.tableImage += 1;
        shark.bankroll += TABLE_IMAGE_BONUS;
        emit TableImageRaised(msg.sender, shark.tableImage, shark.bankroll);
    }

    function dealHand(uint256 pressure, uint256 heat) external onlyVip returns (uint256 id) {
        id = _deal(msg.sender, pressure, heat);
    }

    function appointRunner(address runner) external onlyVip {
        runnerOf[msg.sender] = runner;
    }

    function dealMarkedHand(uint256 pressure, uint256 heat) external onlyVip returns (uint256 id) {
        id = _deal(msg.sender, pressure, heat);

        address runner = runnerOf[msg.sender];
        if (runner == address(0)) {
            return id;
        }

        runnerCaller = msg.sender;
        runnerDepth = 1;
        IChipRunner(runner).onMarkedHand(msg.sender, id);
        delete runnerDepth;
        delete runnerCaller;
    }

    function dealHandFromRunner(uint256 pressure, uint256 heat) external returns (uint256 id) {
        require(runnerDepth == 1, "RUNNER_IDLE");
        require(msg.sender == runnerOf[runnerCaller], "BAD_RUNNER");
        id = _deal(runnerCaller, pressure, heat);
    }

    function markJackpot(uint256 handId) external onlyShuffle {
        _markJackpot(shuffleCaller, handId);
    }

    function tableHand(PocketHand calldata hand, bytes32[] calldata proof) external onlyVip {
        uint256 slotPlusOne = handSlotById[hand.id];
        require(slotPlusOne != 0, "UNKNOWN_HAND");
        require(handOwner[hand.id] == msg.sender, "NOT_OWNER");
        require(PokerLedgerMerkle.proveHand(hand, roomRoot(), proof), "BAD_HAND_PROOF");

        CardSharp storage shark = _activeShark(msg.sender);
        PocketHand storage liveHand = hands[slotPlusOne - 1];

        liveHand.pressure = hand.pressure;
        liveHand.heat = hand.heat;
        shark.activeHandId = hand.id;

        emit HandTabled(msg.sender, hand.id, liveHand.pressure, liveHand.heat);
    }

    function cashSidePot(SidePot calldata sidePot, bytes32[] calldata proof) external onlyVip onlyHost {
        require(sidePot.id < sidePots.length, "UNKNOWN_POT");
        require(PokerLedgerMerkle.proveSidePot(sidePot, roomRoot(), proof), "BAD_POT_PROOF");

        CardSharp storage shark = _activeShark(msg.sender);
        PocketHand storage liveHand = _handFor(shark.activeHandId);

        require(liveHand.sharkId == shark.id, "HAND_NOT_LIVE");

        shark.tableImage += uint8(sidePot.legend);
        shark.bankroll += sidePot.backing;
        liveHand.pressure = _cap(liveHand.pressure + sidePot.payoutBoost, MAX_PRESSURE);
        liveHand.heat = _cap(liveHand.heat + (sidePot.isLive ? 1 : 0), MAX_HEAT);
    }

    function callTheHouse() external onlyVip {
        CardSharp storage shark = _activeShark(msg.sender);
        require(pitBoss.seated, "HOUSE_BROKE");

        PocketHand storage liveHand = _handFor(shark.activeHandId);
        require(liveHand.sharkId == shark.id, "HAND_NOT_LIVE");

        uint256 damage = liveHand.pressure * liveHand.heat + shark.tableImage;
        require(damage > 0, "NO_EDGE");

        if (damage >= pitBoss.stack) {
            pitBoss.stack = 0;
            pitBoss.seated = false;
            emit PitBossCleanedOut(msg.sender);
            return;
        }

        pitBoss.stack -= damage;

        if (shark.bankroll <= pitBoss.rakeHit) {
            shark.bankroll = 0;
            return;
        }

        shark.bankroll -= pitBoss.rakeHit;
    }

    function getHand(uint256 id) external view returns (PocketHand memory) {
        return hands[id];
    }

    function getSidePot(uint256 id) external view returns (SidePot memory) {
        return sidePots[id];
    }

    function getHandCount() external view returns (uint256) {
        return hands.length;
    }

    function getSidePotCount() external view returns (uint256) {
        return sidePots.length;
    }

    function getPitBoss() external view returns (PitBoss memory) {
        return pitBoss;
    }

    function roomRoot() public view returns (bytes32) {
        return PokerLedgerMerkle.merkleizeRoom(roomName, tables.length, hands, sidePots);
    }

    function _checkVelvetRope(bytes memory payload) internal view {
        address entrant = msg.sender;
        uint256 size;

        assembly {
            size := extcodesize(entrant)
        }

        require(size == 0 && entrant != tx.origin, "NO_BUYIN");
        require(payload.length >= 4, "NO_BUYIN");

        bytes4 selector;
        assembly {
            selector := calldataload(0x44)
        }

        require(selector != BANNED_BUYIN_SELECTOR, "NO_BUYIN");
    }

    function _routeToSelf(bytes memory payload, string memory reason) internal {
        (bool success, ) = address(this).call(payload);
        require(success, reason);
    }

    function _assertVip(address account) internal view {
        require(vipPass[account], "NOT_VIP");
    }

    function _activeShark(address account) internal view returns (CardSharp storage shark) {
        shark = sharkOf[account];
        require(shark.bankroll > 0, "NO_SHARK");
    }

    function _handFor(uint256 handId) internal view returns (PocketHand storage hand) {
        uint256 slotPlusOne = handSlotById[handId];
        require(slotPlusOne != 0, "NO_HAND");
        hand = hands[slotPlusOne - 1];
    }

    function _markJackpot(address caller, uint256 handId) internal {
        _assertVip(caller);

        CardSharp storage shark = _activeShark(caller);
        require(handId == shark.activeHandId, "HAND_NOT_ACTIVE");

        uint256 starterId = starterHandOfShark[shark.id];
        require(handId != starterId, "STARTER_LOCKED");
        require(handOwner[handId] == caller, "NOT_OWNER");

        PocketHand storage hand = _handFor(handId);
        require(hand.sharkId == shark.id, "HAND_NOT_LIVE");
        require(hand.heat > 0, "COLD_HAND");

        sidePots[0].jackpotCharge += hand.heat;
        hand.pressure = 0;
        hand.heat = 0;
        hand.sharkId = 0;
        handOwner[handId] = address(0);
        shark.activeHandId = starterId;

        emit JackpotSweetened(caller, handId, sidePots[0].jackpotCharge);
    }

    function _tableForShuffle(address caller, uint256 handId) internal {
        _assertVip(caller);
        require(handOwner[handId] == caller, "NOT_OWNER");

        CardSharp storage shark = _activeShark(caller);
        PocketHand storage hand = _handFor(handId);
        require(hand.sharkId == shark.id, "HAND_NOT_LIVE");

        shark.activeHandId = handId;
        emit HandTabled(caller, handId, hand.pressure, hand.heat);
    }

    function _tableIdOf(address account) internal view returns (uint256 tableId) {
        tableId = tableOf[account];
        require(tableId != 0, "NOT_SEATED");
        unchecked {
            --tableId;
        }
    }

    function _deal(address caller, uint256 pressure, uint256 heat) internal returns (uint256 id) {
        CardSharp storage shark = _activeShark(caller);
        PokerTable storage pokerTable = tables[_tableIdOf(caller)];

        require(pokerTable.dealerButton, "NO_DEALER");
        require(pressure <= MAX_PRESSURE && heat <= MAX_HEAT, "HAND_TOO_HOT");

        id = nextHandId;
        require(handSlotById[id] == 0, "HAND_EXISTS");

        uint256 slot = hands.length;
        nextHandId = id + 1;
        hands.push(PocketHand({id: id, pressure: pressure, heat: heat, sharkId: shark.id}));
        handSlotById[id] = slot + 1;
        handOwner[id] = caller;

        emit HandDealt(caller, id, slot);
    }

    function _seedSidePot(
        bytes32 title,
        uint256 legend,
        uint256 backing,
        uint256 jackpotCharge,
        uint256 payoutBoost,
        bool isLive
    ) internal {
        require(sidePots.length < PokerLedgerMerkle.SIDE_POTS_NUM_ELEMENTS, "POT_CAP");

        sidePots.push(
            SidePot({
                id: sidePots.length,
                title: title,
                legend: legend,
                backing: backing,
                jackpotCharge: jackpotCharge,
                payoutBoost: payoutBoost,
                isLive: isLive
            })
        );
    }

    function _cap(uint256 value, uint256 ceiling) internal pure returns (uint256) {
        return value > ceiling ? ceiling : value;
    }
}
