// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    RIALO TEMPLE GRIALO

    Deploy this contract on Arc Testnet, then set the frontend contract address
    to the new deployed address.

    One-contract app architecture:
    - Onchain profile: username + X handle
    - Daily Grialo mystery box spin
    - Grialo PTS + streaks + best tier
    - Leaderboard helpers
    - Legacy food/film review compatibility for the existing Rialo Temple app

    Grialo spin is free except gas.
    No NFT. No token rewards. No USDC approval.
*/

contract RialoTempleGrialo {
    enum ReviewCategory {
        Food,
        Film
    }

    address public owner;
    bool public paused;

    uint256 public constant SPIN_COOLDOWN = 24 hours;
    uint256 public constant STREAK_WINDOW = 48 hours;
    uint256 public constant ACTION_FEE = 1 ether;
    uint256 public constant MAX_PAGE_SIZE = 50;

    uint8 public constant COMMON = 0;
    uint8 public constant UNCOMMON = 1;
    uint8 public constant RARE = 2;
    uint8 public constant EPIC = 3;
    uint8 public constant LEGENDARY = 4;
    uint8 public constant MYTHIC = 5;
    uint8 public constant SECRET = 6;

    struct Profile {
        string username;
        string xHandle;
        uint256 sealedAt;
        bool isSealed;
    }

    struct GrialoStats {
        uint256 totalSpins;
        uint256 totalPts;
        uint256 currentStreak;
        uint256 bestStreak;
        uint256 lastSpinAt;
        uint8 bestTier;
    }

    struct SpinResult {
        uint256 spinId;
        uint8 tier;
        uint256 pts;
        uint256 streakAfterSpin;
        uint256 timestamp;
    }

    struct UserView {
        string username;
        string xHandle;
        bool profileSealed;
        uint256 sealedAt;
        uint256 totalSpins;
        uint256 totalPts;
        uint256 currentStreak;
        uint256 bestStreak;
        uint256 lastSpinAt;
        uint8 bestTier;
        bool spinReady;
        uint256 waitTime;
    }

    struct LeaderboardRow {
        address user;
        string username;
        string xHandle;
        uint256 totalPts;
        uint256 totalSpins;
        uint256 bestStreak;
        uint8 bestTier;
    }

    struct Review {
        uint256 id;
        ReviewCategory category;
        address reviewer;
        string title;
        string originOrImdb;
        string imageUrl;
        uint8 rating;
        string reviewText;
        uint256 timestamp;
    }

    mapping(address => Profile) private profiles;
    mapping(address => GrialoStats) private statsOf;
    mapping(address => SpinResult[]) private historyOf;
    mapping(address => bool) private joined;
    mapping(ReviewCategory => uint256[]) private reviewIdsByCategory;

    address[] private players;
    Review[] private reviews;

    uint256 public totalGlobalSpins;
    uint256 public totalGlobalPts;
    uint256 public totalProfiles;

    event ProfileSealed(address indexed user, string username, string xHandle, uint256 timestamp);
    event ProfileUpdated(address indexed user, string username, string xHandle, uint256 timestamp);
    event GrialoSpun(
        address indexed user,
        uint256 indexed spinId,
        uint8 tier,
        string tierName,
        string boxName,
        uint256 pts,
        uint256 streakAfterSpin,
        uint256 totalPts,
        uint256 timestamp
    );
    event ReviewSubmitted(
        uint256 indexed id,
        address indexed reviewer,
        ReviewCategory indexed category,
        string title,
        uint8 rating,
        uint256 timestamp
    );
    event Paused(bool status);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event Withdrawn(address indexed to, uint256 amount);

    error NotOwner();
    error PausedError();
    error UsernameRequired();
    error UsernameTooLong();
    error XHandleTooLong();
    error ProfileRequired();
    error EnergyNotReady();
    error NoSpins();
    error OutOfRange();
    error InvalidFee();
    error InvalidRating();
    error EmptyReviewTitle();
    error ZeroAddress();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier notPaused() {
        if (paused) revert PausedError();
        _;
    }

    modifier hasSealedProfile() {
        if (!profiles[msg.sender].isSealed) revert ProfileRequired();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    receive() external payable {}

    // ------------------------------------------------------------
    // Profile
    // ------------------------------------------------------------

    function sealProfile(string calldata username, string calldata xHandle) external notPaused {
        if (bytes(username).length == 0) revert UsernameRequired();
        if (bytes(username).length > 32) revert UsernameTooLong();
        if (bytes(xHandle).length > 32) revert XHandleTooLong();

        Profile storage profile = profiles[msg.sender];

        if (!profile.isSealed) {
            profile.sealedAt = block.timestamp;
            profile.isSealed = true;
            totalProfiles += 1;
            _joinIfNeeded(msg.sender);
            emit ProfileSealed(msg.sender, username, xHandle, block.timestamp);
        } else {
            emit ProfileUpdated(msg.sender, username, xHandle, block.timestamp);
        }

        profile.username = username;
        profile.xHandle = xHandle;
    }

    function hasProfile(address user) public view returns (bool) {
        return profiles[user].isSealed;
    }

    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }

    function getUser(address user) external view returns (UserView memory data) {
        Profile memory profile = profiles[user];
        GrialoStats memory stats = statsOf[user];

        data = UserView({
            username: profile.username,
            xHandle: profile.xHandle,
            profileSealed: profile.isSealed,
            sealedAt: profile.sealedAt,
            totalSpins: stats.totalSpins,
            totalPts: stats.totalPts,
            currentStreak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            lastSpinAt: stats.lastSpinAt,
            bestTier: stats.bestTier,
            spinReady: canSpin(user),
            waitTime: timeUntilNextSpin(user)
        });
    }

    // ------------------------------------------------------------
    // Grialo
    // ------------------------------------------------------------

    function spinGrialo() external notPaused hasSealedProfile returns (SpinResult memory result) {
        if (!canSpin(msg.sender)) revert EnergyNotReady();

        _joinIfNeeded(msg.sender);

        GrialoStats storage stats = statsOf[msg.sender];
        stats.currentStreak = _nextStreak(stats.lastSpinAt, stats.currentStreak);

        if (stats.currentStreak > stats.bestStreak) {
            stats.bestStreak = stats.currentStreak;
        }

        uint256 randomness = _random(msg.sender, stats.totalSpins);
        uint8 tier = _rollTier(randomness);
        uint256 pts = _pointsForTier(tier, stats.currentStreak);

        stats.totalSpins += 1;
        stats.totalPts += pts;
        stats.lastSpinAt = block.timestamp;

        if (tier > stats.bestTier) {
            stats.bestTier = tier;
        }

        totalGlobalSpins += 1;
        totalGlobalPts += pts;

        result = SpinResult({
            spinId: stats.totalSpins,
            tier: tier,
            pts: pts,
            streakAfterSpin: stats.currentStreak,
            timestamp: block.timestamp
        });

        historyOf[msg.sender].push(result);

        emit GrialoSpun(
            msg.sender,
            result.spinId,
            tier,
            tierName(tier),
            boxName(tier),
            pts,
            stats.currentStreak,
            stats.totalPts,
            block.timestamp
        );
    }

    function getStats(address user) external view returns (GrialoStats memory) {
        return statsOf[user];
    }

    function getLatestSpin(address user) external view returns (SpinResult memory) {
        uint256 length = historyOf[user].length;
        if (length == 0) revert NoSpins();
        return historyOf[user][length - 1];
    }

    function getSpinHistory(address user) external view returns (SpinResult[] memory) {
        return historyOf[user];
    }

    function getSpinHistoryLength(address user) external view returns (uint256) {
        return historyOf[user].length;
    }

    function canSpin(address user) public view returns (bool) {
        uint256 lastSpin = statsOf[user].lastSpinAt;
        if (lastSpin == 0) return true;
        return block.timestamp >= lastSpin + SPIN_COOLDOWN;
    }

    function timeUntilNextSpin(address user) public view returns (uint256) {
        uint256 lastSpin = statsOf[user].lastSpinAt;
        if (lastSpin == 0) return 0;

        uint256 readyAt = lastSpin + SPIN_COOLDOWN;
        if (block.timestamp >= readyAt) return 0;
        return readyAt - block.timestamp;
    }

    function nextSpinAt(address user) external view returns (uint256) {
        uint256 lastSpin = statsOf[user].lastSpinAt;
        if (lastSpin == 0) return block.timestamp;
        return lastSpin + SPIN_COOLDOWN;
    }

    // ------------------------------------------------------------
    // Leaderboard
    // ------------------------------------------------------------

    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }

    function getPlayerAt(uint256 index) external view returns (address) {
        if (index >= players.length) revert OutOfRange();
        return players[index];
    }

    function getPlayers(uint256 start, uint256 limit) external view returns (address[] memory list) {
        uint256 count = players.length;
        if (start >= count) return new address[](0);

        uint256 end = start + limit;
        if (end > count) end = count;

        list = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            list[i - start] = players[i];
        }
    }

    function getTopByPts(uint256 limit) external view returns (LeaderboardRow[] memory) {
        return _buildRows(_topUsersByValue(limit, true));
    }

    function getTopByStreak(uint256 limit) external view returns (LeaderboardRow[] memory) {
        return _buildRows(_topUsersByValue(limit, false));
    }

    // ------------------------------------------------------------
    // Legacy Review Compatibility
    // ------------------------------------------------------------

    function submitFoodReview(
        string calldata name,
        string calldata origin,
        string calldata imageUrl,
        uint8 rating,
        string calldata reviewText
    ) external payable notPaused hasSealedProfile returns (uint256) {
        return _submitReview(ReviewCategory.Food, name, origin, imageUrl, rating, reviewText);
    }

    function submitFilmReview(
        string calldata title,
        string calldata imdbUrl,
        uint8 rating,
        string calldata reviewText
    ) external payable notPaused hasSealedProfile returns (uint256) {
        return _submitReview(ReviewCategory.Film, title, imdbUrl, "", rating, reviewText);
    }

    function getReviews(uint256 offset, uint256 limit) external view returns (Review[] memory) {
        uint256 count = reviews.length;
        if (offset >= count) return new Review[](0);

        uint256 size = _pageSize(count - offset, limit);
        Review[] memory page = new Review[](size);

        for (uint256 i = 0; i < size; i++) {
            page[i] = reviews[count - 1 - offset - i];
        }

        return page;
    }

    function getReviewsByCategory(
        ReviewCategory category,
        uint256 offset,
        uint256 limit
    ) external view returns (Review[] memory) {
        uint256[] storage ids = reviewIdsByCategory[category];
        if (offset >= ids.length) return new Review[](0);

        uint256 size = _pageSize(ids.length - offset, limit);
        Review[] memory page = new Review[](size);

        for (uint256 i = 0; i < size; i++) {
            page[i] = reviews[ids[ids.length - 1 - offset - i]];
        }

        return page;
    }

    function getReviewCount() external view returns (uint256) {
        return reviews.length;
    }

    function getTotals() external view returns (uint256 totalUsers, uint256 totalReviews, uint256 balance) {
        return (players.length, reviews.length, address(this).balance);
    }

    // ------------------------------------------------------------
    // Tier Metadata
    // ------------------------------------------------------------

    function tierName(uint8 tier) public pure returns (string memory) {
        if (tier == COMMON) return "Common";
        if (tier == UNCOMMON) return "Uncommon";
        if (tier == RARE) return "Rare";
        if (tier == EPIC) return "Epic";
        if (tier == LEGENDARY) return "Legendary";
        if (tier == MYTHIC) return "Mythic";
        if (tier == SECRET) return "Secret";
        return "Unknown";
    }

    function boxName(uint8 tier) public pure returns (string memory) {
        if (tier == COMMON) return "Stone";
        if (tier == UNCOMMON) return "Jade";
        if (tier == RARE) return "Sapphire";
        if (tier == EPIC) return "Amethyst";
        if (tier == LEGENDARY) return "Gold";
        if (tier == MYTHIC) return "Crown";
        if (tier == SECRET) return "Void";
        return "Unknown";
    }

    function grialoText(uint8 tier) public pure returns (string memory) {
        if (tier == COMMON) return "grialo";
        if (tier == UNCOMMON) return "Grialo!";
        if (tier == RARE) return "GRIALO";
        if (tier == EPIC) return "GRIALOOO";
        if (tier == LEGENDARY) return "GRIALO *";
        if (tier == MYTHIC) return "GRIALO KING";
        if (tier == SECRET) return "grialo?";
        return "grialo";
    }

    function pointsPreview(uint8 tier, uint256 streak) external pure returns (uint256) {
        return _pointsForTier(tier, streak);
    }

    // ------------------------------------------------------------
    // Admin
    // ------------------------------------------------------------

    function setPaused(bool status) external onlyOwner {
        paused = status;
        emit Paused(status);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function withdraw(address payable to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    // ------------------------------------------------------------
    // Internal
    // ------------------------------------------------------------

    function _joinIfNeeded(address user) internal {
        if (!joined[user]) {
            joined[user] = true;
            players.push(user);
        }
    }

    function _nextStreak(uint256 lastSpinAt, uint256 currentStreak) internal view returns (uint256) {
        if (lastSpinAt == 0) return 1;
        if (block.timestamp <= lastSpinAt + STREAK_WINDOW) return currentStreak + 1;
        return 1;
    }

    function _rollTier(uint256 randomness) internal pure returns (uint8) {
        uint256 roll = randomness % 10000;

        if (roll < 5500) return COMMON;
        if (roll < 8000) return UNCOMMON;
        if (roll < 9200) return RARE;
        if (roll < 9700) return EPIC;
        if (roll < 9900) return LEGENDARY;
        if (roll < 9980) return MYTHIC;
        return SECRET;
    }

    function _pointsForTier(uint8 tier, uint256 streak) internal pure returns (uint256) {
        uint256 basePts;

        if (tier == COMMON) {
            basePts = 10;
        } else if (tier == UNCOMMON) {
            basePts = 25;
        } else if (tier == RARE) {
            basePts = 60;
        } else if (tier == EPIC) {
            basePts = 150;
        } else if (tier == LEGENDARY) {
            basePts = 400;
        } else if (tier == MYTHIC) {
            basePts = 1000;
        } else if (tier == SECRET) {
            basePts = 2500;
        }

        uint256 streakBonus = streak * 2;
        if (streakBonus > 100) streakBonus = 100;
        return basePts + streakBonus;
    }

    function _random(address user, uint256 userSpinCount) internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    blockhash(block.number - 1),
                    user,
                    userSpinCount,
                    totalGlobalSpins,
                    address(this)
                )
            )
        );
    }

    function _topUsersByValue(uint256 limit, bool byPts) internal view returns (address[] memory topUsers) {
        uint256 count = players.length;
        if (limit > count) limit = count;
        if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

        topUsers = new address[](limit);
        uint256[] memory topValues = new uint256[](limit);

        for (uint256 i = 0; i < count; i++) {
            address user = players[i];
            uint256 value = byPts ? statsOf[user].totalPts : statsOf[user].bestStreak;
            _insertTop(topUsers, topValues, user, value);
        }
    }

    function _insertTop(address[] memory topUsers, uint256[] memory topValues, address user, uint256 value)
        internal
        pure
    {
        uint256 length = topValues.length;

        for (uint256 i = 0; i < length; i++) {
            if (topUsers[i] == address(0) || value > topValues[i]) {
                for (uint256 j = length - 1; j > i; j--) {
                    topValues[j] = topValues[j - 1];
                    topUsers[j] = topUsers[j - 1];
                }

                topValues[i] = value;
                topUsers[i] = user;
                break;
            }
        }
    }

    function _buildRows(address[] memory topUsers) internal view returns (LeaderboardRow[] memory rows) {
        rows = new LeaderboardRow[](topUsers.length);

        for (uint256 i = 0; i < topUsers.length; i++) {
            address user = topUsers[i];
            Profile memory profile = profiles[user];
            GrialoStats memory stats = statsOf[user];

            rows[i] = LeaderboardRow({
                user: user,
                username: profile.username,
                xHandle: profile.xHandle,
                totalPts: stats.totalPts,
                totalSpins: stats.totalSpins,
                bestStreak: stats.bestStreak,
                bestTier: stats.bestTier
            });
        }
    }

    function _submitReview(
        ReviewCategory category,
        string calldata title,
        string calldata originOrImdb,
        string memory imageUrl,
        uint8 rating,
        string calldata reviewText
    ) private returns (uint256) {
        if (msg.value != ACTION_FEE) revert InvalidFee();
        if (bytes(title).length == 0) revert EmptyReviewTitle();
        if (rating < 1 || rating > 5) revert InvalidRating();

        uint256 id = reviews.length;
        reviews.push(
            Review({
                id: id,
                category: category,
                reviewer: msg.sender,
                title: title,
                originOrImdb: originOrImdb,
                imageUrl: imageUrl,
                rating: rating,
                reviewText: reviewText,
                timestamp: block.timestamp
            })
        );
        reviewIdsByCategory[category].push(id);

        emit ReviewSubmitted(id, msg.sender, category, title, rating, block.timestamp);
        return id;
    }

    function _pageSize(uint256 available, uint256 limit) private pure returns (uint256) {
        uint256 size = available < limit ? available : limit;
        if (size > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
        return size;
    }
}
