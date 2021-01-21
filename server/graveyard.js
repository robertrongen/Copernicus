// app.get('/api/test/withdraw', async (req,res) => {
//   let trustedwallet = await loadTrustedWallet(web3);
//
//   const contract = new web3.eth.Contract(state.abi,  state.contractaddress);
//   let data = contract.methods.withdraw().encodeABI();
//   console.log("got data %o", data);
//
//   let transferresult = await transfer(web3, trustedwallet.address, trustedwallet.privatekey, state.contractaddress, 0, data);
//   console.log("/api/test/withdraw - transferresult %o", transferresult);;
//
//  res.json({result: true, message: 'withdraw from contract done'});
// });
//
// app.get('/api/test/withdrawtrusted', async (req,res) => {
//   let trustedwallet = await loadTrustedWallet(web3);
//   let seedwallet = await newWallet(cSeedMnemonic);
//
//   let transferresult = await transferall(web3, trustedwallet.address, trustedwallet.privatekey, seedwallet.address);
//   console.log("/api/test/withdrawtrusted - transferresult %o", transferresult);
//
//  res.json({result: true, message: 'withdraw from trustedwallet done'});
// });
//
// app.get('/api/test/withdrawuntrusted', async (req,res) => {
//   let seedwallet = await newWallet(cSeedMnemonic);
//
//   let transferresult = await transferall(web3, state.untrustedwallet.address, state.untrustedwallet.privatekey, seedwallet.address);
//   console.log("/api/test/withdrawuntrusted - transferresult %o", transferresult);
//
//  res.json({result: true, message: 'withdraw from untrustedwallet done'});
// });
//
// app.get('/api/test/funduntrustedwallet', async (req,res) => {
//   try {
//     let seedwallet = await newWallet(cSeedMnemonic);
//     let amountwei = web3.utils.toWei("0.1", "ether")
//     // check fund wallet balance
//     let balancewei = await web3.eth.getBalance(seedwallet.address);
//     if(web3.utils.fromWei(balancewei, "ether")<0.1) {
//       let message = 'fund untrusted wallet failed - insufficient funds in seed wallet (' + web3.utils.fromWei(balancewei, "ether") + ')';
//       console.log(message);
//       res.json({result: false, message: message});
//       return;
//     }
//
//     let transferresult = await transfer(web3, seedwallet.address, seedwallet.privatekey, state.untrustedwallet.address, amountwei);
//     console.log("funduntrustedwallet - transferresult %o", transferresult);
//
//     if(false!==transferresult) {
//       res.json({result: true, message: 'fund untrusted wallet success'});
//     } else {
//       console.log('fund untrusted wallet failed')
//       res.json({result: false, message: 'fund untrusted wallet failed'});
//     }
//   } catch(ex) {
//     console.log('fund untrusted wallet failed (%s)', ex.message);
//     res.json({result: false, message: 'fund untrusted wallet failed (2)'});
//   }
// });
// const sellAllTokens = async () => {
//     const contract = new web3.eth.Contract(state.contract.abi, state.contract.address);
//
//     // This provider is needed by opensea
//     // const providerengine = new Web3ProviderEngine();
//     // let trustedwallet = await loadTrustedWallet(web3);
//     // console.log(trustedwallet);
//     // providerengine.addProvider(new MnemonicWalletSubprovider({mnemonic: trustedwallet.mnemonic}));
//     // providerengine.addProvider(new RPCSubprovider({rpcUrl: settings.providerurl}));
//     // providerengine.start();
//
//     !!!! REPLACE provider engine with HDWalletProvider for this to work
//
//     let networkname = settings.network == "mainnet" ? Network.Main : Network.Rinkeby;
//     console.log("start openseaport with network %o", networkname)
//     let seaport = new OpenSeaPort(providerengine, {
//       // apiBaseUrl: 'https://rinkeby-api.opensea.io/api/v1/',
//       networkName: networkname }, arg => { console.log("open sea error %o", arg)});
//       // , apiKey: API_KEY
//
//     console.log(settings.network == "mainnet" ? Network.Main : Network.Rinkeby);
//
//     // Expire auction a year from now
//     const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24 * 365)
//
//     try {
//       for(let i = 10; i <= 21; i ++) {
//         console.log("Started listing token " + i)
//         const auction = await seaport.createSellOrder({
//           asset: {
//             tokenId: i.toString(),
//             tokenAddress: state.contract.address,
//           },
//           accountAddress: state.trustedwallet.address,
//           startAmount: 0.5,
//           expirationTime
//         })
//         console.log("TOKEN LISTED");
//         console.log(auction);
//       }
//     } catch(error) {
//       console.log("/api/selltokens error ", error);
//     }
//
//     providerengine.stop();
// }
// const launchNextSellOrder = async (tokenid) => {
//   if(settings.network==='ganache'||settings.network==='ropsten') {
//     console.error('cannot transfer tokens to opensea on the ganache or ropsten networks');
//     return false;
//   }
//
//   let trustedwallet = await loadTrustedWallet(web3);
//   const contract = new web3.eth.Contract(state.contract.abi, state.contract.address);
//
//   // console.log("launchNextSellOrder - mnemonic: %s", trustedwallet.mnemonic);
//   console.log("launchNextSellOrder - providerurl: %s", settings.providerurl);
//
//   const hdwalletprovider = new HDWalletProvider(trustedwallet.mnemonic, settings.providerurl);
//
//   let networkname = settings.network == "mainnet" ? Network.Main : Network.Rinkeby;
//
//   console.log("launchNextSellOrder - network %o", networkname)
//   let seaport = new OpenSeaPort(hdwalletprovider, {
//     networkName: networkname
//   }, arg => { console.warn("launchNextSellOrder - open sea status %o", arg)});
//
//   // Expire auction a year from now
//   const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24 * 365)
//   // const expirationTime = 0;
//
//   try {
//     let auctionparams = {
//       asset: {
//         tokenId: tokenid,
//         tokenAddress: state.contract.address,
//       },
//       accountAddress: state.trustedwallet.address,
//       startAmount: 0.5, // parseFloat(settings.tokenpriceether),
//       expirationTime
//     };
//
//     console.log("launchNextSellOrder - auctionparams: %o", auctionparams);
//     let auction = await seaport.createSellOrder(auctionparams);
//     console.log("launchNextSellOrder - order placed");
//   } catch(error) {
//     console.log("launchNextSellOrder - error ", error);
//   }
// }
// case steps.WAIT_FOR_SELLORDERS_CREATED:
//   console.log("WAIT_FOR_SELLORDERS_CREATED - start")
//   if(state.contract!==false) {
//     if(state.currentopenseatoken!==false &&
//        state.currentopenseatoken<=parseInt(settings.ntokens)) {
//       console.log("launching sell order for token %s", state.currentopenseatoken);
//       launchNextSellOrder(state.currentopenseatoken.toString());
//       state.currentopenseatoken++;
//     } else {
//       console.log("done creating sell orders", state.currentopenseatoken);
//
//       state.step = steps.ROLLOUT_COMPLETE
//       state.currentopenseatoken = false;
//     }
//   } else {
//     console.warn("START_CREATE_SELLORDER - should have a contract by now. Illegal state: forcing rollout complete")
//     state.step = steps.ROLLOUT_COMPLETE
//   }
//
//   storeState(state);
//   break;