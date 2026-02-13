import { expect } from "chai";
import { ethers } from "hardhat";
import { CultRegistry } from "../typechain-types";

describe("CultRegistry", function () {
  let registry: CultRegistry;
  let owner: any;
  let agent1: any;
  let agent2: any;
  let follower1: any;

  beforeEach(async function () {
    [owner, agent1, agent2, follower1] = await ethers.getSigners();
    const CultRegistry = await ethers.getContractFactory("CultRegistry");
    registry = await CultRegistry.deploy();
  });

  describe("registerCult", function () {
    it("should register a new cult", async function () {
      const tx = await registry.connect(agent1).registerCult(
        "Church of the Eternal Candle",
        "You are a mystical market prophet",
        ethers.ZeroAddress,
        { value: ethers.parseEther("0.1") }
      );
      await tx.wait();

      const cult = await registry.getCult(0);
      expect(cult.name).to.equal("Church of the Eternal Candle");
      expect(cult.leader).to.equal(agent1.address);
      expect(cult.treasuryBalance).to.equal(ethers.parseEther("0.1"));
      expect(cult.active).to.be.true;
    });

    it("should increment cult IDs", async function () {
      await registry.connect(agent1).registerCult("Cult A", "prompt A", ethers.ZeroAddress);
      await registry.connect(agent2).registerCult("Cult B", "prompt B", ethers.ZeroAddress);
      expect(await registry.getTotalCults()).to.equal(2);
    });
  });

  describe("joinCult", function () {
    it("should track followers", async function () {
      await registry.connect(agent1).registerCult("Test Cult", "prompt", ethers.ZeroAddress);
      await registry.connect(follower1).joinCult(0);
      const cult = await registry.getCult(0);
      expect(cult.followerCount).to.equal(1);
    });
  });

  describe("recordRaid", function () {
    it("should record raid results and transfer treasury", async function () {
      await registry.connect(agent1).registerCult("Attacker", "prompt", ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });
      await registry.connect(agent2).registerCult("Defender", "prompt", ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      // Owner records raid - attacker wins 0.5 MON
      await registry.recordRaid(0, 1, true, ethers.parseEther("0.5"));

      const attacker = await registry.getCult(0);
      const defender = await registry.getCult(1);
      expect(attacker.raidWins).to.equal(1);
      expect(defender.raidLosses).to.equal(1);
      expect(attacker.treasuryBalance).to.equal(ethers.parseEther("1.5"));
      expect(defender.treasuryBalance).to.equal(ethers.parseEther("0.5"));
    });

    it("should only allow owner to record raids", async function () {
      await registry.connect(agent1).registerCult("A", "p", ethers.ZeroAddress);
      await registry.connect(agent2).registerCult("B", "p", ethers.ZeroAddress);
      await expect(
        registry.connect(agent1).recordRaid(0, 1, true, 100)
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("prophecies", function () {
    it("should create and resolve prophecies", async function () {
      await registry.connect(agent1).registerCult("Prophet Cult", "prompt", ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      // Owner creates prophecy on behalf
      await registry.createProphecy(0, "ETH to 10k by EOW", Math.floor(Date.now() / 1000) + 86400);

      // Resolve as correct with 1.5x multiplier
      await registry.resolveProphecy(0, true, 150);

      const cult = await registry.getCult(0);
      // 1 ETH + 50% bonus = 1.5 ETH
      expect(cult.treasuryBalance).to.equal(ethers.parseEther("1.5"));
    });
  });

  describe("getAllCults", function () {
    it("should return all cults", async function () {
      await registry.connect(agent1).registerCult("A", "p", ethers.ZeroAddress);
      await registry.connect(agent2).registerCult("B", "p", ethers.ZeroAddress);
      const all = await registry.getAllCults();
      expect(all.length).to.equal(2);
    });
  });
});
