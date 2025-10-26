// testStake.ts

import { ethers } from "hardhat";

// --- REPLACE THESE WITH YOUR ACTUAL DEPLOYED ADDRESSES ---
const STAKING_CONTRACT_ADDRESS = "0xC211fD29767f83B8F09bD1FbEDe66Cd97Ac7A942";
const SBFT_TOKEN_ADDRESS = "0x0c4464F238909ad9c8B5748EAF90e49A505EcdA6";
// --------------------------------------------------------

async function main(): Promise<void> {
  console.log("🚀 Starting Staking Contract Interaction Test...\n");

  // 1. Get Signers
  const signers = await ethers.getSigners();
  // Using the second signer as the test user to simulate a wallet interaction
  const testUser = signers[1] || signers[0]; 
  
  console.log(`Test User Address: ${testUser.address}`);
  console.log("═".repeat(50));

  // 2. Define ABIs (minimal for the stake interaction)
  // NOTE: The stake function now requires a uint256 argument in addition to being payable.
  const stakingAbi = [
    "function stake(uint256 _amount) payable",
    "function minStake() view returns (uint256)",
    "function totalETHInPool() view returns (uint256)",
  ];

  const tokenAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
  ];

  // 3. Connect to Contracts
  // We use the testUser to send the transaction
  const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, testUser);
  const sbftToken = new ethers.Contract(SBFT_TOKEN_ADDRESS, tokenAbi, testUser);

  // 4. Setup Test Parameters
  const stakeAmountETH = "0.003"; // The amount you were testing with
  const stakeAmountWei = ethers.utils.parseEther(stakeAmountETH);

  console.log(`Attempting to stake ${stakeAmountETH} ETH...`);
  console.log(`Amount in Wei: ${stakeAmountWei.toString()}`);
  console.log("═".repeat(50));

  // 5. Execute Stake Transaction
  try {
    // The key change: passing the amount as a function argument AND as the transaction value.
    const tx = await stakingContract.stake(
      stakeAmountWei, // The new _amount argument
      { 
        value: stakeAmountWei, // The msg.value (ETH attached to the transaction)
        gasLimit: 500000
      }
    );
    
    console.log(`✅ Transaction sent! Hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log(`✅ Transaction confirmed in block: ${receipt?.blockNumber}`);
    console.log("Stake operation successful!");

    // 6. Verification (Optional but helpful)
    // ... (Verification logic to check balances)
    
  } catch (error: any) {
    console.error("❌ Staking Test Failed:");
    console.error(error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
