// diagnoseStaking.ts
import { ethers } from "hardhat";

const STAKING_CONTRACT_ADDRESS = "0x16b023108eF76D6A60560D167C8014923096C0d5";
const SBFT_TOKEN_ADDRESS = "0x0c4464F238909ad9c8B5748EAF90e49A505EcdA6";

async function main(): Promise<void> {
  console.log("🔍 DIAGNOSING STAKING CONTRACT SETUP\n");
  console.log("═".repeat(60));

  const signers = await ethers.getSigners();
  const owner = signers[0];
  
  console.log(`Owner Address: ${owner.address}`);
  console.log("═".repeat(60));

  // Define ABIs
  const stakingAbi = [
    "function sbftToken() view returns (address)",
    "function masterNFT() view returns (address)",
    "function minStake() view returns (uint256)",
    "function totalETHInPool() view returns (uint256)",
    "function unstakingDelay() view returns (uint256)",
    "function annualRewardRate() view returns (uint256)",
    "function owner() view returns (address)",
  ];

  const tokenAbi = [
    "function stakingContract() view returns (address)",
    "function totalSupply() view returns (uint256)",
    "function owner() view returns (address)",
    "function balanceOf(address) view returns (uint256)",
  ];

  const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, owner);
  const sbftToken = new ethers.Contract(SBFT_TOKEN_ADDRESS, tokenAbi, owner);

  console.log("\n📋 CHECKING CONFIGURATION...\n");

  try {
    // Check Staking Contract
    console.log("1️⃣  STAKING CONTRACT:");
    const stakingOwner = await stakingContract.owner();
    const sbftTokenInStaking = await stakingContract.sbftToken();
    const masterNFT = await stakingContract.masterNFT();
    const minStake = await stakingContract.minStake();
    const totalPool = await stakingContract.totalETHInPool();
    const rewardRate = await stakingContract.annualRewardRate();
    const unstakingDelay = await stakingContract.unstakingDelay();

    console.log(`   Owner: ${stakingOwner}`);
    console.log(`   Owner Match: ${stakingOwner.toLowerCase() === owner.address.toLowerCase() ? '✅' : '❌'}`);
    console.log(`   sbFT Token Set: ${sbftTokenInStaking}`);
    console.log(`   Token Match: ${sbftTokenInStaking.toLowerCase() === SBFT_TOKEN_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
    console.log(`   Master NFT: ${masterNFT}`);
    console.log(`   Min Stake: ${ethers.utils.formatEther(minStake)} ETH`);
    console.log(`   Total Pool: ${ethers.utils.formatEther(totalPool)} ETH`);
    console.log(`   Reward Rate: ${rewardRate.toString()} basis points`);
    console.log(`   Unstaking Delay: ${unstakingDelay.toString()} seconds`);

    console.log("\n2️⃣  SBFT TOKEN CONTRACT:");
    const tokenOwner = await sbftToken.owner();
    const stakingContractInToken = await sbftToken.stakingContract();
    const totalSupply = await sbftToken.totalSupply();
    const ownerBalance = await sbftToken.balanceOf(owner.address);

    console.log(`   Owner: ${tokenOwner}`);
    console.log(`   Owner Match: ${tokenOwner.toLowerCase() === owner.address.toLowerCase() ? '✅' : '❌'}`);
    console.log(`   Staking Contract Set: ${stakingContractInToken}`);
    console.log(`   Staking Match: ${stakingContractInToken.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
    console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} sbFT`);
    console.log(`   Owner Balance: ${ethers.utils.formatEther(ownerBalance)} sbFT`);

    console.log("\n═".repeat(60));
    console.log("🎯 DIAGNOSIS RESULTS:\n");

    // Critical checks
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    if (stakingContractInToken.toLowerCase() !== STAKING_CONTRACT_ADDRESS.toLowerCase()) {
      criticalIssues.push("❌ CRITICAL: sbFT token doesn't have staking contract set!");
      criticalIssues.push("   This will cause mint() calls to fail.");
      criticalIssues.push(`   Current: ${stakingContractInToken}`);
      criticalIssues.push(`   Expected: ${STAKING_CONTRACT_ADDRESS}`);
    }

    if (sbftTokenInStaking.toLowerCase() !== SBFT_TOKEN_ADDRESS.toLowerCase()) {
      criticalIssues.push("❌ CRITICAL: Staking contract has wrong sbFT token address!");
      criticalIssues.push(`   Current: ${sbftTokenInStaking}`);
      criticalIssues.push(`   Expected: ${SBFT_TOKEN_ADDRESS}`);
    }

    if (masterNFT === ethers.constants.AddressZero) {
      warnings.push("⚠️  WARNING: Master NFT not set (fees won't be distributed)");
    }

    if (criticalIssues.length > 0) {
      console.log("🚨 CRITICAL ISSUES FOUND:\n");
      criticalIssues.forEach(issue => console.log(issue));
      console.log("\n");
    }

    if (warnings.length > 0) {
      console.log("⚠️  WARNINGS:\n");
      warnings.forEach(warning => console.log(warning));
      console.log("\n");
    }

    if (criticalIssues.length === 0 && warnings.length === 0) {
      console.log("✅ All critical configurations are correct!");
      console.log("   The staking should work properly.");
    }

    // Provide fix instructions
    if (stakingContractInToken.toLowerCase() !== STAKING_CONTRACT_ADDRESS.toLowerCase()) {
      console.log("═".repeat(60));
      console.log("🔧 TO FIX THE ISSUE:\n");
      console.log("Run this command in Hardhat console or create a script:");
      console.log("\nconst sbftToken = await ethers.getContractAt('SbFTToken', SBFT_TOKEN_ADDRESS);");
      console.log(`await sbftToken.setStakingContract('${STAKING_CONTRACT_ADDRESS}');`);
      console.log("\nOr use the fix script below.");
    }

  } catch (error: any) {
    console.error("❌ Error during diagnosis:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });