// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Karma} from "./Karma.sol";
import {Treasury} from "./Treasury.sol";

contract Setup {
    Karma public karma;
    Treasury public treasury;

    address public player;
    bool public claimed;

    constructor(address _player) {
        player = _player;

        karma = new Karma();
        treasury = new Treasury(address(karma));

        karma.mint(address(this), 1000e18);

        karma.approve(address(treasury), 1000e18);
        treasury.issueBond(1000e18, 365 days, 100e18);
    }

    function claim() external {
        require(!claimed, "already claimed");
        claimed = true;

        karma.mint(msg.sender, 500e18);
    }

    function isSolved() external view returns (bool) {
        return karma.balanceOf(player) >= 1500e18;
    }
}