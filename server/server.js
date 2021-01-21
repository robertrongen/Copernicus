const express = require('express');
const path = require('path');
const fs = require('fs');
const steps = require('./steps.js');
const Web3 = require("web3");
// const HDWalletProvider = require("truffle-hdwallet-provider");
const HDWalletProvider = require ('@truffle/hdwallet-provider');


import { OpenSeaPort, Network, EventType } from 'opensea-js';

import { newWallet,
         createTrustedWallet,
         loadTrustedWallet } from './wallet.js';
import { resetState,
         loadState,
         storeState } from './serverutils.js';
import { getLastTransaction,
         transfer,
         transferall,
         compileContract,
         calculateContractDeployCost,
         deployContract,
         loadContractABI } from './blockchainutils.js';

const pad = (n) => { return ("0" + n).slice(-2); };
const d = new Date();
const suffix1 = d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate())
const suffix2 = pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());

const x=1;
// let settings = {
//   network: "ganache",
//   providerurl: "< set below >",
//   requiredconfirmations: 0, // 2,
//   nbacklog: 6, // max lookback in transaction history
//   tokenname: "BANANA."+suffix1+"."+suffix2,
//   tokensymbol: "BN",
//   basefee: "0.05",
//   ntokens: "21",
//   tokenpriceether: "0.5",
//   createsellorders: false,
//   baseurl: "https://isitcopernicus.art/assets/json/ticket_",
//   testmnemonic: "giggle zoo route zoo salon shy category pipe above receive eye muffin"
// }

let settings = {
  network: "rinkeby",
  providerurl: "< will be set below >",
  requiredconfirmations: 3,
  nbacklog: 6, // max lookback in transaction history
  tokenname: "RobertCopernicus."+suffix1+"."+suffix2,
  tokensymbol: "RCO",
  basefee: "0.05",
  ntokens: "21",
  tokenpriceether: "0.1",
  createsellorders: true,
  baseurl: "https://picsum.photos/200?token=",
  testmnemonic: "giggle zoo route zoo salon shy category pipe above receive eye muffin"
}

//
// let settings = {
//   network: "mainnet",
//   providerurl: "< set below >",
//   requiredconfirmations: 2, // 2,
//   nbacklog: 6, // max lookback in transaction history
//   tokenname: "BARBAPAPPA."+suffix1+"."+suffix2,
//   tokensymbol: "BBP",
//   basefee: "0.05",
//   ntokens: "21",
//   tokenpriceether: "0.5",
//   createsellorders: true,
//   baseurl: "https://isitcopernicus.art/assets/metadata/ticket_",
//   testmnemonic: ""
// }

switch(settings.network) {
  case "ganache":
    // use ganache: ganache-cli -a 1 -d -e 10000 -b 5 -m "giggle zoo route zoo salon shy category pipe above receive eye muffin"
    settings.providerurl = "http://127.0.0.1:8545";
    break;
  case "rinkeby":
    settings.providerurl = "https://rinkeby.infura.io/v3/b74566a91ecb4bba8558f8f2460caa31";
    break;
  case "ropsten":
    settings.providerurl = "https://ropsten.infura.io/v3/13a53df0b18449feb2af82ff6c2f511a";
    break;
  case "mainnet":
    settings.providerurl = "https://mainnet.infura.io/v3/13a53df0b18449feb2af82ff6c2f511a";
    break;
  default:
    console.error("server - no correct network for ethereum transactions set. Terminating server");
    process.exit(1);
}

let state = loadState();

let provider = new Web3.providers.HttpProvider(settings.providerurl);
const web3 = new Web3(provider,null, {transactionConfirmationBlocks: 1})

// const updateTokenHolders = async () => {
//   try {
//
//   } catch(ex) {
//     console.error("updateTokenHolders error %o", ex)
//   }
//   if(state.contract===false) {
//     // res.json({result: false, message: 'searched for token holders', contractaddress:"", idToOwner: [], ownerNTokens: 0});
//     state.idToOwner =[];
//     state.ownerNTokens = 0;
//     storeState(state);
//
//     return;
//   };
//
//   const contract = new web3.eth.Contract(state.contract.abi,  state.contract.address);
//
//   let latestblocknumber = await web3.eth.getBlockNumber();
//   let events = await contract.getPastEvents('Transfer', {fromBlock: state.contract.blocknumber, toBlock: 'latest'});
//   let idToOwner = {};
//   let ownerNTokens = {}
//   events.forEach(event => {
//     idToOwner[event.returnValues.tokenId] = event.returnValues.to
//
//     if((event.returnValues.to in ownerNTokens)==false) {
//       ownerNTokens[event.returnValues.to]=1;
//     } else {
//       ownerNTokens[event.returnValues.to]+=1;
//     }
//   });
//
//   state.idToOwner = idToOwner;
//   state.ownerNTokens = ownerNTokens;
//
//   storeState(state);
// }

const launchAllSellOrders = async (firstTokenIndex, lastTokenIndex) => {
  try {
    if(settings.network==='ganache'||settings.network==='ropsten') {
      console.error('cannot transfer tokens to opensea on the ganache or ropsten networks');
      return false;
    }
    
    let trustedwallet = await loadTrustedWallet(web3);
    const contract = new web3.eth.Contract(state.contract.abi, state.contract.address);
    
    console.log("launchAllSellOrders - contract address: %o", contract._address);
    console.log("launchAllSellOrders - providerurl: %s", settings.providerurl);
    console.log("launchAllSellOrders - wallet info: %o", trustedwallet);
    
    const hdwalletprovider = new HDWalletProvider(trustedwallet.mnemonic, settings.providerurl);

    let networkname = settings.network == "mainnet" ? Network.Main : Network.Rinkeby;
    
    let seaport = undefined;
    try {
      console.log("launchAllSellOrders - network %o", networkname)
      seaport = new OpenSeaPort(hdwalletprovider, {
        networkName: networkname
      }, arg => { console.warn("launchAllSellOrders - open sea status %o", arg)});
    } catch(ex) {
      console.log("launchAllSellOrders - create openseaport error ", ex);
      return false;
    }

    // Expire auction a year from now
    const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24 * 365)
    // const expirationTime = 0;
    
    for(let tokenindex=firstTokenIndex;tokenindex<=lastTokenIndex;tokenindex++) {
      try {
        let auctionparams = {
          asset: {
            tokenId: tokenindex.toString(),
            tokenAddress: state.contract.address,
          },
          accountAddress: state.trustedwallet.address,
          startAmount: parseFloat(settings.tokenpriceether),
          expirationTime
        };
        
        try {
          console.log("launchAllSellOrders - auctionparams: %o", auctionparams);
          let auction = await seaport.createSellOrder(auctionparams);
          console.log("launchAllSellOrders - sell order placed %s", tokenindex);
        } catch(ex) {
          console.log("launchAllSellOrders - create sell order error ", ex.message);
          return false;
        }
      } catch(error) {
        console.log("launchAllSellOrders - error ", ex.message);
        return false;
      }
    }
    
    return true;
  } catch(ex) {
    console.error("launchAllSellOrders - error %s",ex.message);
    return false;
  }
}

const contracttransferredhandler = (success, contractaddress, blocknumber, abi)=>{
  console.log("contracttransferredhandler - %s - succes %s @block %s", contractaddress, success, blocknumber);
}

const checkMonitoring = async () => {
  try {
    try {
        let isListening = await web3.eth.net.isListening();
        if(!isListening) {
          console.log("The %s network is not listening", settings.network);
          return false;
        }
    } catch(ex) {
      console.log("Unable to connect to the %s network", settings.network);
      return false;
    }
    
    // console.time("walletstate")
    try {
      let lasttransaction=false;
      
      // get blockchain state
      state.latestblocknumber = await web3.eth.getBlockNumber();
      
      if(false!==state.untrustedwallet) {
        state.untrustedwallet.balancewei = await web3.eth.getBalance(state.untrustedwallet.address);
        state.untrustedwallet.balance = web3.utils.fromWei(state.untrustedwallet.balancewei, "ether");
        
        lasttransaction = await getLastTransaction(web3, state.untrustedwallet.address, settings.nbacklog);
        
        state.untrustedwallet.lasttransactionhash = false;
        state.untrustedwallet.lasttransactionage = settings.nbacklog+1;
        if(lasttransaction!==false) {
          state.untrustedwallet.lasttransactionhash = lasttransaction.hash;
          state.latestblocknumber = await web3.eth.getBlockNumber();
          state.untrustedwallet.lasttransactionage = state.latestblocknumber - lasttransaction.blockNumber;
        }
      }
        
      // ------------------------------
      if(false!=state.trustedwallet) {
        state.trustedwallet.balancewei = await web3.eth.getBalance(state.trustedwallet.address);
        state.trustedwallet.balance = web3.utils.fromWei(state.trustedwallet.balancewei, "ether");
        
        lasttransaction = await getLastTransaction(web3, state.trustedwallet.address, settings.nbacklog);

        state.trustedwallet.lasttransactionhash = false;
        state.trustedwallet.lasttransactionage = settings.nbacklog+1;
        if (lasttransaction!=false) {
          state.trustedwallet.lasttransactionhash = lasttransaction.hash;
          state.latestblocknumber = await web3.eth.getBlockNumber();
          state.trustedwallet.lasttransactionage = state.latestblocknumber - lasttransaction.blockNumber;
        }
      }
        
      if(false!==state.contract) {
        state.contract.balancewei = await web3.eth.getBalance(state.contract.address);
        state.contract.balance = web3.utils.fromWei(state.contract.balancewei, "ether");

        lasttransaction = await getLastTransaction(web3, state.contract.address, settings.nbacklog);

        state.contract.lasttransactionhash = false;
        state.contract.lasttransactionage = settings.nbacklog+1;
        if (lasttransaction!=false) {
          state.contract.lasttransactionhash = lasttransaction.hash;
          state.latestblocknumber = await web3.eth.getBlockNumber();
          state.contract.lasttransactionage = state.latestblocknumber - lasttransaction.blockNumber;
        }
      }
      
      storeState(state);

    } catch(ex) {
      console.error("checkMonitoring - getlastestblockinfo error %s", ex.message)
      return false;
    }
    // console.timeEnd("walletstate")

    // console.log("new state");
    // console.log("untrusted wallet: %o", state.untrustedwallet);
    // console.log("trusted wallet  : %o", state.trustedwallet);
    // console.log("contract  : %o", state.contract);

    // Do state updates
    // console.time("stateupdate")
    try {
      switch(state.step) {
        case steps.ROLLOUT_START:
          console.log("compiling contract", );
          let result = await compileContract();
          console.log("compiling contract - result %s", result);
          if(true === result) {
            console.log('contract compilation success')
            state.step = steps.WAIT_FOR_SET_UNTRUSTED_WALLET;
            
            storeState(state);
          } else {
            console.log('contract compilation failed')
            state.step = steps.ROLLOUT_FAILED_UNABLE_TO_COMPILE_CONTRACTS;
            
            storeState(state);
          }
          break;
        case steps.WAIT_FOR_SET_UNTRUSTED_WALLET:
          console.log("waiting for untrusted wallet to be set");
          break; //
        case steps.WAIT_FOR_FUNDS_IN_UNTRUSTED_WALLET:
          // the magic starts when funds are transferred to this wallet!
          if(state.untrustedwallet.balancewei>0) {
            if(state.untrustedwallet.lasttransactionage >= settings.requiredconfirmations) {
              console.log("found funds in untrusted wallet with enough confirmations")
              try {
                // create trusted wallet and store it on the external disk
                let createresult = await createTrustedWallet();

                if(false!==createresult) {
                  let trustedwallet = await loadTrustedWallet(web3);

                  // NEVER put private info for the trusted wallet in the state
                  // is state is sent to the client!
                  state.trustedwallet = {
                      address: trustedwallet.address
                  }
                  
                  // calculate amount required to deploy contract
                  // let gascostwei = calculateContractDeployCost(web3);
                  // let gascostwei = await calculateContractDeployCost(web3, trustedwallet, state.untrustedwallet.address, settings.ntokens, settings.tokenpriceether, settings.baseurl);
                  // Skip this gas estimation
                  if (true || false!==gascostwei) {
                    let gascostwei = web3.utils.toWei(settings.basefee, 'ether')
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                    console.log("transferring (%s wei) from untrusted wallet to trustedwallet at ", gascostwei, trustedwallet.address);
                    // let transferresult = await transferall(web3, state.untrustedwallet.address, state.untrustedwallet.privatekey, trustedwallet.address);
                    let transferresult = await transfer(web3, state.untrustedwallet.address, state.untrustedwallet.privatekey, trustedwallet.address, gascostwei);
                    if(false!==transferresult) {
                      state.step = steps.WAIT_FOR_FUNDS_IN_TRUSTED_WALLET;
                      state.transactionUntrustedBalanceToTrusted = transferresult
                      
                      storeState(state);
                    } else {
                      console.log("transfer of funds to untrusted wallet failed - result %o", transferresult);
                    }
                  } else {
                    console.error("unable to calculate contract deployment gas cost");
                  }
                }
              } catch(ex) {
                console.error("transfer of funds to untrusted wallet failed - error %o", ex);
              }
            } else {
              console.log("found funds in untrusted wallet. waiting for enough confirmations")
            }
            
          } else {
            
          }
          // })
          break;
        case steps.WAIT_FOR_FUNDS_IN_TRUSTED_WALLET:
          if(state.trustedwallet.balancewei>0) {
            // the magic continues when funds are transferred to this wallet!
            if(state.trustedwallet.lasttransactionage >= settings.requiredconfirmations) {
              try {
                let trustedwallet = await loadTrustedWallet(web3);
                
                const nonce = await web3.eth.getTransactionCount(trustedwallet.address);
                const RLP = require('rlp');
                let newcontractaddress = web3.utils.toChecksumAddress("0x" + web3.utils.sha3(RLP.encode([trustedwallet.address,nonce])).slice(12).substring(14));
                
                // now (compile and) deploy the smart contract
                console.log("funds received on trusted wallet. Deploying contract at address %s", newcontractaddress);

                state.contract = {
                  address: newcontractaddress,
                  abi: loadContractABI()
                }
                state.currentopenseatoken = false;
                state.step = steps.WAIT_FOR_CONTRACT_DEPLOYED;
                storeState(state);

                deployContract(web3, trustedwallet, state.untrustedwallet.address, settings, contracttransferredhandler);
              } catch(ex) {
                console.error(ex);
              }
            } else {
              console.log("found funds in trusted wallet. waiting for enough confirmations")
            }
          }
          break;
        case steps.WAIT_FOR_CONTRACT_DEPLOYED:
          try {
            let code = await web3.eth.getCode(state.contract.address);
            console.log("wait for contract deployment - get code %s", code);
            if(code && code!="0x") {
              console.log("wait for contract deployment - Yippie! Found contract at address %s !", state.contract.address);
              if(settings.createsellorders==false) {
                state.step = steps.ROLLOUT_COMPLETE
              } else {
                state.step = steps.WAIT_FOR_SELLORDERS_CREATED
                state.currentopenseatoken = 10; // start selling token #10
              }
              
              storeState(state);
            } else {
              console.error('contracttransferredhandler - contract was not deployed succesfully');
            }
          } catch(ex) {
            console.error("error while waiting for contract deployment: %o", ex)
          }

          break;
        case steps.WAIT_FOR_SELLORDERS_CREATED:
          console.log("WAIT_FOR_SELLORDERS_CREATED - start")
          if(state.contract!==false) {
            let result = await launchAllSellOrders(10,21);
            // if(state.currentopenseatoken!==false &&
            //    state.currentopenseatoken<=parseInt(settings.ntokens)) {
            //   console.log("launching sell order for token %s", state.currentopenseatoken);
            //   launchNextSellOrder(state.currentopenseatoken.toString());
            //   state.currentopenseatoken++;
            // } else {
            //   console.log("done creating sell orders", state.currentopenseatoken);
            //
            // if(true===result) {
              state.step = steps.ROLLOUT_COMPLETE
            // } else {
            //   console.log("launch tokens failed: retrying")
            // }
          } else {
            console.warn("START_CREATE_SELLORDER - should have a contract by now. Illegal state: forcing rollout complete")
          }
          
          storeState(state);
          break;
        case steps.WAIT_FOR_SELLORDER_CONFIRMED:
          break;
        case steps.RESET_START:
          state.step = steps.RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT;
          storeState(state);
          break;
        case steps.RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT:
          if(false===state.contract) {
            // no contract -> check trusted wallet balance
            console.log('RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT - no contract address - continue with trusted wallet check')
            state.step = steps.RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET;
          } else {
            console.log("RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT - address %s", state.contract.address);
            if(state.contract!==false) {
              if(state.contract.balancewei>0) {
                console.log("RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT - got balance %s", state.contract.balancewei);
                // balance > 0 -> do transfer + go to RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED
                let trustedwallet = await loadTrustedWallet(web3);
                
                const contract = new web3.eth.Contract(state.contract.abi,  state.contract.address);
                let data = contract.methods.withdraw().encodeABI();
                
                let transferresult = await transfer(web3, trustedwallet.address, trustedwallet.privatekey, state.contract.address, 0, data);
                
                state.step = steps.RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED
              } else {
                console.log("RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT - no balance, continue with trusted wallet check");
                // balance = 0 -> go to RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET
                state.step = steps.RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET
              }
            } else {
              console.error("unable to get balance from the contract. This requires manual intervention");
            }
          }
          console.log("RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT - state %o", state);
          storeState(state);
          
          break;
        case steps.RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED:
          console.log('RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED');
          if(state.contract!==false) {
            if(state.contract.balancewei<=0) {
              // wait for n confirmations
              if(state.contract.lasttransactionage>=settings.requiredconfirmations) {
                state.step = steps.RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET
                storeState(state);
              }
            } else {
              // transfer not yet complete
            }
          } else {
            console.error("RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED - unable to get balance from the contract. This requires manual intervention");
          }
          break;
        case steps.RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET:
          console.log('RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET')
          if(false==state.trustedwallet) {
            // no trusted wallet -> proceed with cleanup
            state.step = steps.RESET_CLEANUP_STATUS;
          } else {
            // get balance from contract
            let trustedwallet = await loadTrustedWallet(web3);
            if(state.trustedwallet!==false) {
              if(state.trustedwallet.balancewei>0) {
                // balance > 0 -> do transfer + go to RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED
                console.log("RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET - got balance %s", state.trustedwallet.balancewei);
                let transferresult = await transferall(web3, trustedwallet.address, trustedwallet.privatekey, state.untrustedwallet.address);
                state.step = steps.RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET_CONFIRMED
              } else {
                // balance = 0 -> go to RESET_CLEANUP_STATUS
                console.log("RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET - no balance, continue with cleanup");
                state.step = steps.RESET_CLEANUP_STATUS;
              }
            } else {
              console.error("RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET - unable to get balance from the trusted wallet. This requires manual intervention");
            }
          }
          storeState(state);
          break;
        case steps.RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET_CONFIRMED:
          console.log('RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET_CONFIRMED')
          if(state.trustedwallet!==false) {
            if(state.trustedwallet.balancewei<=0) {
              // wait for n confirmations
              if(state.trustedwallet.lasttransactionage>=settings.requiredconfirmations) {
                // done -> go to RESET_CLEANUP_STATUS
                state.step = steps.RESET_CLEANUP_STATUS
                storeState(state);
              }
            } else {
              // transfer not yet complete
              console.log('RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET_CONFIRMED - balance %s', state.trustedwallet.balancewei)
            }
          } else {
            console.error("RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET_CONFIRMED - unable to get balance from the trusted wallet. This requires manual intervention");
          }
          break;
        case steps.RESET_CLEANUP_STATUS:
          console.log('RESET_CLEANUP_STATUS')
          // cleanup & set state to ROLLOUT_START
          let success = false;
          try {
            let newstate = resetState();
            if(false!==newstate) {
              console.log("setting new state %o", newstate);
              state = newstate;
          
              storeState(state);
              success = true;
            }
          } catch(ex) {
            console.error('RESET_CLEANUP_STATUS failed - reason: %s', ex.message);
          } finally {
            if(success) {
              console.log('RESET_CLEANUP_STATUS success')
            } else {
              console.error('RESET_CLEANUP_STATUS failed')
            }
          }
          break;
        default:
          // console.log('nothing to do in step %s!', state.step);
          break;
      }
    } catch(ex) {
      console.error("checkMonitoring error in state update logic - %s - %o", state.step, ex);
    }
    //console.timeEnd("stateupdate")
    
    // console.time("updatetokenhodlers")
    // try {
    //   await updateTokenHolders();
    // } catch(ex) {
    //   console.error("checkMonitoring error in update tokenholders - %o", ex);
    // }
    //console.timeEnd("updatetokenhodlers")
    
    state.lastupdate = new Date();
    storeState(state);
  } catch(ex) {
    console.error("checkMonitoring outer loop error - %s - %o", state.step, ex);
  } finally {
    setTimeout(checkMonitoring,5000);
  }
}

// const buyToken = async () => {
//   let seedwallet = await newWallet(settings.testmnemonic);
//
//   const contract = new web3.eth.Contract(state.contract.abi,  state.contract.address);
//   console.log("buy token from (contract %s) using wallet", state.contract.address, seedwallet.address);
//
//   let data = contract.methods.buyToken().encodeABI();
//   console.log("got data %o", data);
//
//   let amountwei = web3.utils.toWei(settings.tokenpriceether, "ether");
//   let transferresult = await transfer(web3, seedwallet.address, seedwallet.privatekey, state.contract.address, amountwei, data);
//   console.log("/api/test/buytoken - transferresult %o", transferresult);;
// }

const app = express();

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   next();
// });
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.get('/api/getstate', async (req,res) => {
  // console.log("incoming getstate request")
  res.json({result: true, data: state, settings});
});

app.get('/api/test/redeploycontract', async (req, res) => {
  console.log("reset state to WAIT_FOR_FUNDS_IN_TRUSTED_WALLET");
  state.step = steps.WAIT_FOR_FUNDS_IN_TRUSTED_WALLET;
  storeState(state);
  
  res.json({result: true, message: 'state was reset to WAIT_FOR_FUNDS_IN_TRUSTED_WALLET'});
})

app.get('/api/test/resetstate', async (req,res) => {
  console.log("incoming resetstate call")
  if(state.contract!==false) {
    state.step = steps.RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT;
  } else if(state.trustedwallet!==false) {
    state.step = steps.RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET;
  } else {
    state.step = steps.RESET_CLEANUP_STATUS
  }
  
  storeState(state);
  res.json({result: true, message: 'resetstate started'});
});

app.get('/api/setuntrustedwallet', async (req,res) => {
  // console.log("incoming set untrusted wallet call")
  try {
    if(state.step!==steps.WAIT_FOR_SET_UNTRUSTED_WALLET) {
      res.json({result: false, message: 'the untrusted wallet cannot be changed in this state'});
      return;
    }
    
    if("bip39" in req.query == false) {
      res.json({result: false, message: 'please specify bip39 for the seed wallet'});
      return;
    }

    console.log("set untrusted wallet %o", req.query.bip39);
    // res.json({result: true, message: 'set untrusted wallet success'});
  
    // during testing: always create same wallet by providing seed
    let wallet = await newWallet(req.query.bip39);
    if(wallet!==false) {
      state.untrustedwallet = wallet;
      state.step = steps.WAIT_FOR_FUNDS_IN_UNTRUSTED_WALLET;

      console.log('created wallet %o', state.untrustedwallet)
    } else {
      console.log('unable to set untrusted wallet')
    }
    
    storeState(state);

    res.json({result: true, message: 'set untrusted wallet success'});
  } catch(ex) {
    console.log('set untrusted wallet failed', ex)
    res.json({result: true, message: 'set untrusted wallet failed'});
  }
});

// app.get('/api/tokenholders', async (req,res) => {
//   // console.log("token owners: %s", JSON.stringify(state.idToOwner,0,2));
//   // console.log("owners ntokens: %s", JSON.stringify(state.ownerNTokens,0,2));
//   res.json({result: true,
//             message: 'current token holders',
//             contractaddress:state.contract.address,
//             idToOwner: state.idToOwner,
//             ownerNTokens: state.ownerNTokens});
// });

// app.get('/api/test/buytoken', async (req,res) => {
//   await buyToken();
//   res.json({result: true, message: 'token purchase done'});
// });

app.get('/api/selltokens', async (req, res) => {
  console.log("move to state WAIT_FOR_SELLORDERS_CREATED")
  state.currentopenseatoken = 10;
  state.step = steps.WAIT_FOR_SELLORDERS_CREATED
  storeState(state);
  
  res.json({result: true, message: 'restarted token transfer to opensea'});
});

app.get('/api/poweroff', async (req, res) => {
  console.log("shutting down computer")
  storeState(state);
  
  var exec = require('child_process').exec;
  
  console.log("shutdown here!")

  const shutdown = (callback) => {
    exec('sudo shutdown -h now', (error, stdout, stderr) => { callback(stdout); });
  }
  
  // Shutdown computer
  shutdown(function(output){
      console.log(output);
  });
    
  res.json({result: true, message: 'shutdown started'});
});

// const port = process.env.PORT || 3001;
// app.listen(port);
// Express port-switching logic
let port;
console.log("❇️ NODE_ENV is", process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  port = process.env.PORT || 3000;
  app.use(express.static(path.join(__dirname, "../build")));
  app.get("*", (request, response) => {
    response.sendFile(path.join(__dirname, "../build", "index.html"));
  });
} else {
  port = 3001;
  console.log("⚠️ Not seeing your changes as you develop?");
  console.log(
    "⚠️ Do you need to set 'start': 'npm run development' in package.json?"
  );
}

app.listen(port);
console.log('Server app is listening on port ' + port);

checkMonitoring();
