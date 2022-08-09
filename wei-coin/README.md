# wei-coin

## Description

**ERC20 implemented by Clarity**

## How To Run This Project

### Run

```shell
# check contract  
$ clarinet check 
# test contract in local 
$ clarinet test    
```

### deploy & Run in local devnet

```shell
# create local node  
$ clarinet integration 
# create yaml file for deployment 
$ clarinet deployment generate --devnet  
# deploy contract to local devnet 
$ clarinet deployment apply -p <path-to-plan.yaml>
# run script in devnet
$ yarn dev:weiCoin     
```

### Other

```shell
# create new contract  
$ clarinet contract new <contract-name>    
```
