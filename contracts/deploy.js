const hre = require("hardhat");

async function main() {
  const AvaraCore = await hre.ethers.getContractFactory("AvaraCore");
  const core = await AvaraCore.deploy();

  await core.waitForDeployment();
  console.log("AvaraCore deployed:", await core.getAddress());

  // Auto-deploy NFT contracts
  const tx = await core.deployTokens(true); // true = soulbound POAP
  await tx.wait();

  console.log("TicketNFT:", await core.ticketContract());
  console.log("POAPNFT:", await core.poapContract());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
