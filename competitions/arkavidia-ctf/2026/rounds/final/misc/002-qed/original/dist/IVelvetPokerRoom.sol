// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IVelvetPokerRoom {
    struct CardSharp {
        uint256 id;
        uint256 bankroll;
        uint8 tableImage;
        uint256 activeHandId;
    }

    struct PocketHand {
        uint256 id;
        uint256 pressure;
        uint256 heat;
        uint256 sharkId;
    }

    struct SidePot {
        uint256 id;
        bytes32 title;
        uint256 legend;
        uint256 backing;
        uint256 jackpotCharge;
        uint256 payoutBoost;
        bool isLive;
    }

    struct PitBoss {
        uint256 tableRep;
        uint256 stack;
        bool seated;
        uint256 rakeHit;
    }

    struct PokerTable {
        address host;
        bool dealerButton;
        uint256 seatedCount;
    }
}
