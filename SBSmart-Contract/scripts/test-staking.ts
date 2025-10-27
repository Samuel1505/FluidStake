// testStake.ts

import { ethers } from "hardhat";

// --- REPLACE THESE WITH YOUR ACTUAL DEPLOYED ADDRESSES ---
const STAKING_CONTRACT_ADDRESS = "0x4f73E4cB8C765f45C3E0fe1c2a7fa03Bc0b4DAEd";
const SBFT_TOKEN_ADDRESS = "0x0c4464F238909ad9c8B5748EAF90e49A505EcdA6";
// --------------------------------------------------------

async function main(): Promise<void> {
  console.log("🚀 Starting Staking Contract Interaction Test...\n");

  // 1. Get Signers
  const signers = await ethers.getSigners();
  // Using the second signer as the test user to simulate a wallet interaction
  const testUser = signers[1] || signers[0]; 
  
  console.log(`Test User Address: ${testUser.address}`);
  const userBalance = await testUser.getBalance();
  console.log(`User ETH Balance: ${ethers.utils.formatEther(userBalance)} ETH`);
  console.log("═".repeat(50));

  // 2. Define ABIs
  // UPDATED: stake() no longer takes a parameter, only payable
  const stakingAbi = [
    "function stake() payable",
    "function minStake() view returns (uint256)",
    "function totalETHInPool() view returns (uint256)",
    "function getExchangeRate() view returns (uint256)",
    "function totalStaked() view returns (uint256)",
  ];

  const tokenAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
  ];

  // 3. Connect to Contracts
  const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, testUser);
  const sbftToken = new ethers.Contract(SBFT_TOKEN_ADDRESS, tokenAbi, testUser);

  // 4. Pre-stake checks
  try {
    const minStake = await stakingContract.minStake();
    const exchangeRate = await stakingContract.getExchangeRate();
    const totalPoolETH = await stakingContract.totalETHInPool();
    const sbftTotalSupply = await sbftToken.totalSupply();
    
    console.log("\n📊 Contract State Before Staking:");
    console.log(`Min Stake: ${ethers.utils.formatEther(minStake)} ETH`);
    console.log(`Exchange Rate: ${ethers.utils.formatEther(exchangeRate)} ETH per sbFT`);
    console.log(`Total Pool ETH: ${ethers.utils.formatEther(totalPoolETH)} ETH`);
    console.log(`sbFT Total Supply: ${ethers.utils.formatEther(sbftTotalSupply)} sbFT`);
    console.log("═".repeat(50));
  } catch (error: any) {
    console.warn("⚠️  Could not fetch pre-stake data:", error.message);
  }

  // 5. Setup Test Parameters
  const stakeAmountETH = "0.003";
  const stakeAmountWei = ethers.utils.parseEther(stakeAmountETH);

  console.log(`\n💰 Attempting to stake ${stakeAmountETH} ETH...`);
  console.log(`Amount in Wei: ${stakeAmountWei.toString()}`);
  console.log("═".repeat(50));

  // 6. Execute Stake Transaction
  try {
    // CRITICAL FIX: No parameter needed, only send value
    const tx = await stakingContract.stake({ 
      value: stakeAmountWei,
      gasLimit: 500000
    });
    
    console.log(`\n✅ Transaction sent! Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log(`✅ Transaction confirmed in block: ${receipt?.blockNumber}`);
    console.log(`⛽ Gas Used: ${receipt?.gasUsed.toString()}`);
    
    // Parse events to get details
    if (receipt?.logs && receipt.logs.length > 0) {
      console.log(`📝 Events emitted: ${receipt.logs.length}`);
    }
    
    console.log("\n🎉 Stake operation successful!");
    console.log("═".repeat(50));

    // 7. Post-stake Verification
    console.log("\n🔍 Verifying Results...");
    
    const sbftBalance = await sbftToken.balanceOf(testUser.address);
    const newUserBalance = await testUser.getBalance();
    const newTotalPoolETH = await stakingContract.totalETHInPool();
    const newExchangeRate = await stakingContract.getExchangeRate();
    
    console.log(`\n📊 Post-Stake State:`);
    console.log(`Your sbFT Balance: ${ethers.utils.formatEther(sbftBalance)} sbFT`);
    console.log(`Your ETH Balance: ${ethers.utils.formatEther(newUserBalance)} ETH`);
    console.log(`Total Pool ETH: ${ethers.utils.formatEther(newTotalPoolETH)} ETH`);
    console.log(`New Exchange Rate: ${ethers.utils.formatEther(newExchangeRate)} ETH per sbFT`);
    console.log("═".repeat(50));
    
    // Calculate expected values
    const fee = stakeAmountWei.mul(100).div(10000); // 1% fee
    const netAmount = stakeAmountWei.sub(fee);
    console.log(`\n💡 Breakdown:`);
    console.log(`Staked Amount: ${ethers.utils.formatEther(stakeAmountWei)} ETH`);
    console.log(`Fee (1%): ${ethers.utils.formatEther(fee)} ETH`);
    console.log(`Net Amount: ${ethers.utils.formatEther(netAmount)} ETH`);
    console.log(`sbFT Received: ${ethers.utils.formatEther(sbftBalance)} sbFT`);
    
  } catch (error: any) {
    console.error("\n❌ Staking Test Failed:");
    console.error("Error Message:", error.message);
    
    // More detailed error info
    if (error.reason) {
      console.error("Revert Reason:", error.reason);
    }
    if (error.code) {
      console.error("Error Code:", error.code);
    }
    if (error.data) {
      console.error("Error Data:", error.data);
    }
    
    console.log("\n🔧 Troubleshooting Tips:");
    console.log("1. Ensure you've updated the stake() function in StakingContract");
    console.log("2. Check that the staking contract has the correct sbFT token address");
    console.log("3. Verify sbFT token has set the staking contract address");
    console.log("4. Make sure you're staking above the minimum amount");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });