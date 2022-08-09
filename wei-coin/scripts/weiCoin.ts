import {
    AnchorMode,
    broadcastTransaction,
    callReadOnlyFunction,
    createStacksPrivateKey,
    cvToValue,
    getPublicKey,
    makeContractCall,
    makeRandomPrivKey,
    standardPrincipalCV,
    getAddressFromPrivateKey,
    makeSTXTokenTransfer,
    standardPrincipalCVFromAddress,
    TransactionVersion,
    uintCV,
    makeStandardSTXPostCondition,
    FungibleConditionCode
} from "@stacks/transactions";
import {StacksNetwork,StacksTestnet} from "@stacks/network";
import {AccountsApi, Configuration} from "@stacks/blockchain-api-client";

async function getCoinName(
    network:StacksNetwork,senderAddress:string
):Promise<string>{
    const contractAddress="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const contractName = 'wei-coin';
    const functionName = 'get-name';

    const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs: [],
        network,
        senderAddress,
    };
    const res= await callReadOnlyFunction(options)
    return cvToValue(res).value
}

async function getCoinBalances(
    network:StacksNetwork,ownerAddress:string
):Promise<number>{
    const contractAddress="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const contractName = 'wei-coin';
    const functionName = 'get-balances';
    const owner=standardPrincipalCV(ownerAddress)
    const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs: [owner],
        network,
        senderAddress:ownerAddress,
    };
    const res= await callReadOnlyFunction(options)
    return cvToValue(res).value
}

async function mintCoin(
    network:StacksNetwork,recipientAddress:string,amount:number,senderKey:string
):Promise<string>{
    const contractAddress="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const contractName = 'wei-coin';
    const functionName = 'mint';
    const recipient=standardPrincipalCV(recipientAddress)
    const amountCV=uintCV(amount)
    const postConditionAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const postConditionCode = FungibleConditionCode.GreaterEqual;
    const postConditionAmount = 10;
    const postConditions = [
        makeStandardSTXPostCondition(postConditionAddress, postConditionCode, postConditionAmount),
    ];
    const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs: [amountCV,recipient],
        senderKey,
        network,
        validateWithAbi: true,
        fee: 2000,
        postConditions,
        anchorMode: AnchorMode.Any,

    };
    const transaction = await makeContractCall(options)
    const broadcastResponse = await broadcastTransaction(transaction, network);
    const txId = broadcastResponse.txid;
    console.log(broadcastResponse)
    return txId;
}

async function transferSTXToken(
    network:StacksNetwork,recipientAddress:string,amount:number,senderKey:string
):Promise<string> {
    const txOptions = {
        recipient: recipientAddress,
        amount: amount,
        senderKey,
        network,
        memo: 'test memo',
        // nonce: 1, // set a nonce manually if you don't want builder to fetch from a Stacks node
        fee: 200, // set a tx fee if you don't want the builder to estimate
        anchorMode: AnchorMode.Any,
    };
    const transaction = await makeSTXTokenTransfer(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    const txId = broadcastResponse.txid;
    console.log(broadcastResponse)
    return txId;
}

async function main() {
    console.log(`hello`)
    const key = `753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601`;
    const privateKey = createStacksPrivateKey(key);
    const publicKey=getPublicKey(privateKey)
    const address=getAddressFromPrivateKey(
        privateKey.data,TransactionVersion.Testnet
    )
    const url="http://localhost:3999"
    const network=new StacksTestnet({url})
    // const apiConfig = new Configuration({
    //     fetchApi: fetch,
    //     basePath: url,
    // });
    // const accountApi=new AccountsApi(apiConfig)
    //
    // const info=await accountApi.getAccountBalance({
    //     principal:address,
    // })
    // console.log(info)
    const name= await getCoinName(network,address)
    console.log(`wei-coin contract:name(${name})`)
    const balances= await getCoinBalances(network,address)
    console.log(`wei-coin contract:balances(${balances})`)
    const txid= await mintCoin(network,address,100,key)
    console.log(`wei-coin contract:txid(${txid})`)
    // const txid= await transferSTXToken(network,"ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",100,key)
    // console.log(`wei-coin contract:txid(${txid})`)
}

main()
    .then(()=>console.log(`execute successfully`))
    .catch((err)=>console.log(`execute fail,err:${err}`))
    .finally(()=>process.exit())