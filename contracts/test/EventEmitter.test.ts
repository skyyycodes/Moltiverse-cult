import { expect } from "chai";
import { ethers } from "hardhat";

describe("EventEmitter", function () {
    let emitter: any;
    let owner: any;
    let other: any;

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        const EventEmitter = await ethers.getContractFactory("EventEmitter");
        emitter = await EventEmitter.deploy();
        await emitter.waitForDeployment();
    });

    describe("emitEvent", function () {
        it("should emit and store a single event", async function () {
            await emitter.emitEvent(0, 1, "raid_initiated", '{"attacker":0,"defender":1}');

            const event = await emitter.getGameEvent(0);
            expect(event.category).to.equal(0); // RAID
            expect(event.cultId).to.equal(1);
            expect(event.eventType).to.equal("raid_initiated");
            expect(await emitter.getTotalEvents()).to.equal(1);
        });

        it("should track per-cult event counts", async function () {
            await emitter.emitEvent(0, 0, "raid_win", "{}");
            await emitter.emitEvent(1, 0, "proposal_created", "{}");
            await emitter.emitEvent(0, 1, "raid_loss", "{}");

            expect(await emitter.getCultEventCount(0)).to.equal(2);
            expect(await emitter.getCultEventCount(1)).to.equal(1);
        });

        it("should track per-category counts", async function () {
            await emitter.emitEvent(0, 0, "raid_a", "{}"); // RAID
            await emitter.emitEvent(0, 1, "raid_b", "{}"); // RAID
            await emitter.emitEvent(2, 0, "transfer", "{}"); // ECONOMY

            expect(await emitter.getCategoryCount(0)).to.equal(2); // RAID
            expect(await emitter.getCategoryCount(2)).to.equal(1); // ECONOMY
        });

        it("should only allow owner", async function () {
            await expect(
                emitter.connect(other).emitEvent(0, 0, "hack", "{}")
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("emitBatch", function () {
        it("should emit multiple events in one tx", async function () {
            await emitter.emitBatch(
                [0, 1, 2],          // categories
                [0, 1, 0],          // cultIds
                ["raid", "vote", "transfer"],
                ['{"a":1}', '{"b":2}', '{"c":3}']
            );

            expect(await emitter.getTotalEvents()).to.equal(3);
            expect(await emitter.getCultEventCount(0)).to.equal(2);
            expect(await emitter.getCultEventCount(1)).to.equal(1);
        });

        it("should reject mismatched arrays", async function () {
            await expect(
                emitter.emitBatch([0, 1], [0], ["raid"], ["{}"])
            ).to.be.revertedWith("Array length mismatch");
        });
    });
});
