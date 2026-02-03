const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtToken", function () {
  it("should deploy with correct name, symbol, and supply", async function () {
    const ArtToken = await ethers.getContractFactory("ArtToken");
    const artToken = await ArtToken.deploy(
      "Mona Lisa Shares",
      "MLS",
      ethers.parseEther("10000"),
      "ipfs://QmTest123"
    );

    expect(await artToken.name()).to.equal("Mona Lisa Shares");
    expect(await artToken.symbol()).to.equal("MLS");
    expect(await artToken.totalSupply()).to.equal(ethers.parseEther("10000"));
    expect(await artToken.metadataURI()).to.equal("ipfs://QmTest123");
  });

  it("should mint total supply to deployer", async function () {
    const [deployer] = await ethers.getSigners();
    const ArtToken = await ethers.getContractFactory("ArtToken");
    const artToken = await ArtToken.deploy(
      "Test Art",
      "TEST",
      ethers.parseEther("1000"),
      "ipfs://test"
    );

    expect(await artToken.balanceOf(deployer.address)).to.equal(
      ethers.parseEther("1000")
    );
  });

  it("should allow transfers", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const ArtToken = await ethers.getContractFactory("ArtToken");
    const artToken = await ArtToken.deploy(
      "Test Art",
      "TEST",
      ethers.parseEther("1000"),
      "ipfs://test"
    );

    await artToken.transfer(addr1.address, ethers.parseEther("100"));
    expect(await artToken.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
  });
});
