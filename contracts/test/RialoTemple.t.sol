// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RialoTemple} from "../src/RialoTemple.sol";

interface Vm {
    function deal(address who, uint256 amount) external;
    function expectRevert(bytes4 selector) external;
    function prank(address sender) external;
    function warp(uint256 timestamp) external;
}

contract RialoTempleTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    RialoTemple private temple;
    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);

    function setUp() public {
        temple = new RialoTemple();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function testProfileSetupValidation() public {
        vm.prank(alice);
        vm.expectRevert(RialoTemple.EmptyName.selector);
        temple.setupProfile("", "https://x.com/alice", "alice", "https://img.test/a.png", 10, 3);

        vm.prank(alice);
        temple.setupProfile("Alice", "https://x.com/alice", "alice", "https://img.test/a.png", 10, 3);

        (RialoTemple.Profile memory profile,) = temple.getProfile(alice);
        assertTrue(profile.exists);
        assertEq(profile.name, "Alice");
        assertEq(temple.getTotalUsers(), 1);
    }

    function testCheckInRequiresExactNativeUsdcFee() public {
        _setup(alice, "Alice");

        vm.prank(alice);
        vm.expectRevert(RialoTemple.InvalidFee.selector);
        temple.checkIn{value: 0.5 ether}();

        vm.prank(alice);
        temple.checkIn{value: 1 ether}();

        (, RialoTemple.UserStats memory userStats) = temple.getProfile(alice);
        assertEq(userStats.totalCheckIns, 1);
        assertEq(userStats.currentStreak, 1);
        assertEq(userStats.totalPts, 10);
    }

    function testCheckInLocksForOneDay() public {
        _setup(alice, "Alice");

        vm.prank(alice);
        temple.checkIn{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert(RialoTemple.AlreadyCheckedIn.selector);
        temple.checkIn{value: 1 ether}();
    }

    function testStreakContinuesAndResets() public {
        _setup(alice, "Alice");

        vm.prank(alice);
        temple.checkIn{value: 1 ether}();
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        temple.checkIn{value: 1 ether}();
        vm.warp(block.timestamp + 2 days);
        vm.prank(alice);
        temple.checkIn{value: 1 ether}();

        (, RialoTemple.UserStats memory userStats) = temple.getProfile(alice);
        assertEq(userStats.currentStreak, 1);
        assertEq(userStats.bestStreak, 2);
        assertEq(userStats.totalCheckIns, 3);
    }

    function testPtsTierBoundaries() public view {
        assertEq(temple.ptsForStreak(0), 10);
        assertEq(temple.ptsForStreak(2), 10);
        assertEq(temple.ptsForStreak(3), 10);
        assertEq(temple.ptsForStreak(6), 10);
        assertEq(temple.ptsForStreak(7), 10);
        assertEq(temple.ptsForStreak(13), 10);
        assertEq(temple.ptsForStreak(14), 15);
        assertEq(temple.ptsForStreak(29), 15);
        assertEq(temple.ptsForStreak(30), 20);
    }

    function testReviewCountAndCategoryPagination() public {
        _setup(alice, "Alice");

        vm.prank(alice);
        temple.submitFoodReview{value: 1 ether}("Nasi Goreng", "Indonesia", "https://img.test/food.jpg", 5, "Great");
        vm.prank(alice);
        temple.submitFilmReview{value: 1 ether}("Dune", "https://imdb.com/title/tt1160419", 4, "Huge");

        assertEq(temple.getReviewCount(), 2);
        (, RialoTemple.UserStats memory userStats) = temple.getProfile(alice);
        assertEq(userStats.reviewCount, 2);

        RialoTemple.Review[] memory food = temple.getReviewsByCategory(RialoTemple.ReviewCategory.Food, 0, 10);
        assertEq(food.length, 1);
        assertEq(food[0].title, "Nasi Goreng");
    }

    function testLeaderboardOrdering() public {
        _setup(alice, "Alice");
        _setup(bob, "Bob");

        vm.prank(alice);
        temple.checkIn{value: 1 ether}();

        vm.prank(bob);
        temple.checkIn{value: 1 ether}();
        vm.warp(block.timestamp + 1 days);
        vm.prank(bob);
        temple.checkIn{value: 1 ether}();

        RialoTemple.LeaderboardEntry[] memory board = temple.getLeaderboard(10);
        assertEq(board[0].user, bob);
        assertEq(board[1].user, alice);
    }

    function testOwnerWithdraw() public {
        _setup(alice, "Alice");
        vm.prank(alice);
        temple.checkIn{value: 1 ether}();

        uint256 beforeBalance = address(this).balance;
        temple.withdraw(payable(address(this)));
        assertEq(address(this).balance, beforeBalance + 1 ether);
    }

    receive() external payable {}

    function _setup(address user, string memory name) private {
        vm.prank(user);
        temple.setupProfile(name, "https://x.com/user", name, "https://img.test/avatar.png", 1, 1);
    }

    function assertTrue(bool value) private pure {
        require(value, "assert true failed");
    }

    function assertEq(uint256 left, uint256 right) private pure {
        require(left == right, "uint assert eq failed");
    }

    function assertEq(address left, address right) private pure {
        require(left == right, "address assert eq failed");
    }

    function assertEq(string memory left, string memory right) private pure {
        require(keccak256(bytes(left)) == keccak256(bytes(right)), "string assert eq failed");
    }
}
