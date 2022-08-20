import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v0.31.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
  name: "Ensure that deployment setting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer");
    if (!deployer) throw new Error("deployer not found");
    const res = await chain.callReadOnlyFn("wei-coin", "get-balances", [
      types.principal(deployer.address),
    ], deployer.address);
    assertEquals(res.result.expectOk(), types.uint(100_000_000n));
  },
});

Clarinet.test({
  name: "Ensure that stake successfully",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer");
    if (!deployer) throw new Error("deployer not found");
    const amount = 1000;

    let block = chain.mineBlock([
      Tx.contractCall(
        "stake-coin-registry",
        "stake",
        [types.uint(amount)],
        deployer.address,
      ),
    ]);
    assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    const res = await chain.callReadOnlyFn(
      "stake-coin-registry",
      "get-stake-amount",
      [types.principal(deployer.address)],
      deployer.address,
    );
    assertEquals(res.result.expectOk(), types.uint(amount));
  },
});

Clarinet.test({
  name: "Ensure that unstake successfully",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer");
    if (!deployer) throw new Error("deployer not found");
    const amount = 1000;

    let block = chain.mineBlock([
      Tx.contractCall(
        "stake-coin-registry",
        "stake",
        [types.uint(amount)],
        deployer.address,
      ),
    ]);
    assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    block = chain.mineBlock([
      Tx.contractCall(
        "stake-coin-registry",
        "unstake",
        [types.uint(amount)],
        deployer.address,
      ),
    ]);
    assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    const res = await chain.callReadOnlyFn(
      "stake-coin-registry",
      "get-stake-amount",
      [types.principal(deployer.address)],
      deployer.address,
    );
    assertEquals(res.result.expectOk(), types.uint(0));
  },
});

Clarinet.test({
  name: "Ensure that reward is correct",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer");
    if (!deployer) throw new Error("deployer not found");
    const amount = 1000;

    let block = chain.mineBlock([
      Tx.contractCall(
        "stake-coin-registry",
        "stake",
        [types.uint(amount)],
        deployer.address,
      ),
    ]);
    assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    block = chain.mineBlock([
      Tx.contractCall(
        "stake-coin-registry",
        "unstake",
        [types.uint(amount)],
        deployer.address,
      ),
    ]);
    assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    const res = await chain.callReadOnlyFn(
      "stake-coin-registry",
      "get-stored-reward",
      [types.principal(deployer.address)],
      deployer.address,
    );
    const reward = 1 * 3 * amount;
    assertEquals(res.result.expectOk(), types.uint(reward));
  },
});

Clarinet.test({
  name: "Ensure that claim reward sccessfully",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer");
    if (!deployer) throw new Error("deployer not found");
    const amount = 1000n;
    const originalAmount = 100_000_000n;
    let block = chain.mineBlock([
      Tx.contractCall(
        "stake-coin-registry",
        "stake",
        [types.uint(amount)],
        deployer.address,
      ),
    ]);
    assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    block = chain.mineBlock([
      Tx.contractCall(
        "stake-coin-registry",
        "unstake",
        [types.uint(amount)],
        deployer.address,
      ),
    ]);
    assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    const reward = 1n * 3n * amount;
    block = chain.mineBlock([
        Tx.contractCall(
          "stake-coin-registry",
          "claim-reward",
          [types.uint(reward)],
          deployer.address,
        ),
      ]);
      assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
    
    const res = await chain.callReadOnlyFn(
      "wei-coin",
      "get-balances",
      [types.principal(deployer.address)],
      deployer.address,
    );
    assertEquals(res.result.expectOk(), types.uint(originalAmount+reward));
  },
});
