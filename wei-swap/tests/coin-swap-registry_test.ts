
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that liquidity amount is correct",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer");
        if (!deployer) {
            console.log(`deployer not found`)
            return
        }
        let res = await chain.callReadOnlyFn(
            "coin-swap-registry","get-reserve",[],deployer.address
            )
        assertEquals(
            res.result.expectOk().expectTuple(),
             {"reserve-x": types.uint(0), "reserve-y": types.uint(0)}
             );
        const amountX=1000
        const amountY=4000
        let block = chain.mineBlock([
           Tx.contractCall(
            "coin-swap-registry",
            "add-liquidity",
            [types.uint(amountX),types.uint(amountY)],
            deployer.address
            ),
        ]);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        res =await chain.callReadOnlyFn(
            "coin-swap-registry","get-reserve",[],deployer.address
            )
        assertEquals(
            res.result.expectOk().expectTuple(),
            {"reserve-x": types.uint(amountX), "reserve-y": types.uint(amountY)}
            );
        const shares=Math.floor(Math.sqrt(amountX*amountY))
        res =await chain.callReadOnlyFn(
            "wei-coin","get-balances",[types.principal(deployer.address)],deployer.address
            )
        assertEquals(
            res.result.expectOk(),
            types.uint(shares)
            );
        block = chain.mineBlock([
            Tx.contractCall(
                "coin-swap-registry",
                "remove-liquidity",
                [types.uint(shares)],
                deployer.address
                ),
            ]);
        console.log(block.receipts[0].result)
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        res =await chain.callReadOnlyFn(
            "coin-swap-registry","get-reserve",[],deployer.address
            )
        assertEquals(
            res.result.expectOk().expectTuple(),
            {"reserve-x": types.uint(0), "reserve-y": types.uint(0)}
            );
    },
});

Clarinet.test({
    name: "Ensure that swap amount is correct",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer");
        if (!deployer) {
            console.log(`deployer not found`)
            return
        }
        const amountX=1000
        const amountY=4000
        let block = chain.mineBlock([
           Tx.contractCall(
            "coin-swap-registry",
            "add-liquidity",
            [types.uint(amountX),types.uint(amountY)],
            deployer.address
            ),
        ]);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        let res =await chain.callReadOnlyFn(
            "coin-swap-registry","get-reserve",[],deployer.address
            )
        assertEquals(
            res.result.expectOk().expectTuple(),
            {"reserve-x": types.uint(amountX), "reserve-y": types.uint(amountY)}
            );
        const coinIn=`${deployer.address}.dai-coin`
        console.log(coinIn)
        const amountIn=100;
        const coinOut_expect=`${deployer.address}.wan-coin`
        console.log(coinOut_expect)
        const amountInWithFee=Math.floor(amountIn*997/1000);
        const amountOut_expect=Math.floor(
            (amountY*amountInWithFee)/(amountX+amountInWithFee)
            )
        block = chain.mineBlock([
            Tx.contractCall(
                "coin-swap-registry",
                "swap",
                [types.principal(coinIn),types.uint(amountIn)],
                deployer.address
                ),
            ]);
        console.log(block.receipts[0].result)
        assertEquals(
            block.receipts[0].result.expectOk().expectTuple(),
             {
                "coin-out":coinOut_expect,
                "amount-out":types.uint(amountOut_expect),
            });
    },
});
