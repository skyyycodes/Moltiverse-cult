import { expect } from "chai";
import { ethers } from "hardhat";

describe("SocialGraph", function () {
    let socialGraph: any;
    let owner: any;
    let other: any;

    beforeEach(async function () {
        [owner, other] = await ethers.getSigners();
        const SocialGraph = await ethers.getContractFactory("SocialGraph");
        socialGraph = await SocialGraph.deploy();
        await socialGraph.waitForDeployment();
    });

    describe("Alliance Formation", function () {
        it("should form an alliance between two cults", async function () {
            const tx = await socialGraph.formAlliance(0, 1, 0, 300); // MUTUAL_DEFENSE, 5 min
            await tx.wait();

            const alliance = await socialGraph.getAlliance(1);
            expect(alliance.cult1Id).to.equal(0);
            expect(alliance.cult2Id).to.equal(1);
            expect(alliance.status).to.equal(0); // ACTIVE
        });

        it("should not allow alliance with self", async function () {
            await expect(
                socialGraph.formAlliance(1, 1, 0, 300),
            ).to.be.revertedWith("Cannot ally with self");
        });

        it("should not allow duplicate active alliances", async function () {
            await socialGraph.formAlliance(0, 1, 0, 300);
            await expect(
                socialGraph.formAlliance(0, 1, 0, 300),
            ).to.be.revertedWith("Already allied");
        });

        it("should normalize cult order (smaller ID first)", async function () {
            await socialGraph.formAlliance(3, 1, 0, 300);
            const alliance = await socialGraph.getAlliance(1);
            expect(alliance.cult1Id).to.equal(1);
            expect(alliance.cult2Id).to.equal(3);
        });

        it("should increase trust on alliance formation", async function () {
            await socialGraph.formAlliance(0, 1, 0, 300);
            const trust01 = await socialGraph.getTrust(0, 1);
            const trust10 = await socialGraph.getTrust(1, 0);
            expect(trust01).to.equal(20);
            expect(trust10).to.equal(20);
        });
    });

    describe("Betrayal", function () {
        it("should break alliance and collapse trust", async function () {
            await socialGraph.formAlliance(0, 1, 0, 300);
            await socialGraph.recordBetrayal(1, 0); // cult 0 betrays

            const alliance = await socialGraph.getAlliance(1);
            expect(alliance.status).to.equal(2); // BROKEN

            const trust01 = await socialGraph.getTrust(0, 1);
            expect(trust01).to.equal(0);
        });

        it("should track betrayal count", async function () {
            await socialGraph.formAlliance(0, 1, 0, 300);
            await socialGraph.recordBetrayal(1, 0);
            expect(await socialGraph.betrayalCount(0)).to.equal(1);
            expect(await socialGraph.totalBetrayals()).to.equal(1);
        });
    });

    describe("Trust Management", function () {
        it("should update trust via events", async function () {
            await socialGraph.setTrust(0, 1, 50);
            expect(await socialGraph.getTrust(0, 1)).to.equal(50);

            await socialGraph.recordTrustEvent(0, 1, "raid_attempt");
            expect(await socialGraph.getTrust(0, 1)).to.equal(0); // 50 - 50 = 0

            await socialGraph.setTrust(2, 3, 30);
            await socialGraph.recordTrustEvent(2, 3, "bribe_honored");
            expect(await socialGraph.getTrust(2, 3)).to.equal(40); // 30 + 10 = 40
        });

        it("should cap trust at 100", async function () {
            await socialGraph.setTrust(0, 1, 95);
            await socialGraph.recordTrustEvent(0, 1, "alliance_formed");
            expect(await socialGraph.getTrust(0, 1)).to.equal(100);
        });
    });

    describe("View Functions", function () {
        it("should check if cults are allied", async function () {
            expect(await socialGraph.areAllied(0, 1)).to.equal(false);
            await socialGraph.formAlliance(0, 1, 0, 300);
            expect(await socialGraph.areAllied(0, 1)).to.equal(true);
            expect(await socialGraph.areAllied(1, 0)).to.equal(true); // order independent
        });
    });

    describe("Membership Approval", function () {
        it("should request and approve membership", async function () {
            await socialGraph.connect(other).requestMembership(0);
            expect(await socialGraph.getPendingMemberCount(0)).to.equal(1);

            await socialGraph.approveMembership(0, other.address);
            expect(await socialGraph.isMember(0, other.address)).to.equal(true);
            expect(await socialGraph.getMemberCount(0)).to.equal(1);
        });

        it("should expel a member", async function () {
            await socialGraph.approveMembership(0, other.address);
            expect(await socialGraph.isMember(0, other.address)).to.equal(true);

            await socialGraph.expelMember(0, other.address, "heresy");
            expect(await socialGraph.isMember(0, other.address)).to.equal(false);
            expect(await socialGraph.getMemberCount(0)).to.equal(0);
        });

        it("should not expel non-members", async function () {
            await expect(
                socialGraph.expelMember(0, other.address, "not_a_member")
            ).to.be.revertedWith("Not a member");
        });
    });

    describe("Secret Alliances", function () {
        it("should form a secret alliance (not publicly visible)", async function () {
            await socialGraph.formSecretAlliance(0, 1, 0, 300);
            // Alliance exists
            expect(await socialGraph.areAllied(0, 1)).to.equal(true);
            // But not public — alliance ID is 1 (first alliance formed via ++nextAllianceId)
            expect(await socialGraph.allianceIsPublic(1)).to.equal(false);
            // Visible to participants
            expect(await socialGraph.isAllianceVisible(1, 0)).to.equal(true);
            expect(await socialGraph.isAllianceVisible(1, 1)).to.equal(true);
            // Not visible to outsiders
            expect(await socialGraph.isAllianceVisible(1, 3)).to.equal(false);
        });

        it("should make secret alliance public", async function () {
            await socialGraph.formSecretAlliance(2, 3, 1, 600);
            const allianceId = await socialGraph.nextAllianceId();

            await socialGraph.makeAlliancePublic(1);
            expect(await socialGraph.allianceIsPublic(1)).to.equal(true);
            // Now visible to everyone
            expect(await socialGraph.isAllianceVisible(1, 5)).to.equal(true);
        });
    });
});
