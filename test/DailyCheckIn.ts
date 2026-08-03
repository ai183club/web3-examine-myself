import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("DailyCheckIn", async function () {
  const { viem, networkHelpers } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [firstWallet, secondWallet] = await viem.getWalletClients();

  async function deploy() {
    return viem.deployContract("DailyCheckIn");
  }

  it("starts with a false status for every wallet", async function () {
    const checkIn = await deploy();
    const dayId = await checkIn.read.currentDayId();

    assert.equal(
      await checkIn.read.getStatus([firstWallet.account.address, dayId]),
      false,
    );
  });

  it("records true only for msg.sender", async function () {
    const checkIn = await deploy();
    const dayId = await checkIn.read.currentDayId();

    await checkIn.write.completeToday();

    assert.equal(
      await checkIn.read.getStatus([firstWallet.account.address, dayId]),
      true,
    );
    assert.equal(
      await checkIn.read.getStatus([secondWallet.account.address, dayId]),
      false,
    );
  });

  it("allows any other wallet to complete independently", async function () {
    const checkIn = await deploy();

    const firstHash = await firstWallet.writeContract({
      address: checkIn.address,
      abi: checkIn.abi,
      functionName: "completeToday",
    });
    const secondHash = await secondWallet.writeContract({
      address: checkIn.address,
      abi: checkIn.abi,
      functionName: "completeToday",
    });
    await publicClient.waitForTransactionReceipt({ hash: firstHash });
    await publicClient.waitForTransactionReceipt({ hash: secondHash });

    const dayId = await checkIn.read.currentDayId();
    assert.equal(
      await checkIn.read.getStatus([firstWallet.account.address, dayId]),
      true,
    );
    assert.equal(
      await checkIn.read.getStatus([secondWallet.account.address, dayId]),
      true,
    );
  });

  it("rejects a second completion on the same day", async function () {
    const checkIn = await deploy();

    await checkIn.write.completeToday();
    await assert.rejects(checkIn.write.completeToday(), /AlreadyCompleted/);
  });

  it("allows the same wallet to complete again on the next day", async function () {
    const checkIn = await deploy();
    const firstDayId = await checkIn.read.currentDayId();

    await checkIn.write.completeToday();
    await networkHelpers.time.increase(24 * 60 * 60);

    const secondDayId = await checkIn.read.currentDayId();
    assert.equal(secondDayId, firstDayId + 1n);
    await checkIn.write.completeToday();

    assert.equal(
      await checkIn.read.getStatus([firstWallet.account.address, secondDayId]),
      true,
    );
  });

  it("uses the UTC+8 day calculation", async function () {
    const checkIn = await deploy();
    const block = await publicClient.getBlock();
    const expectedDayId = (block.timestamp + 8n * 60n * 60n) / 86400n;

    assert.equal(await checkIn.read.currentDayId(), expectedDayId);
  });

  it("returns a batch of month statuses", async function () {
    const checkIn = await deploy();
    const startDayId = await checkIn.read.currentDayId();

    await checkIn.write.completeToday();

    assert.deepEqual(
      await checkIn.read.getMonthStatuses([firstWallet.account.address, startDayId, 3n]),
      [true, false, false],
    );
  });
});
