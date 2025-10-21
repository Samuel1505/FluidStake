const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment process...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Configuration - UPDATE THESE ADDRESSES
  const ETH_TOKEN_ADDRESS = process.env.ETH_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
  const SBFT_TOKEN_ADDRESS = process.env.SBFT_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
  const MASTER_NFT_ADDRESS = process.env.MASTER_NFT_ADDRESS || ""; // Optional, can be set later

  // Validate addresses
  if (ETH_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("ETH_TOKEN_ADDRESS not set. Please set it in .env file or environment variables");
  }
  if (SBFT_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("SBFT_TOKEN_ADDRESS not set. Please set it in .env file or environment variables");
  }

  console.log("Configuration:");
  console.log("- ETH Token Address:", ETH_TOKEN_ADDRESS);
  console.log("- sbFT Token Address:", SBFT_TOKEN_ADDRESS);
  console.log("- Master NFT Address:", MASTER_NFT_ADDRESS || "(will be set later)");
  console.log("");

  // Deploy StakingContract
  console.log("Deploying StakingContract...");
  const StakingContract = await ethers.getContractFactory("StakingContract");
  const stakingContract = await StakingContract.deploy(
    ETH_TOKEN_ADDRESS,
    SBFT_TOKEN_ADDRESS
  );

  await stakingContract.waitForDeployment();
  const stakingAddress = await stakingContract.getAddress();
  
  console.log("✅ StakingContract deployed to:", stakingAddress);
  console.log("");

  // Set Master NFT if address is provided
  if (MASTER_NFT_ADDRESS && MASTER_NFT_ADDRESS !== "") {
    console.log("Setting Master NFT address...");
    const tx = await stakingContract.setMasterNFT(MASTER_NFT_ADDRESS);
    await tx.wait();
    console.log("✅ Master NFT address set successfully");
    console.log("");
  } else {
    console.log("⚠️  Master NFT address not set. You can set it later using setMasterNFT()");
    console.log("");
  }

  // Verify contract parameters
  console.log("Contract Parameters:");
  console.log("- Staking Fee:", (await stakingContract.STAKING_FEE()).toString(), "basis points (1%)");
  console.log("- Minimum Stake:", ethers.formatEther(await stakingContract.MIN_STAKE()), "tokens");
  console.log("- Unstaking Delay:", (await stakingContract.unstakingDelay()).toString(), "seconds (7 days)");
  console.log("- Annual Reward Rate:", (await stakingContract.annualRewardRate()).toString(), "basis points (8%)");
  console.log("- Initial Exchange Rate:", ethers.formatEther(await stakingContract.getExchangeRate()), "ETH per sbFT");
  console.log("");

  // Deployment summary
  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("StakingContract:", stakingAddress);
  console.log("ETH Token:", ETH_TOKEN_ADDRESS);
  console.log("sbFT Token:", SBFT_TOKEN_ADDRESS);
  console.log("Master NFT:", MASTER_NFT_ADDRESS || "(not set)");
  console.log("=".repeat(60));
  console.log("");

  // Next steps
  console.log("NEXT STEPS:");
  console.log("1. Grant MINTER_ROLE to StakingContract on sbFT token:");
  console.log(`   sbFTToken.grantRole(MINTER_ROLE, "${stakingAddress}")`);
  console.log("");
  console.log("2. Grant BURNER_ROLE to StakingContract on sbFT token:");
  console.log(`   sbFTToken.grantRole(BURNER_ROLE, "${stakingAddress}")`);
  console.log("");
  if (!MASTER_NFT_ADDRESS || MASTER_NFT_ADDRESS === "") {
    console.log("3. Set Master NFT address when available:");
    console.log(`   stakingContract.setMasterNFT(MASTER_NFT_ADDRESS)`);
    console.log("");
  }
  console.log("4. Verify contract on block explorer (if applicable):");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${stakingAddress} "${ETH_TOKEN_ADDRESS}" "${SBFT_TOKEN_ADDRESS}"`);
  console.log("");

  // Save deployment info to file
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      StakingContract: stakingAddress,
      ETHToken: ETH_TOKEN_ADDRESS,
      sbFTToken: SBFT_TOKEN_ADDRESS,
      MasterNFT: MASTER_NFT_ADDRESS || null
    }
  };

  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  fs.mkdirSync('./deployments', { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", deploymentPath);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
  });