import hre from "hardhat";

import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

// Define Mantle networks
const mantleMainnet = defineChain({
  id: 5000,
  name: "Mantle Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: "https://explorer.mantle.xyz",
    },
  },
});

const mantleTestnet = defineChain({
  id: 5001,
  name: "Mantle Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Testnet Explorer",
      url: "https://explorer.testnet.mantle.xyz",
    },
  },
});

async function main() {
  // Determine which network to use
  const network = process.env.NETWORK || "mantleTestnet";
  let rpcUrl: string;
  let chain: typeof mantleMainnet | typeof mantleTestnet | typeof sepolia;

  if (network === "mantleMainnet") {
    rpcUrl = process.env.MANTLE_MAINNET_RPC_URL || "https://rpc.mantle.xyz";
    chain = mantleMainnet;
  } else if (network === "mantleTestnet") {
    rpcUrl = process.env.MANTLE_TESTNET_RPC_URL || "https://rpc.testnet.mantle.xyz";
    chain = mantleTestnet;
  } else if (network === "sepolia") {
    rpcUrl = process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID";
    chain = sepolia;
  } else {
    throw new Error(`Unsupported network: ${network}. Use: mantleMainnet, mantleTestnet, or sepolia`);
  }

  if (!rpcUrl) {
    throw new Error(`RPC URL missing for network: ${network}`);
  }

  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("PRIVATE_KEY missing in .env");
  }

  const privateKey = (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  const deployerAddress = account.address;
  console.log(`Deploying contracts to ${network} with the account:`, deployerAddress);

  const balance = await publicClient.getBalance({ address: deployerAddress });
  console.log("Account balance:", balance.toString());

  // Get Mantle signer address from env or use deployer as fallback
  const mantleSigner = process.env.MANTLE_SIGNER || process.env.KRNL_SIGNER || deployerAddress; // Backward compatibility
  console.log("Mantle Signer address:", mantleSigner);

  // Deploy AvaraCore - it will deploy POAPNFT and TicketNFT internally
  console.log("\nDeploying AvaraCore (this will also deploy POAPNFT and TicketNFT)...");
  const avaraArtifact = await hre.artifacts.readArtifact("AvaraCore");
  const deployHash = await walletClient.deployContract({
    abi: avaraArtifact.abi,
    bytecode: avaraArtifact.bytecode as `0x${string}`,
    args: [mantleSigner as `0x${string}`],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const avaraCoreAddress = receipt.contractAddress;
  if (!avaraCoreAddress) {
    throw new Error("Deployment failed: no contractAddress in receipt");
  }
  console.log("AvaraCore deployed to:", avaraCoreAddress);

  // Get the addresses of the deployed NFT contracts from AvaraCore
  const poapNFTAddress = (await publicClient.readContract({
    address: avaraCoreAddress,
    abi: avaraArtifact.abi,
    functionName: "poaps",
  })) as `0x${string}`;

  const ticketNFTAddress = (await publicClient.readContract({
    address: avaraCoreAddress,
    abi: avaraArtifact.abi,
    functionName: "tickets",
  })) as `0x${string}`;
  
  console.log("POAPNFT deployed to:", poapNFTAddress);
  console.log("TicketNFT deployed to:", ticketNFTAddress);

  // Verify ownership (should already be set by constructor)
  console.log("\nVerifying ownership...");
  const poapArtifact = await hre.artifacts.readArtifact("POAPNFT");
  const ticketArtifact = await hre.artifacts.readArtifact("TicketNFT");

  const poapOwner = await publicClient.readContract({
    address: poapNFTAddress,
    abi: poapArtifact.abi,
    functionName: "owner",
  });

  const ticketOwner = await publicClient.readContract({
    address: ticketNFTAddress,
    abi: ticketArtifact.abi,
    functionName: "owner",
  });

  const onchainMantleSigner = await publicClient.readContract({
    address: avaraCoreAddress,
    abi: avaraArtifact.abi,
    functionName: "mantleSigner",
  });

  console.log("POAPNFT owner:", poapOwner);
  console.log("TicketNFT owner:", ticketOwner);
  console.log("Mantle Signer:", onchainMantleSigner);
  
  // Save deployment info
  const chainId = await publicClient.getChainId();
  const deploymentInfo = {
    chainId: chainId.toString(),
    deployer: deployerAddress,
    contracts: {
      AvaraCore: avaraCoreAddress,
      POAPNFT: poapNFTAddress,
      TicketNFT: ticketNFTAddress,
      MANTLE_SIGNER: mantleSigner,
      MANTLE_SIGNER: mantleSigner
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n✅ Deployment complete!");
  console.log("\n📋 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
