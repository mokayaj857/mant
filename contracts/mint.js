const hre = require("hardhat");

async function main() {
  const coreAddress = "DEPLOYED_CORE_ADDRESS"; 
  const core = await hre.ethers.getContractAt("AvaraCore", coreAddress);

  await core.issueTicket(
    "0xYourWalletHere",
    "ipfs://ticketMetadata"
  );

  await core.issuePOAP(
    "0xYourWalletHere",
    "ipfs://poapMetadata"
  );

  console.log("Sample NFT minted!");
}

main();