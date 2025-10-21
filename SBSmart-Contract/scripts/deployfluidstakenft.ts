import { ethers } from "hardhat";
import { FluidStakeNFT } from "../typechain-types/contracts/core/FluidStakeNFT.sol";

async function main() {
  console.log("🚀 Starting FluidStakeNFT deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Contract configuration
  const NFT_NAME = "Fluid Stake Master NFT";
  const NFT_SYMBOL = "FSNFT";
  
  // ⚠️ IMPORTANT: Replace these addresses with your actual deployed contract addresses
  const ETH_TOKEN_ADDRESS = ""; // Replace with your ETH token address (e.g., WETH)
  const SBFT_TOKEN_ADDRESS = ""; // Replace with your sbFT token address
  
  // ⚠️ IMPORTANT: Replace with your actual IPFS URI from Pinata
  const TOKEN_URI = "https://ipfs.io/ipfs/YOUR_IPFS_HASH"; // Replace with your actual IPFS URI
  
  console.log("\n📋 NFT Configuration:");
  console.log(`   Name: ${NFT_NAME}`);
  console.log(`   Symbol: ${NFT_SYMBOL}`);
  console.log(`   ETH Token: ${ETH_TOKEN_ADDRESS}`);
  console.log(`   sbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  console.log(`   Token URI: ${TOKEN_URI}`);
  
  // Validation checks
  if (ETH_TOKEN_ADDRESS === "" || ETH_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ Please set the ETH_TOKEN_ADDRESS to your deployed ETH token address");
    process.exit(1);
  }
  
  if (SBFT_TOKEN_ADDRESS === "" || SBFT_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ Please set the SBFT_TOKEN_ADDRESS to your deployed sbFT token address");
    process.exit(1);
  }
  
  if (TOKEN_URI === "https://ipfs.io/ipfs/YOUR_IPFS_HASH" || TOKEN_URI === "") {
    console.error("❌ Please set the TOKEN_URI to your actual IPFS URI from Pinata");
    process.exit(1);
  }
  
  // Deploy the contract
  console.log("\n⏳ Deploying FluidStakeNFT contract...");
  const FluidStakeFactory = await ethers.getContractFactory("FluidStakeNFT");
  
  const fluidStakeNFT = await FluidStakeFactory.deploy(
    NFT_NAME,
    NFT_SYMBOL,
    ETH_TOKEN_ADDRESS,
    SBFT_TOKEN_ADDRESS,
    TOKEN_URI
  ) as FluidStakeNFT;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await fluidStakeNFT.waitForDeployment();
  
  const contractAddress = await fluidStakeNFT.getAddress();
  console.log(`✅ FluidStakeNFT deployed to: ${contractAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await fluidStakeNFT.name();
  const symbol = await fluidStakeNFT.symbol();
  const ethToken = await fluidStakeNFT.ethToken();
  const sbftToken = await fluidStakeNFT.sbftToken();
  const nftMinted = await fluidStakeNFT.nftMinted();
  const currentRound = await fluidStakeNFT.currentRound();
  
  console.log("📊 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   ETH Token: ${ethToken}`);
  console.log(`   sbFT Token: ${sbftToken}`);
  console.log(`   NFT Minted: ${nftMinted}`);
  console.log(`   Current Round: ${currentRound}`);
  console.log(`   Owner: ${deployer.address}`);
  
  // Test mint Master NFT
  console.log("\n🧪 Testing Master NFT mint...");
  const mintTx = await fluidStakeNFT.mintMasterNFT(deployer.address);
  await mintTx.wait();
  
  const nftMintedAfter = await fluidStakeNFT.nftMinted();
  const tokenURI = await fluidStakeNFT.tokenURI(1);
  
  console.log(`✅ Master NFT minted! NFT Status: ${nftMintedAfter}`);
  console.log(`📸 Token URI: ${tokenURI}`);
  
  // Check distribution status
  const isDistributionDue = await fluidStakeNFT.isDistributionDue();
  const timeUntilNext = await fluidStakeNFT.getTimeUntilNextDistribution();
  
  console.log(`🔄 Distribution Due: ${isDistributionDue}`);
  console.log(`⏰ Time until next distribution: ${timeUntilNext.toString()} seconds`);
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentTx = fluidStakeNFT.deploymentTransaction();
  
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    nftName: name,
    nftSymbol: symbol,
    ethTokenAddress: ethToken,
    sbftTokenAddress: sbftToken,
    tokenURI: tokenURI,
    nftMinted: nftMintedAfter,
    deploymentTime: new Date().toISOString(),
    transactionHash: deploymentTx?.hash || "N/A"
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`NFT: ${deploymentInfo.nftName} (${deploymentInfo.nftSymbol})`);
  console.log(`ETH Token: ${deploymentInfo.ethTokenAddress}`);
  console.log(`sbFT Token: ${deploymentInfo.sbftTokenAddress}`);
  console.log(`Token URI: ${deploymentInfo.tokenURI}`);
  console.log(`NFT Minted: ${deploymentInfo.nftMinted}`);
  console.log(`Transaction Hash: ${deploymentInfo.transactionHash}`);
  console.log(`Deployment Time: ${deploymentInfo.deploymentTime}`);
  console.log("================================");
  
  // Save to file for future reference
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `fluidstake-nft-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 FluidStakeNFT deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Verify the contract on the explorer if needed");
  console.log("2. Set the staking contract address using setStakingContract()");
  console.log("3. Test the revenue distribution functionality");
  console.log("4. View your NFT metadata at the Token URI");
  console.log("\n🔗 Important Contract Functions:");
  console.log("- setStakingContract(address): Set your staking contract");
  console.log("- distributeFees(uint256): Receive fees from staking");
  console.log("- distributeRevenue(): Distribute weekly rewards");
  console.log("- claimRewards(uint256[]): Claim rewards for specific rounds");
  
  return {
    contract: fluidStakeNFT,
    address: contractAddress,
    deploymentInfo
  };
}

// Handle errors
main()
  .then((result) => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });