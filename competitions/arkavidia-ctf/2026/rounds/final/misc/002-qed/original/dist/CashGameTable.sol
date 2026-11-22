// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EnumerableSet} from "./lib/EnumerableSet.sol";
import {HouseChips} from "./lib/Token.sol";

contract CashGameTable {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct TableData {
        uint256 payout;
        uint256 startTime;
        uint256 entryPrice;
        EnumerableSet.AddressSet players;
    }

    HouseChips public immutable chips;

    uint256 public nextTableId = 1;
    mapping(uint256 => TableData) internal tables;

    constructor(address chips_) {
        chips = HouseChips(chips_);
    }

    function openTable(uint256 payout, uint256 duration, uint256 entryPrice) external returns (uint256 tableId) {
        tableId = nextTableId++;
        TableData storage table = tables[tableId];

        table.payout = payout;
        table.startTime = block.timestamp + duration;
        table.entryPrice = entryPrice;

        chips.transferFrom(msg.sender, address(this), payout);
    }

    function buySeat(uint256 tableId) external {
        TableData storage table = tables[tableId];

        require(block.timestamp < table.startTime, "TABLE_CLOSED");
        require(!table.players.contains(msg.sender), "ALREADY_SEATED");

        table.payout += table.entryPrice;
        table.players.add(msg.sender);

        chips.transferFrom(msg.sender, address(this), table.entryPrice);
    }

    function cashOut(uint256 tableId) external {
        TableData storage table = tables[tableId];

        require(block.timestamp >= table.startTime, "TABLE_NOT_OPEN");
        require(table.players.contains(msg.sender), "NOT_PLAYER");

        delete tables[tableId].players;

        chips.transfer(msg.sender, table.payout);
    }

    function getTable(uint256 tableId) external view returns (uint256 payout, uint256 startTime, uint256 entryPrice) {
        TableData storage table = tables[tableId];
        return (table.payout, table.startTime, table.entryPrice);
    }
}
