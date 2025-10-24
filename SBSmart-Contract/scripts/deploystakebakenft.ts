import { ethers } from "hardhat";
import { StakeAndBakeNFT } from "../typechain-types/contracts/core/StakeAndBakeNFT.sol";

async function main() {
  console.log("🚀 Starting StakeAndBakeNFT deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");
  
  // Contract configuration
  const NFT_NAME = "Stake and Bake Master NFT";
  const NFT_SYMBOL = "SBNFT";
  
  // ⚠️ IMPORTANT: Replace these addresses with your actual deployed contract addresses
  const SBFT_TOKEN_ADDRESS = "0x0c4464F238909ad9c8B5748EAF90e49A505EcdA6"; // Replace with your sbFT token address
  
  // ⚠️ IMPORTANT: Replace with your actual IPFS URI from Pinata
  const TOKEN_URI = "https://ipfs.io/ipfs/bafkreibki2gkw3mqs6emnoqlddxsobkhg5ntlet3273izcn6hlt5xo6odu"; // Replace with your actual IPFS URI
  
  console.log("\n📋 NFT Configuration:");
  console.log(`   Name: ${NFT_NAME}`);
  console.log(`   Symbol: ${NFT_SYMBOL}`);
  console.log(`   sbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  console.log(`   Token URI: ${TOKEN_URI}`);
  
  // Deploy the contract
  console.log("\n⏳ Deploying StakeAndBakeNFT contract...");
  const StakeAndBakeNFTFactory = await ethers.getContractFactory("StakeAndBakeNFT");
  
  const stakeAndBakeNFT = await StakeAndBakeNFTFactory.deploy(
    NFT_NAME,
    NFT_SYMBOL,
    SBFT_TOKEN_ADDRESS,
    TOKEN_URI
  ) as StakeAndBakeNFT;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await stakeAndBakeNFT.deployed();
  
  const contractAddress = stakeAndBakeNFT.address;
  console.log(`✅ StakeAndBakeNFT deployed to: ${contractAddress}`);
  
  // Wait for additional confirmations before verification
  console.log("\n⏳ Waiting for block confirmations...");
  await stakeAndBakeNFT.deployTransaction.wait(5); // Wait for 5 confirmations
  console.log("✅ Confirmations received");
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await stakeAndBakeNFT.name();
  const symbol = await stakeAndBakeNFT.symbol();
  // const xfiToken = await stakeAndBakeNFT.xfiToken();
  const sbftToken = await stakeAndBakeNFT.sbftToken();
  const nftMinted = await stakeAndBakeNFT.nftMinted();
  const currentRound = await stakeAndBakeNFT.currentRound();
  
  console.log("📊 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  // console.log(`   XFI Token: ${xfiToken}`);
  console.log(`   sbFT Token: ${sbftToken}`);
  console.log(`   NFT Minted: ${nftMinted}`);
  console.log(`   Current Round: ${currentRound}`);
  console.log(`   Owner: ${deployer.address}`);
  
  // Test mint Master NFT
  console.log("\n🧪 Testing Master NFT mint...");
  const mintTx = await stakeAndBakeNFT.mintMasterNFT(deployer.address);
  await mintTx.wait();
  
  const nftMintedAfter = await stakeAndBakeNFT.nftMinted();
  const tokenURI = await stakeAndBakeNFT.tokenURI(1);
  
  console.log(`✅ Master NFT minted! NFT Status: ${nftMintedAfter}`);
  console.log(`📸 Token URI: ${tokenURI}`);
  
  // Check distribution status
  const isDistributionDue = await stakeAndBakeNFT.isDistributionDue();
  const timeUntilNext = await stakeAndBakeNFT.getTimeUntilNextDistribution();
  
  console.log(`🔄 Distribution Due: ${isDistributionDue}`);
  console.log(`⏰ Time until next distribution: ${timeUntilNext.toString()} seconds`);
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    nftName: name,
    nftSymbol: symbol,
    // xfiTokenAddress: xfiToken,
    sbftTokenAddress: sbftToken,
    tokenURI: tokenURI,
    nftMinted: nftMintedAfter,
    deploymentTime: new Date().toISOString(),
    transactionHash: stakeAndBakeNFT.deployTransaction.hash,
    constructorArgs: {
      name: NFT_NAME,
      symbol: NFT_SYMBOL,
      sbftToken: SBFT_TOKEN_ADDRESS,
      tokenURI: TOKEN_URI
    }
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`NFT: ${deploymentInfo.nftName} (${deploymentInfo.nftSymbol})`);
  // console.log(`XFI Token: ${deploymentInfo.xfiTokenAddress}`);
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
  
  const deploymentFile = path.join(deploymentsDir, `stakeandbake-nft-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);
  
  // Verify contract on block explorer
  console.log("\n🔍 Starting contract verification...");
  try {
    const hre = require("hardhat");
    
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        NFT_NAME,
        NFT_SYMBOL,
        SBFT_TOKEN_ADDRESS,
        TOKEN_URI
      ],
    });
    
    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("ℹ️  Contract is already verified");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("\n💡 You can verify manually later using:");
      console.log(`npx hardhat verify --network <network-name> ${contractAddress} "${NFT_NAME}" "${NFT_SYMBOL}" "${SBFT_TOKEN_ADDRESS}" "${TOKEN_URI}"`);
    }
  }
  
  console.log("\n🎉 StakeAndBakeNFT deployment completed successfully!");
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
    contract: stakeAndBakeNFT,
    address: contractAddress,
    deploymentInfo
  };
}

// Handle errors
main()
  .then((result) => {
    console.log("\n✅ Script completed successfully!");
    console.log(`📄 StakeAndBakeNFT Address: ${result.address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });