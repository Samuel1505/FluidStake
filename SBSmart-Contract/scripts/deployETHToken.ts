import { ethers } from "hardhat";
import { ETHToken } from "../typechain-types/contracts/tokens/EthToken.sol";

async function main() {
  console.log("🚀 Starting EthToken deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  // Token configuration
  const TOKEN_NAME = "Ethereum Token";
  const TOKEN_SYMBOL = "ETH";
  const INITIAL_SUPPLY = 1000000; // 1 million tokens
  
  console.log("\n📋 Token Configuration:");
  console.log(`   Name: ${TOKEN_NAME}`);
  console.log(`   Symbol: ${TOKEN_SYMBOL}`);
  console.log(`   Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} tokens`);
  
  // Deploy the contract
  console.log("\n⏳ Deploying EthToken contract...");
  const ETHTokenFactory = await ethers.getContractFactory("ETHToken");
  
  const EthToken = await ETHTokenFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    INITIAL_SUPPLY
  ) as EthToken;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await EthToken.deployed();
  
  const contractAddress = EthToken.address;
  console.log(`✅ EthToken deployed to: ${contractAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await EthToken.name();
  const symbol = await EthToken.symbol();
  const decimals = await EthToken.decimals();
  const totalSupply = await EthToken.totalSupply();
  const ownerBalance = await EthToken.balanceOf(deployer.address);
  
  console.log("📊 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} ${symbol}`);
  console.log(`   Owner Balance: ${ethers.utils.formatEther(ownerBalance)} ${symbol}`);
  console.log(`   Owner Address: ${deployer.address}`);
  
  // Test mint function (optional)
  console.log("\n🧪 Testing mint function...");
  const testMintAmount = ethers.utils.parseEther("1000"); // 1000 tokens
  const mintTx = await EthToken.mint(deployer.address, testMintAmount);
  await mintTx.wait();
  
  const newBalance = await EthToken.balanceOf(deployer.address);
  const newTotalSupply = await EthToken.totalSupply();
  console.log(`✅ Minted 1000 tokens. New balance: ${ethers.utils.formatEther(newBalance)} ${symbol}`);
  console.log(`📈 New Total Supply: ${ethers.utils.formatEther(newTotalSupply)} ${symbol}`);
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentTx = EthToken.deploymentTransaction();
  
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    tokenName: name,
    tokenSymbol: symbol,
    decimals: decimals.toString(),
    initialSupply: ethers.utils.formatEther(totalSupply),
    currentSupply: ethers.utils.formatEther(newTotalSupply),
    deploymentTime: new Date().toISOString(),
    transactionHash: deploymentTx?.hash || "N/A"
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`Token: ${deploymentInfo.tokenName} (${deploymentInfo.tokenSymbol})`);
  console.log(`Initial Supply: ${deploymentInfo.initialSupply} ${deploymentInfo.tokenSymbol}`);
  console.log(`Current Supply: ${deploymentInfo.currentSupply} ${deploymentInfo.tokenSymbol}`);
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
  
  const deploymentFile = path.join(deploymentsDir, `eth-token-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 EthToken deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Verify the contract on the explorer if needed");
  console.log("2. Test the contract functions (transfer, mint, burn)");
  console.log("3. Use this token address in your FluidStake protocol");
  console.log("\n🔗 Important Contract Functions:");
  console.log("- mint(address, uint256): Mint new tokens (owner only)");
  console.log("- burn(uint256): Burn tokens from your balance");
  console.log("- burnFrom(address, uint256): Burn tokens from another address (with approval)");
  console.log("- transfer(address, uint256): Transfer tokens");
  console.log("- approve(address, uint256): Approve spending");
  
  return {
    contract: EthToken,
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