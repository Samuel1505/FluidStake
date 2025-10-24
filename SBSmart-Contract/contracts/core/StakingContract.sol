// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISbFTToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IStakeAndBakeNFT {
    function distributeFees(uint256 amount) external;
}

/**
 * @title StakingContract
 * @dev Liquid staking contract where sbFT tokens represent shares in a staking pool
 * @dev Exchange rate appreciates over time as rewards accumulate
 */
contract StakingContract is Ownable, ReentrancyGuard {
    
    ISbFTToken public sbftToken;
    IStakeAndBakeNFT public masterNFT;
    
    // Staking parameters
    uint256 public constant STAKING_FEE = 100; // 1% fee (100 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_STAKE = 1e15; // Minimum 0.001 ETH
    
    // Unstaking parameters
    uint256 public unstakingDelay = 7 days; // Protocol-level unstaking delay
    uint256 public constant MAX_UNSTAKING_DELAY = 30 days;
    uint256 public constant MIN_UNSTAKING_DELAY = 1 days;
    
    // Exchange rate parameters
    uint256 public annualRewardRate = 800; // 8% APY (800 basis points)
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public lastRewardUpdate;
    
    // Pool state
    uint256 public totalETHInPool; // Total ETH backing sbFT tokens
    uint256 public totalPendingUnstakes; // ETH reserved for pending unstakes
    
    // Unstaking queue
    struct UnstakeRequest {
        address user;
        uint256 ethAmount;
        uint256 unlockTime;
        bool processed;
    }
    
    mapping(uint256 => UnstakeRequest) public unstakeRequests;
    mapping(address => uint256[]) public userUnstakeRequests;
    uint256 public unstakeRequestCount;
    
    // Legacy support - keep for backwards compatibility but deprecate
    struct StakeInfo {
        uint256 stakedAmount;
        uint256 sbftBalance;
        uint256 lastRewardTime;
        uint256 pendingRewards;
        uint256 unlockTime;
        uint256 lockPeriod;
    }
    mapping(address => StakeInfo) public stakes; // Deprecated
    
    // Stats
    uint256 public totalStaked; // Now represents totalETHInPool
    uint256 public totalFeesCollected;
    uint256 public minStake = MIN_STAKE;
    
    // Events
    event Staked(address indexed user, uint256 ethAmount, uint256 sbftAmount, uint256 fee, uint256 exchangeRate);
    event UnstakeRequested(address indexed user, uint256 requestId, uint256 sbftAmount, uint256 ethAmount, uint256 unlockTime);
    event UnstakeProcessed(address indexed user, uint256 requestId, uint256 ethAmount);
    event UnstakeRequestCancelled(address indexed user, uint256 requestId, uint256 sbftAmount);
    event RewardsAccrued(uint256 rewardAmount, uint256 newExchangeRate);
    event ExchangeRateUpdated(uint256 newRate);
    event UnstakingDelayUpdated(uint256 newDelay);
    
    // Legacy events - keep for backwards compatibility
    event Unstaked(address indexed user, uint256 ethAmount, uint256 sbftAmount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsCompounded(address indexed user, uint256 amount);
    event FeeCollected(uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event MinStakeUpdated(uint256 newMinStake);
    
    constructor(address _sbftToken) Ownable(msg.sender) {
        require(_sbftToken != address(0), "Invalid sbFT token");
        sbftToken = ISbFTToken(_sbftToken);
        lastRewardUpdate = block.timestamp;
    }
    
    /**
     * @dev Set Master NFT contract address
     */
    function setMasterNFT(address _masterNFT) external onlyOwner {
        require(_masterNFT != address(0), "Invalid Master NFT address");
        masterNFT = IStakeAndBakeNFT(_masterNFT);
    }
    
    /**
     * @dev Update unstaking delay
     */
    function setUnstakingDelay(uint256 _newDelay) external onlyOwner {
        require(_newDelay >= MIN_UNSTAKING_DELAY, "Delay too short");
        require(_newDelay <= MAX_UNSTAKING_DELAY, "Delay too long");
        unstakingDelay = _newDelay;
        emit UnstakingDelayUpdated(_newDelay);
    }
    
    /**
     * @dev Get current exchange rate (ETH per sbFT)
     * @return Exchange rate scaled by 1e18
     */
    function getExchangeRate() public view returns (uint256) {
        uint256 sbftSupply = sbftToken.totalSupply();
        if (sbftSupply == 0) {
            return 1e18; // 1:1 initially
        }
        
        // Calculate time-based rewards that would be accrued
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        uint256 pendingRewards = (totalETHInPool * annualRewardRate * timeElapsed) / 
                                (BASIS_POINTS * SECONDS_PER_YEAR);
        
        uint256 totalValue = totalETHInPool + pendingRewards;
        return (totalValue * 1e18) / sbftSupply;
    }
    
    /**
     * @dev Stake ETH to receive sbFT tokens at current exchange rate
     */
    function stake() external payable nonReentrant {
        uint256 amount = msg.value;
        require(amount >= minStake, "Amount below minimum stake");
        
        // Update rewards before staking
        _accrueRewards();
        
        // Calculate fee and net amount
        uint256 fee = (amount * STAKING_FEE) / BASIS_POINTS;
        uint256 netAmount = amount - fee;
        
        // Calculate sbFT amount based on current exchange rate
        uint256 exchangeRate = getExchangeRate();
        uint256 sbftAmount = (netAmount * 1e18) / exchangeRate;
        
        // Update pool state
        totalETHInPool += netAmount;
        totalStaked = totalETHInPool; // For backwards compatibility
        totalFeesCollected += fee;
        
        // Mint sbFT tokens to user
        sbftToken.mint(msg.sender, sbftAmount);
        
        // Send fee to Master NFT contract (if set)
        if (address(masterNFT) != address(0) && fee > 0) {
            (bool success, ) = address(masterNFT).call{value: fee}("");
            require(success, "Fee transfer failed");
            masterNFT.distributeFees(fee);
        }
        
        emit Staked(msg.sender, amount, sbftAmount, fee, exchangeRate);
        emit FeeCollected(fee);
    }
    
    /**
     * @dev Request unstaking - creates unstake request with delay
     */
    function requestUnstake(uint256 sbftAmount) external nonReentrant {
        require(sbftAmount > 0, "Amount must be greater than 0");
        require(sbftToken.balanceOf(msg.sender) >= sbftAmount, "Insufficient sbFT balance");
        
        // Update rewards before unstaking
        _accrueRewards();
        
        // Calculate ETH amount based on current exchange rate
        uint256 exchangeRate = getExchangeRate();
        uint256 ethAmount = (sbftAmount * exchangeRate) / 1e18;
        
        // Burn sbFT tokens immediately
        sbftToken.burn(msg.sender, sbftAmount);
        
        // Create unstake request
        uint256 requestId = unstakeRequestCount++;
        uint256 unlockTime = block.timestamp + unstakingDelay;
        
        unstakeRequests[requestId] = UnstakeRequest({
            user: msg.sender,
            ethAmount: ethAmount,
            unlockTime: unlockTime,
            processed: false
        });
        
        userUnstakeRequests[msg.sender].push(requestId);
        
        // Update pool state
        totalETHInPool -= ethAmount;
        totalPendingUnstakes += ethAmount;
        totalStaked = totalETHInPool; // For backwards compatibility
        
        emit UnstakeRequested(msg.sender, requestId, sbftAmount, ethAmount, unlockTime);
    }
    
    /**
     * @dev Process unstake request after delay period
     */
    function processUnstake(uint256 requestId) external nonReentrant {
        require(requestId < unstakeRequestCount, "Invalid request ID");
        
        UnstakeRequest storage request = unstakeRequests[requestId];
        require(request.user == msg.sender, "Not your request");
        require(!request.processed, "Already processed");
        require(block.timestamp >= request.unlockTime, "Still locked");
        
        request.processed = true;
        totalPendingUnstakes -= request.ethAmount;
        
        // Transfer ETH to user
        (bool success, ) = msg.sender.call{value: request.ethAmount}("");
        require(success, "Transfer failed");
        
        emit UnstakeProcessed(msg.sender, requestId, request.ethAmount);
        emit Unstaked(msg.sender, request.ethAmount, 0); // Legacy event
    }
    
    /**
     * @dev Cancel unstake request and get sbFT tokens back
     */
    function cancelUnstakeRequest(uint256 requestId) external nonReentrant {
        require(requestId < unstakeRequestCount, "Invalid request ID");
        
        UnstakeRequest storage request = unstakeRequests[requestId];
        require(request.user == msg.sender, "Not your request");
        require(!request.processed, "Already processed");
        
        // Update rewards before cancelling
        _accrueRewards();
        
        // Calculate sbFT amount to return based on current exchange rate
        uint256 exchangeRate = getExchangeRate();
        uint256 sbftAmount = (request.ethAmount * 1e18) / exchangeRate;
        
        // Mark as processed
        request.processed = true;
        
        // Update pool state
        totalETHInPool += request.ethAmount;
        totalPendingUnstakes -= request.ethAmount;
        totalStaked = totalETHInPool; // For backwards compatibility
        
        // Mint sbFT tokens back to user
        sbftToken.mint(msg.sender, sbftAmount);
        
        emit UnstakeRequestCancelled(msg.sender, requestId, sbftAmount);
    }
    
    /**
     * @dev Instant unstake with penalty (for emergency situations)
     */
    function emergencyUnstake(uint256 sbftAmount, uint256 penaltyRate) external nonReentrant {
        require(sbftAmount > 0, "Amount must be greater than 0");
        require(sbftToken.balanceOf(msg.sender) >= sbftAmount, "Insufficient sbFT balance");
        require(penaltyRate <= 5000, "Penalty cannot exceed 50%");
        
        // Update rewards before unstaking
        _accrueRewards();
        
        // Calculate ETH amount based on current exchange rate
        uint256 exchangeRate = getExchangeRate();
        uint256 ethAmount = (sbftAmount * exchangeRate) / 1e18;
        
        // Apply penalty
        uint256 penalty = (ethAmount * penaltyRate) / BASIS_POINTS;
        uint256 netAmount = ethAmount - penalty;
        
        // Burn sbFT tokens
        sbftToken.burn(msg.sender, sbftAmount);
        
        // Update pool state
        totalETHInPool -= ethAmount;
        totalStaked = totalETHInPool; // For backwards compatibility
        totalFeesCollected += penalty;
        
        // Transfer net amount to user
        (bool success, ) = msg.sender.call{value: netAmount}("");
        require(success, "Transfer failed");
        
        // Send penalty to Master NFT contract (if set)
        if (address(masterNFT) != address(0) && penalty > 0) {
            (bool feeSuccess, ) = address(masterNFT).call{value: penalty}("");
            require(feeSuccess, "Penalty transfer failed");
            masterNFT.distributeFees(penalty);
        }
        
        emit Unstaked(msg.sender, netAmount, sbftAmount);
        emit FeeCollected(penalty);
    }
    
    /**
     * @dev Accrue rewards to the pool (increases exchange rate)
     */
    function _accrueRewards() internal {
        if (totalETHInPool == 0) {
            lastRewardUpdate = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed == 0) return;
        
        uint256 rewardAmount = (totalETHInPool * annualRewardRate * timeElapsed) / 
                              (BASIS_POINTS * SECONDS_PER_YEAR);
        
        if (rewardAmount > 0) {
            totalETHInPool += rewardAmount;
            totalStaked = totalETHInPool; // For backwards compatibility
            
            emit RewardsAccrued(rewardAmount, getExchangeRate());
        }
        
        lastRewardUpdate = block.timestamp;
    }
    
    /**
     * @dev Manual reward accrual (can be called by anyone)
     */
    function accrueRewards() external {
        _accrueRewards();
    }
    
    /**
     * @dev Get user's unstake requests
     */
    function getUserUnstakeRequests(address user) external view returns (uint256[] memory) {
        return userUnstakeRequests[user];
    }
    
    /**
     * @dev Check if unstake request can be processed
     */
    function canProcessUnstake(uint256 requestId) external view returns (bool, uint256) {
        if (requestId >= unstakeRequestCount) return (false, 0);
        
        UnstakeRequest memory request = unstakeRequests[requestId];
        if (request.processed) return (false, 0);
        
        if (block.timestamp >= request.unlockTime) {
            return (true, 0);
        } else {
            return (false, request.unlockTime - block.timestamp);
        }
    }
    
    /**
     * @dev Get available ETH for unstaking
     */
    function getAvailableETH() external view returns (uint256) {
        uint256 totalBalance = address(this).balance;
        return totalBalance > totalPendingUnstakes ? totalBalance - totalPendingUnstakes : 0;
    }
    
    // Legacy functions for backwards compatibility
    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Rate cannot exceed 20%");
        annualRewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }
    
    function setMinStake(uint256 _newMinStake) external onlyOwner {
        require(_newMinStake > 0, "Min stake must be greater than 0");
        minStake = _newMinStake;
        emit MinStakeUpdated(_newMinStake);
    }
    
    function getMinStake() external view returns (uint256) {
        return minStake;
    }
    
    function getCurrentLockPeriod() external view returns (uint256) {
        return unstakingDelay; // Now represents unstaking delay
    }
    
    function getContractStats() external view returns (uint256, uint256, uint256) {
        return (totalETHInPool, totalFeesCollected, annualRewardRate);
    }
    
    // Deprecated functions - return empty/default values
    function canUnstake(address) external pure returns (bool, uint256) {
        return (false, 0); // Deprecated - use requestUnstake instead
    }
    
    function getPendingRewards(address) external pure returns (uint256) {
        return 0; // Deprecated - rewards now automatic via exchange rate
    }
    
    function getUserStake(address) external pure returns (StakeInfo memory) {
        return StakeInfo(0, 0, 0, 0, 0, 0); // Deprecated
    }
    
    function claimRewards() external pure {
        revert("Deprecated - rewards are automatic via exchange rate appreciation");
    }
    
    function compoundRewards() external pure {
        revert("Deprecated - rewards are automatically compounded");
    }
    
    function unstake(uint256) external pure {
        revert("Deprecated - use requestUnstake() instead");
    }
    
    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdraw failed");
    }
    
    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {
        // Allow contract to receive ETH for rewards/top-ups
    }
}