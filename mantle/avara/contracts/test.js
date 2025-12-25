const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AvaraCore", function () {
  it("deploys and mints NFTs", async function () {

    const AvaraCore = await ethers.getContractFactory("AvaraCore");
    const core = await AvaraCore.deploy();
    await core.deployTokens(true);

    const [owner] = await ethers.getSigners();

    const ticketTx = await core.issueTicket(owner.address, "uri1");
    expect(ticketTx).to.not.be.null;

    const poapTx = await core.issuePOAP(owner.address, "uri2");
    expect(poapTx).to.not.be.null;
  });
});
