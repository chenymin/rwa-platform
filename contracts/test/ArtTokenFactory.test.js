const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtTokenFactory", function () {
  it("should create new art token", async function () {
    const [owner, artist, platform] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ArtTokenFactory");
    const factory = await Factory.deploy(platform.address);

    const tx = await factory.createArtToken(
      "Starry Night",
      "STAR",
      ethers.parseEther("10000"),
      "ipfs://QmArt1",
      artist.address
    );

    const receipt = await tx.wait();
    const event = receipt?.logs.find(
      (log) => log.eventName === "TokenCreated"
    );

    expect(event).to.not.be.undefined;
  });

  it("should distribute tokens 80/20", async function () {
    const [owner, artist, platform] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ArtTokenFactory");
    const factory = await Factory.deploy(platform.address);

    const tx = await factory.createArtToken(
      "Test Art",
      "TEST",
      ethers.parseEther("10000"),
      "ipfs://test",
      artist.address
    );

    const receipt = await tx.wait();
    const tokenAddress = receipt?.logs[0].address;

    const ArtToken = await ethers.getContractFactory("ArtToken");
    const token = ArtToken.attach(tokenAddress);

    expect(await token.balanceOf(artist.address)).to.equal(
      ethers.parseEther("8000")
    );
    expect(await token.balanceOf(platform.address)).to.equal(
      ethers.parseEther("2000")
    );
  });

  it("should only allow owner to create tokens", async function () {
    const [owner, notOwner, platform] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ArtTokenFactory");
    const factory = await Factory.deploy(platform.address);

    await expect(
      factory.connect(notOwner).createArtToken(
        "Test",
        "TEST",
        ethers.parseEther("1000"),
        "ipfs://test",
        notOwner.address
      )
    ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
  });

  it("should track all created tokens", async function () {
    const [owner, artist, platform] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ArtTokenFactory");
    const factory = await Factory.deploy(platform.address);

    await factory.createArtToken("Art1", "ART1", ethers.parseEther("1000"), "ipfs://1", artist.address);
    await factory.createArtToken("Art2", "ART2", ethers.parseEther("2000"), "ipfs://2", artist.address);

    const tokens = await factory.getAllTokens();
    expect(tokens.length).to.equal(2);
  });
});
