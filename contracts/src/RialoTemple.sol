// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RialoTemple {
    enum ReviewCategory {
        Food,
        Film
    }

    struct Profile {
        string name;
        string xUrl;
        string xHandle;
        string avatarUrl;
        uint256 followers;
        uint256 following;
        bool exists;
    }

    struct UserStats {
        uint256 lastCheckInDay;
        uint256 currentStreak;
        uint256 bestStreak;
        uint256 totalCheckIns;
        uint256 reviewCount;
        uint256 totalPts;
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

    struct LeaderboardEntry {
        address user;
        string name;
        string xHandle;
        string avatarUrl;
        uint256 currentStreak;
        uint256 bestStreak;
        uint256 totalCheckIns;
        uint256 reviewCount;
        uint256 totalPts;
    }

    error EmptyName();
    error EmptyXUrl();
    error ProfileRequired();
    error InvalidFee();
    error AlreadyCheckedIn();
    error InvalidRating();
    error EmptyReviewTitle();
    error TransferFailed();
    error NotOwner();

    uint256 public constant ACTION_FEE = 1 ether;
    uint256 public constant DAY_SECONDS = 1 days;
    uint256 public constant MAX_PAGE_SIZE = 50;

    address public immutable owner;
    address[] private users;
    Review[] private reviews;
    mapping(address => Profile) private profiles;
    mapping(address => UserStats) private stats;
    mapping(address => bool) public isRegistered;
    mapping(ReviewCategory => uint256[]) private reviewIdsByCategory;

    event ProfileUpdated(address indexed user, string name, string xHandle, string avatarUrl);
    event CheckedIn(
        address indexed user,
        uint256 day,
        uint256 currentStreak,
        uint256 bestStreak,
        uint256 ptsEarned,
        uint256 totalPts,
        uint256 totalCheckIns
    );
    event ReviewSubmitted(
        uint256 indexed id,
        address indexed reviewer,
        ReviewCategory indexed category,
        string title,
        uint8 rating,
        uint256 timestamp
    );
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier hasProfile() {
        if (!profiles[msg.sender].exists) revert ProfileRequired();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function setupProfile(
        string calldata name,
        string calldata xUrl,
        string calldata xHandle,
        string calldata avatarUrl,
        uint256 followers,
        uint256 following
    ) external {
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(xUrl).length == 0) revert EmptyXUrl();

        if (!isRegistered[msg.sender]) {
            users.push(msg.sender);
            isRegistered[msg.sender] = true;
        }

        profiles[msg.sender] = Profile({
            name: name,
            xUrl: xUrl,
            xHandle: xHandle,
            avatarUrl: avatarUrl,
            followers: followers,
            following: following,
            exists: true
        });

        emit ProfileUpdated(msg.sender, name, xHandle, avatarUrl);
    }

    function checkIn() external payable hasProfile {
        if (msg.value != ACTION_FEE) revert InvalidFee();

        UserStats storage userStats = stats[msg.sender];
        uint256 dayNumber = currentDay();
        if (userStats.lastCheckInDay == dayNumber) revert AlreadyCheckedIn();

        if (userStats.lastCheckInDay + 1 == dayNumber) {
            userStats.currentStreak += 1;
        } else {
            userStats.currentStreak = 1;
        }

        if (userStats.currentStreak > userStats.bestStreak) {
            userStats.bestStreak = userStats.currentStreak;
        }

        uint256 ptsEarned = ptsForStreak(userStats.currentStreak);
        userStats.lastCheckInDay = dayNumber;
        userStats.totalCheckIns += 1;
        userStats.totalPts += ptsEarned;

        emit CheckedIn(
            msg.sender,
            dayNumber,
            userStats.currentStreak,
            userStats.bestStreak,
            ptsEarned,
            userStats.totalPts,
            userStats.totalCheckIns
        );
    }

    function submitFoodReview(
        string calldata name,
        string calldata origin,
        string calldata imageUrl,
        uint8 rating,
        string calldata reviewText
    ) external payable hasProfile returns (uint256) {
        return _submitReview(ReviewCategory.Food, name, origin, imageUrl, rating, reviewText);
    }

    function submitFilmReview(
        string calldata title,
        string calldata imdbUrl,
        uint8 rating,
        string calldata reviewText
    ) external payable hasProfile returns (uint256) {
        return _submitReview(ReviewCategory.Film, title, imdbUrl, "", rating, reviewText);
    }

    function getProfile(address user) external view returns (Profile memory profile, UserStats memory userStats) {
        return (profiles[user], stats[user]);
    }

    function getMyProfile() external view returns (Profile memory profile, UserStats memory userStats) {
        return (profiles[msg.sender], stats[msg.sender]);
    }

    function getReviews(uint256 offset, uint256 limit) external view returns (Review[] memory) {
        uint256 reviewCount = reviews.length;
        if (offset >= reviewCount) return new Review[](0);

        uint256 size = _pageSize(reviewCount - offset, limit);
        Review[] memory page = new Review[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = reviews[reviewCount - 1 - offset - i];
        }
        return page;
    }

    function getReviewsByCategory(ReviewCategory category, uint256 offset, uint256 limit) external view returns (Review[] memory) {
        uint256[] storage ids = reviewIdsByCategory[category];
        if (offset >= ids.length) return new Review[](0);

        uint256 size = _pageSize(ids.length - offset, limit);
        Review[] memory page = new Review[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = reviews[ids[ids.length - 1 - offset - i]];
        }
        return page;
    }

    function getLeaderboard(uint256 limit) external view returns (LeaderboardEntry[] memory) {
        uint256 size = users.length < limit ? users.length : limit;
        if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE;

        LeaderboardEntry[] memory ranked = new LeaderboardEntry[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            ranked[i] = _entryFor(users[i]);
        }

        for (uint256 i = 0; i < size; i++) {
            uint256 best = i;
            for (uint256 j = i + 1; j < ranked.length; j++) {
                if (_isHigherRank(ranked[j], ranked[best])) {
                    best = j;
                }
            }
            if (best != i) {
                LeaderboardEntry memory temp = ranked[i];
                ranked[i] = ranked[best];
                ranked[best] = temp;
            }
        }

        LeaderboardEntry[] memory top = new LeaderboardEntry[](size);
        for (uint256 i = 0; i < size; i++) {
            top[i] = ranked[i];
        }
        return top;
    }

    function getTotals() external view returns (uint256 totalUsers, uint256 totalReviews, uint256 balance) {
        return (users.length, reviews.length, address(this).balance);
    }

    function getReviewCount() external view returns (uint256) {
        return reviews.length;
    }

    function getTotalUsers() external view returns (uint256) {
        return users.length;
    }

    function canCheckIn(address user) external view returns (bool) {
        return profiles[user].exists && stats[user].lastCheckInDay != currentDay();
    }

    function timeUntilNextCheckIn(address user) external view returns (uint256) {
        uint256 last = stats[user].lastCheckInDay;
        if (last == 0 || last != currentDay()) return 0;

        uint256 nextTimestamp = (last + 1) * DAY_SECONDS;
        if (block.timestamp >= nextTimestamp) return 0;
        return nextTimestamp - block.timestamp;
    }

    function currentDay() public view returns (uint256) {
        return block.timestamp / DAY_SECONDS;
    }

    function ptsForStreak(uint256 streak) public pure returns (uint256) {
        if (streak >= 30) return 20;
        if (streak >= 14) return 15;
        return 10;
    }

    function tierForStreak(uint256 streak) external pure returns (string memory) {
        if (streak >= 30) return "Rialo Master";
        if (streak >= 14) return "Rialo Builders";
        if (streak >= 7) return "Rialo Warrior";
        if (streak >= 3) return "Rialo club member";
        return "RialOne";
    }

    function withdraw(address payable to) external onlyOwner {
        uint256 amount = address(this).balance;
        (bool ok,) = to.call{ value: amount }("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount);
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
        reviews.push(Review({
            id: id,
            category: category,
            reviewer: msg.sender,
            title: title,
            originOrImdb: originOrImdb,
            imageUrl: imageUrl,
            rating: rating,
            reviewText: reviewText,
            timestamp: block.timestamp
        }));
        reviewIdsByCategory[category].push(id);
        stats[msg.sender].reviewCount += 1;

        emit ReviewSubmitted(id, msg.sender, category, title, rating, block.timestamp);
        return id;
    }

    function _pageSize(uint256 available, uint256 limit) private pure returns (uint256) {
        uint256 size = available < limit ? available : limit;
        if (size > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
        return size;
    }

    function _entryFor(address user) private view returns (LeaderboardEntry memory) {
        Profile storage profile = profiles[user];
        UserStats storage userStats = stats[user];
        return LeaderboardEntry({
            user: user,
            name: profile.name,
            xHandle: profile.xHandle,
            avatarUrl: profile.avatarUrl,
            currentStreak: userStats.currentStreak,
            bestStreak: userStats.bestStreak,
            totalCheckIns: userStats.totalCheckIns,
            reviewCount: userStats.reviewCount,
            totalPts: userStats.totalPts
        });
    }

    function _isHigherRank(LeaderboardEntry memory challenger, LeaderboardEntry memory current) private pure returns (bool) {
        if (challenger.totalPts != current.totalPts) return challenger.totalPts > current.totalPts;
        if (challenger.bestStreak != current.bestStreak) return challenger.bestStreak > current.bestStreak;
        return challenger.totalCheckIns > current.totalCheckIns;
    }
}
