// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {HouseChips} from "./lib/Token.sol";
import {CashGameTable} from "./CashGameTable.sol";
import {VelvetPokerRoom} from "./VelvetPokerRoom.sol";

contract Setup {
    uint256 public constant HIGH_ROLLER_BONUS = 500 ether;
    uint256 public constant CASHOUT_TARGET = 1500 ether;

    address public immutable player;
    HouseChips public immutable chips;
    CashGameTable public immutable cashTable;
    VelvetPokerRoom public immutable pokerRoom;

    bool public bonusClaimed;

    constructor(address player_) {
        player = player_;
        chips = new HouseChips();
        cashTable = new CashGameTable(address(chips));
        pokerRoom = new VelvetPokerRoom();

        chips.mint(address(this), 1000 ether);
        chips.approve(address(cashTable), 1000 ether);
        cashTable.openTable(1000 ether, 365 days, 100 ether);
    }

    function cashHighRollerBonus() external {
        require(!bonusClaimed, "bonus claimed");
        require(!pokerRoom.getPitBoss().seated, "pit boss seated");
        bonusClaimed = true;
        chips.mint(msg.sender, HIGH_ROLLER_BONUS);
    }

    function isSolved() external view returns (bool) {
        return bonusClaimed && !pokerRoom.getPitBoss().seated && chips.balanceOf(player) >= CASHOUT_TARGET;
    }
}
