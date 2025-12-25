import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-ignition";
import * as dotenv from "dotenv";

dotenv.config();

// Helper to validate and format private key
function getPrivateKey(): string[] {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) return [];
  
  // Remove 0x prefix if present, then validate hex
  const cleanPk = pk.startsWith("0x") ? pk.slice(2) : pk;
  if (cleanPk.length !== 64 || !/^[0-9a-fA-F]+$/.test(cleanPk)) {
    return [];
  }
  
  return [`0x${cleanPk}`];
}

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID",
      accounts: getPrivateKey(),
    },
    mantleMainnet: {
      type: "http",
      url: process.env.MANTLE_MAINNET_RPC_URL || "https://rpc.mantle.xyz",
      chainId: 5000,
      accounts: getPrivateKey(),
    },
    mantleTestnet: {
      type: "http",
      url: process.env.MANTLE_TESTNET_RPC_URL || "https://rpc.testnet.mantle.xyz",
      chainId: 5001,
      accounts: getPrivateKey(),
    },
  },
};

export default config;