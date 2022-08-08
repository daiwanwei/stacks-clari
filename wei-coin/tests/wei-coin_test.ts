
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const contractName="wei-coin";

Clarinet.test({
    name: "Ensure that wei coin name",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer");
        if (!deployer) {
            console.log(`not found deployer`)
            return
        }
        const res=await chain.callReadOnlyFn(contractName,"get-name",[],deployer.address)
        res.result.expectOk().expectAscii("Wei Coin")
    },
});

Clarinet.test({
    name: "Ensure that wei coin symbol",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer");
        if (!deployer) {
            console.log(`not found deployer`)
            return
        }
        const res=await chain.callReadOnlyFn(contractName,"get-symbol",[],deployer.address)
        res.result.expectOk().expectAscii("WC")
    },
});
