import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import hardhatVerify from "@nomicfoundation/hardhat-verify";  
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config: HardhatUserConfig = {

  solidity: {
    compilers: [
      {
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    base_testnet: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://rpc.testnet.ms",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: parseInt(process.env.BASE_TESTNET_CHAIN_ID || "4157"),
      gasPrice: "auto",
      gas: "auto",
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v5",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;