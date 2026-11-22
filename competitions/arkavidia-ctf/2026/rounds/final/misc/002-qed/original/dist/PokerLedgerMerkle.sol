// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IVelvetPokerRoom} from "./IVelvetPokerRoom.sol";

library PokerLedgerMerkle {
    uint256 public constant WORLD_NUM_ELEMENTS = 4;
    uint256 public constant WORLD_TREE_HEIGHT = 3;
    uint256 public constant WORLD_HANDS_INDEX = 3;
    uint256 public constant WORLD_SIDE_POTS_INDEX = 2;
    uint256 public constant HANDS_NUM_ELEMENTS = 128;
    uint256 public constant HANDS_TREE_HEIGHT = 8;
    uint256 public constant SIDE_POTS_NUM_ELEMENTS = 64;
    uint256 public constant SIDE_POTS_TREE_HEIGHT = 7;
    uint256 public constant HAND_NUM_ELEMENTS = 4;
    uint256 public constant SIDE_POT_NUM_ELEMENTS = 7;

    function proveHand(
        IVelvetPokerRoom.PocketHand memory hand,
        bytes32 root,
        bytes32[] memory proof
    ) internal pure returns (bool) {
        return _verify(root, merkleizeHand(hand), _worldPath(WORLD_HANDS_INDEX, HANDS_TREE_HEIGHT, hand.id), proof);
    }

    function proveSidePot(
        IVelvetPokerRoom.SidePot memory sidePot,
        bytes32 root,
        bytes32[] memory proof
    ) internal pure returns (bool) {
        return _verify(
            root,
            merkleizeSidePot(sidePot),
            _worldPath(WORLD_SIDE_POTS_INDEX, SIDE_POTS_TREE_HEIGHT, sidePot.id),
            proof
        );
    }

    function merkleizeRoom(
        string memory roomName,
        uint256 tableCount,
        IVelvetPokerRoom.PocketHand[] storage hands,
        IVelvetPokerRoom.SidePot[] storage sidePots
    ) internal view returns (bytes32) {
        bytes32[] memory roomLeaves = new bytes32[](WORLD_NUM_ELEMENTS);
        roomLeaves[0] = keccak256(abi.encode(roomName));
        roomLeaves[1] = keccak256(abi.encode(tableCount));
        roomLeaves[2] = merkleizeSidePots(sidePots);
        roomLeaves[3] = merkleizeHands(hands);
        return merkleize(roomLeaves);
    }

    function merkleizeHands(
        IVelvetPokerRoom.PocketHand[] storage hands
    ) internal view returns (bytes32) {
        bytes32[] memory nodes = new bytes32[](HANDS_NUM_ELEMENTS);
        uint256 limit = hands.length;
        if (limit > HANDS_NUM_ELEMENTS) {
            limit = HANDS_NUM_ELEMENTS;
        }

        for (uint256 i; i < limit; ) {
            nodes[i] = merkleizeHand(hands[i]);
            unchecked {
                ++i;
            }
        }

        return merkleize(nodes);
    }

    function merkleizeSidePots(
        IVelvetPokerRoom.SidePot[] storage sidePots
    ) internal view returns (bytes32) {
        bytes32[] memory nodes = new bytes32[](SIDE_POTS_NUM_ELEMENTS);
        uint256 limit = sidePots.length;

        for (uint256 i; i < limit; ) {
            nodes[i] = merkleizeSidePot(sidePots[i]);
            unchecked {
                ++i;
            }
        }

        return merkleize(nodes);
    }

    function merkleizeHand(
        IVelvetPokerRoom.PocketHand memory hand
    ) internal pure returns (bytes32) {
        bytes32[] memory parts = new bytes32[](HAND_NUM_ELEMENTS);
        parts[0] = keccak256(abi.encode(hand.id));
        parts[1] = keccak256(abi.encode(hand.pressure));
        parts[2] = keccak256(abi.encode(hand.heat));
        parts[3] = keccak256(abi.encode(hand.sharkId));
        return merkleize(parts);
    }

    function merkleizeSidePot(
        IVelvetPokerRoom.SidePot memory sidePot
    ) internal pure returns (bytes32) {
        bytes32[] memory parts = new bytes32[](SIDE_POT_NUM_ELEMENTS);
        parts[0] = keccak256(abi.encode(sidePot.id));
        parts[1] = keccak256(abi.encode(sidePot.title));
        parts[2] = keccak256(abi.encode(sidePot.legend));
        parts[3] = keccak256(abi.encode(sidePot.backing));
        parts[4] = keccak256(abi.encode(sidePot.jackpotCharge));
        parts[5] = keccak256(abi.encode(sidePot.payoutBoost));
        parts[6] = keccak256(abi.encode(sidePot.isLive));
        return merkleize(parts);
    }

    function merkleize(bytes32[] memory leaves) internal pure returns (bytes32) {
        uint256 width = _nextPowerOfTwo(leaves.length);
        bytes32[] memory level = new bytes32[](width);

        for (uint256 i; i < leaves.length; ) {
            level[i] = leaves[i];
            unchecked {
                ++i;
            }
        }

        while (width > 1) {
            uint256 cursor;
            for (uint256 i; i < width; i += 2) {
                level[cursor] = _compress(level[i], level[i + 1]);
                unchecked {
                    ++cursor;
                }
            }
            width = cursor;
        }

        return level[0];
    }

    function _worldPath(uint256 branchIndex, uint256 branchHeight, uint256 leafIndex) private pure returns (uint256) {
        return (branchIndex << (branchHeight - 1)) ^ leafIndex;
    }

    function _nextPowerOfTwo(uint256 value) private pure returns (uint256 result) {
        result = 1;
        while (result < value) {
            result <<= 1;
        }
    }

    function _compress(bytes32 left, bytes32 right) private pure returns (bytes32) {
        if (right == bytes32(0)) {
            if (left == bytes32(0)) {
                return bytes32(0);
            }
            return keccak256(abi.encodePacked(left, left));
        }

        return keccak256(abi.encodePacked(left, right));
    }

    function _verify(bytes32 root, bytes32 leaf, uint256 path, bytes32[] memory proof) private pure returns (bool) {
        bytes32 cursor = leaf;

        for (uint256 i; i < proof.length; ) {
            cursor = path & 1 == 0
                ? keccak256(abi.encodePacked(cursor, proof[i]))
                : keccak256(abi.encodePacked(proof[i], cursor));
            path >>= 1;
            unchecked {
                ++i;
            }
        }

        return cursor == root;
    }
}
