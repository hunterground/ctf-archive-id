// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {EnumerableSet} from "./lib/EnumerableSet.sol";
import {Karma} from "./Karma.sol";

contract Treasury {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Bond {
        uint256 yield;
        uint256 maturity;
        uint256 bondPrice;
        EnumerableSet.AddressSet holders;
    }

    Karma public immutable karma;

    uint256 public nextBondId = 1;
    mapping(uint256 => Bond) internal bonds;

    constructor(address _karma) {
        karma = Karma(_karma);
    }

    function issueBond(uint256 yield, uint256 lockDuration, uint256 bondPrice) external returns (uint256 bondId) {
        bondId = nextBondId++;
        Bond storage bond = bonds[bondId];

        bond.yield = yield;
        bond.maturity = block.timestamp + lockDuration;
        bond.bondPrice = bondPrice;

        karma.transferFrom(msg.sender, address(this), yield);
    }

    function buyBond(uint256 bondId) external {
        Bond storage bond = bonds[bondId];

        require(block.timestamp < bond.maturity, "BOND_CLOSED");
        require(!bond.holders.contains(msg.sender), "ALREADY_BOUGHT");

        bond.yield += bond.bondPrice;
        bond.holders.add(msg.sender);

        karma.transferFrom(msg.sender, address(this), bond.bondPrice);
    }

    function claimYield(uint256 bondId) external {
        Bond storage bond = bonds[bondId];

        require(block.timestamp >= bond.maturity, "NOT_MATURED");
        require(bond.holders.contains(msg.sender), "NOT_HOLDER");

        delete bonds[bondId].holders;

        karma.transfer(msg.sender, bond.yield);
    }

    function getBond(uint256 bondId) external view returns (uint256, uint256, uint256) {
        Bond storage bond = bonds[bondId];
        return (bond.yield, bond.maturity, bond.bondPrice);
    }
}