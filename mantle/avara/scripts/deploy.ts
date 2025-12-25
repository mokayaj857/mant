import hre from "hardhat";

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

async function main() {
  const rpcUrl = process.env.SEPOLIA_URL;
  if (!rpcUrl) {
    throw new Error("SEPOLIA_URL missing in .env");
  }

  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("PRIVATE_KEY missing in .env");
  }

  const privateKey = (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const deployerAddress = account.address;
  console.log("Deploying contracts with the account:", deployerAddress);

  const balance = await publicClient.getBalance({ address: deployerAddress });
  console.log("Account balance:", balance.toString());

  // Get KRNL signer address from env or use deployer as fallback
  const krnlSigner = process.env.KRNL_SIGNER || deployerAddress;
  console.log("KRNL Signer address:", krnlSigner);

  // Deploy AvaraCore - it will deploy POAPNFT and TicketNFT internally
  console.log("\nDeploying AvaraCore (this will also deploy POAPNFT and TicketNFT)...");
  const avaraArtifact = await hre.artifacts.readArtifact("AvaraCore");
  const deployHash = await walletClient.deployContract({
    abi: avaraArtifact.abi,
    bytecode: avaraArtifact.bytecode as `0x${string}`,
    args: [krnlSigner as `0x${string}`],
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

  const onchainKrnlSigner = await publicClient.readContract({
    address: avaraCoreAddress,
    abi: avaraArtifact.abi,
    functionName: "krnlSigner",
  });

  console.log("POAPNFT owner:", poapOwner);
  console.log("TicketNFT owner:", ticketOwner);
  console.log("KRNL Signer:", onchainKrnlSigner);
  
  // Save deployment info
  const chainId = await publicClient.getChainId();
  const deploymentInfo = {
    chainId: chainId.toString(),
    deployer: deployerAddress,
    contracts: {
      AvaraCore: avaraCoreAddress,
      POAPNFT: poapNFTAddress,
      TicketNFT: ticketNFTAddress,
      KRNL_SIGNER: krnlSigner
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
