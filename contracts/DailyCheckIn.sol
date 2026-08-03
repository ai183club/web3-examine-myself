// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DailyCheckIn {
    uint256 public constant TIMEZONE_OFFSET = 8 hours;
    uint256 public constant MAX_BATCH_DAYS = 31;

    mapping(address => mapping(uint256 => bool)) private completed;

    error AlreadyCompleted(uint256 dayId);
    error BatchTooLarge(uint256 requested, uint256 maximum);

    event DailyStatusChanged(
        address indexed account,
        uint256 indexed dayId,
        bool status
    );

    function completeToday() external {
        uint256 dayId = currentDayId();

        if (completed[msg.sender][dayId]) {
            revert AlreadyCompleted(dayId);
        }

        completed[msg.sender][dayId] = true;
        emit DailyStatusChanged(msg.sender, dayId, true);
    }

    function currentDayId() public view returns (uint256) {
        return (block.timestamp + TIMEZONE_OFFSET) / 1 days;
    }

    function getStatus(
        address account,
        uint256 dayId
    ) external view returns (bool) {
        return completed[account][dayId];
    }

    function getMonthStatuses(
        address account,
        uint256 startDayId,
        uint256 dayCount
    ) external view returns (bool[] memory statuses) {
        if (dayCount > MAX_BATCH_DAYS) {
            revert BatchTooLarge(dayCount, MAX_BATCH_DAYS);
        }

        statuses = new bool[](dayCount);
        for (uint256 index = 0; index < dayCount; index++) {
            statuses[index] = completed[account][startDayId + index];
        }
    }
}
