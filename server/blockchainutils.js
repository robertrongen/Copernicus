const solc = require("solc");
const fs = require('fs-extra');
const path = require('path');
import { loadState, storeState } from './serverutils.js';
const steps = require('./steps.js');

const cContractName = 'CopernicusToken.json';

const rmDir = (dirPath, removeSelf) => {
  if (removeSelf === undefined)
    removeSelf = true;
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  if (removeSelf)
    fs.rmdirSync(dirPath);
};

const createConfiguration = () => {
    return {
        language: 'Solidity',
        sources: {
            'CopernicusToken.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'copernicus-contracts/contracts', 'CopernicusToken.sol'), 'utf8')
            },/*
            }*/
        },
        settings: {
            outputSelection: { // return everything
                '*': {
                    '*': ['*']
                }
            }
        }
    };
}

const getImports = (dependency) => {
    if(dependency.includes('openzeppelin-solidity')) {
      let newpath = dependency.replace('openzeppelin-solidity', 'openzeppelin-contracts');
      return {contents: fs.readFileSync(path.resolve(__dirname, newpath), 'utf8')};
    }

    console.log('Searching for dependency: ', dependency);
    switch (dependency) {
        case 'Strings.sol':
          return {contents: fs.readFileSync(path.resolve(__dirname, 'copernicus-contracts/contracts', 'Strings.sol'), 'utf8')};
        case 'CopernicusToken.sol':
          return {content: fs.readFileSync(path.resolve(__dirname, 'copernicus-contracts/contracts', 'CopernicusToken.sol'), 'utf8')};
        case 'CopernicusFactory.sol':
          return {content: fs.readFileSync(path.resolve(__dirname, 'copernicus-contracts/contracts', 'CopernicusFactory.sol'), 'utf8')};
        default:
            return {error: 'File not found'}
    }
}

const writeOutput = (compiled, buildPath) => {
  // create build dir if it does not exist
  fs.ensureDirSync(buildPath);
  
  // delete contents of buildpath (keep root folder to prevent nodemon from restarting)
  rmDir(buildPath, false);

  for (let contractFileName in compiled.contracts) {
    console.log('Writing json for %o', contractFileName);
    try {
      const contractName = contractFileName.replace('.sol', '');
      if (contractName in compiled.contracts[contractFileName]) {
        fs.outputJsonSync(
          path.resolve(buildPath, contractName + '.json'),
          compiled.contracts[contractFileName][contractName]
        );
        fs.outputJsonSync(
          path.resolve(buildPath, contractName + '-formatted.json'),
          compiled.contracts[contractFileName][contractName],
          {spaces: 4}
        );
      }
    } catch(ex) {
      console.error("writeOutput ", ex)
    }
  }
}

// gets the most recent transaction within the given number of blocks
export const getLastTransaction = async (web3, address, maxblocks = 5) => {
  try {
    if(address===undefined) {
      console.log("getLastTransaction - invalid address");
      return false;
    }
    let endBlockNumber = await web3.eth.getBlockNumber();
    let startBlockNumber = endBlockNumber - maxblocks+1;
    // console.log("Searching for transactions to/from account \"" + address + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);

    let found = false;
    for (var i = endBlockNumber; i >= startBlockNumber ; i--) {
      // console.log("scan block %s", i)
      var block = await web3.eth.getBlock(i, true);
      if (block != null && block.transactions != null) {
        block.transactions.forEach( (e) => {
          if (address === "*" || address === e.from || address === e.to) {
            // console.log(
            //     "   tx hash          : " + e.hash + "\n"
            //   + "   nonce           : " + e.nonce + "\n"
            //   + "   blockHash       : " + e.blockHash + "\n"
            //   + "   blockNumber     : " + e.blockNumber + "\n"
            //   + "   transactionIndex: " + e.transactionIndex + "\n"
            //   + "   from            : " + e.from + "\n"
            //   + "   to              : " + e.to + "\n"
            //   + "   value           : " + e.value + "\n"
            //   + "   gasPrice        : " + e.gasPrice + "\n"
            //   + "   gas             : " + e.gas + "\n"
            //   + "   input           : " + e.input);
            //
            found = e;
          }
        })
        if(found!==false) return found;
      }
    }
    
    return found;
  } catch(ex) {
    console.error('getLastTransaction - error', ex.message)
    return false;
  }
}

const transfercontract = async (web3, ownerwallet, transaction, abi, processcontractdatahandler) => {
  try {
    let gas = await transaction.estimateGas({from: ownerwallet.address});
    const nonce = await web3.eth.getTransactionCount(ownerwallet.address);
    
    let options = {
        to  : transaction._parent._address,
        data: transaction.encodeABI(),
        gas : web3.utils.toHex(gas),
        nonce: web3.utils.toHex(nonce)
    };
    let signedTransaction = await web3.eth.accounts.signTransaction(options, ownerwallet.privatekey);
    let result = await web3.eth.sendSignedTransaction(signedTransaction.raw||signedTransaction.rawTransaction); // , next
    if(null!==processcontractdatahandler) {
      console.log("transfercontract - got result %s", JSON.stringify(result,0,2));
      if(false!==result) {
        processcontractdatahandler(true, result.contractAddress, result.blockNumber, abi);
      } else {
        processcontractdatahandler(false, "", "", "");
      }
    }
  } catch(ex) {
    console.log('transfercontract - error %o', ex)
    return false;
  }
}

export const transferall = async (web3, fromAddress, fromPrivateKey, toAddress) => {
  try {
    const balance = await web3.eth.getBalance(fromAddress);
    const gasPrice= await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    
    console.log("got balance %o/ gasprice %o/ nonce %s", balance, gasPrice, nonce);
    
    const tx = {
        from: fromAddress,
        to: toAddress,
        value: balance,
        nonce: nonce,
        // gasprice: web3.utils.toHex(gasPrice)
    }
    
    const gas = await web3.eth.estimateGas(tx); // 21000 when not sending to contract
    let cost = gas*gasPrice;

    tx.gas = web3.utils.toHex(gas);
    tx.value = web3.utils.toHex(new web3.utils.BN(balance).sub(new web3.utils.BN(cost)));
    
    console.log("--- benchmark ---")

    console.log("transferall - transaction %o", tx);

    let stx = await web3.eth.accounts.signTransaction(tx, fromPrivateKey);
    let result = await web3.eth.sendSignedTransaction(stx.raw || stx.rawTransaction)
    
    console.log('transferall - sent signed transaction');
    if(false===result) {
      console.log("transferall failed - error : %o", error)
    } else {
      console.log("transferall success - result : %o", result)
    }

    return result;
  } catch(ex) {
    console.error("transferall error - %s", ex.message);
    return false
  }
}

export const transfer = async (web3, fromAddress, fromPrivateKey, toAddress, amountwei, data=null) => {
  const balance = await web3.eth.getBalance(fromAddress);
  const gasPrice= await web3.eth.getGasPrice();
  const nonce = await web3.eth.getTransactionCount(fromAddress);
  const tx = {
      from: fromAddress,
      to: toAddress,
      value: web3.utils.toHex(amountwei),
      nonce: web3.utils.toHex(nonce)
  }
  if(null!==data) {
    tx.data = data
  }
  
  const gas = await web3.eth.estimateGas(tx);
  tx.gas = web3.utils.toHex(gas);
  
  console.log("transfer - transaction %o", tx);
  
  let stx = await web3.eth.accounts.signTransaction(tx, fromPrivateKey);
  let result = await web3.eth.sendSignedTransaction(stx.raw || stx.rawTransaction);
  return result;
}

export const compileContract = async () => {
  let fail = false;
  try {
    const buildPath = path.resolve(__dirname, 'build-contracts');
    const artefactname = buildPath + '/' + cContractName;
    
    const config = createConfiguration();
    
    let compiledSources;
    compiledSources = JSON.parse(solc.compile(JSON.stringify(config), getImports));
    if (!compiledSources) {
      console.error('deployContract - compilation failed (no output)');
      fail=true;
    } else if (compiledSources.errors) { // something went wrong.
      compiledSources.errors.forEach(error=>{ if(error.type!='Warning') {fail = true }});
      
      if(fail) {
        console.error('deployContract - compilation failed');
        compiledSources.errors.forEach(error => console.log(' - %s: %s', error.type, error.message));
      } else {
        console.error('deployContract - compilation had warnings');
        compiledSources.errors.forEach(error => console.log(' - %s: %s', error.type, error.message));
      }
    } else {
      console.log('deployContract - compilation complete');
    }
    
    if(false===fail) {
      console.log('deployContract - writing compiled contracts to disk');
      writeOutput(compiledSources, buildPath);
    }
  } catch (error) {
    console.log('deploycontract - compilation failed: error %s', error);
    fail=true;
  } finally {
    return fail===false;
  }
}

export const calculateContractDeployCost = async (web3, ownerwallet, tokenreceiver, ntokens, tokenpriceeth, baseurl) => {
  const buildPath = path.resolve(__dirname, 'build-contracts');
  const artefactname = buildPath + '/' + cContractName;

  let gas = false;
  try {
    const buildPath = path.resolve(__dirname, 'build-contracts');
    const artefactname = buildPath + '/' + cContractName;

    const source = fs.readFileSync(artefactname, 'utf8');
    const artefact = JSON.parse(source)
    const contractName = artefact.contractName
    const abi          = artefact.abi
    const bytecode     = '0x' + artefact.evm.bytecode.object
    let amountwei = web3.utils.toWei(tokenpriceeth, "ether")
    
    const contractArgs = [
          "Copernicus.xxxxxx.xxxxxx",
          "CP",
          ntokens,
          amountwei,
          baseurl,
          tokenreceiver]

    let contract = new web3.eth.Contract(abi);
    let transaction = contract.deploy({data: bytecode, arguments: contractArgs});
    if(transaction===null) {
      console.error('calculateContractDeployCost - unable to calculate gas')
    } else {
      gas = await transaction.estimateGas();
      console.log('calculateContractDeployCost - deploy gas is %s wei', gas);
    }
  } catch (error) {
      console.error('calculateContractDeployCost - unable to calculate gas: error %s', error);
  } finally {
    return gas;
  }
}



export const deployContract = async (web3, ownerwallet, tokenreceiver, settings, processcontractdatahandler) => {
  try {
    const buildPath = path.resolve(__dirname, 'build-contracts');
    const artefactname = buildPath + '/' + cContractName;

    const source = fs.readFileSync(artefactname, 'utf8');
    const artefact = JSON.parse(source)
    const contractName = artefact.contractName
    const abi          = artefact.abi
    const bytecode     = '0x' + artefact.evm.bytecode.object
    let amountwei = web3.utils.toWei(settings.tokenpriceether, "ether")

    const contractArgs = [
          settings.tokenname,
          settings.tokensymbol,
          settings.ntokens,
          amountwei,
          settings.baseurl,
          tokenreceiver]

    // console.log("contractname : %s", contractName)
    // console.log("abi : %s", JSON.stringify(abi));
    // console.log("bytecode: %s", JSON.stringify(bytecode));
    
    let contract = new web3.eth.Contract(abi);
    let transaction = contract.deploy({data: bytecode, arguments: contractArgs});
    if(transaction===null) {
      console.error('unable to create deploy transaction')
      return false;
    } else {
      console.log("yahoo!");
      // console.log(transaction);
    }

    await transfercontract(web3, ownerwallet, transaction, abi, processcontractdatahandler);
  } catch (error) {
      console.log('deploycontract - transfer failed: error %s', error);
      return false;
  }
  
  return true;
}

export const loadContract = (web3, contractaddress) => {
  try {
    const buildPath = path.resolve(__dirname, 'build-contracts');
    const artefactname = buildPath + '/' + cContractName;

    const source = fs.readFileSync(artefactname, 'utf8');
    const artefact = JSON.parse(source)
    const contractName = artefact.contractName
    const abi          = artefact.abi
    const bytecode     = '0x' + artefact.evm.bytecode.object

    let contract = new web3.eth.Contract(abi, contractaddress);
    return contract;
  } catch (error) {
    console.log('loadContract - load failed: error %s', error);
    return false;
  }
}

export const loadContractABI = (web3) => {
  try {
    const buildPath = path.resolve(__dirname, 'build-contracts');
    const artefactname = buildPath + '/' + cContractName;

    const source = fs.readFileSync(artefactname, 'utf8');
    const artefact = JSON.parse(source)
    return artefact.abi;
  } catch (error) {
    console.log('loadContractABI - load failed: error %s', error);
    return false;
  }
}

export const cleanupContractBuildFolder = () => {
  try {
    // cleanup contract build folder
    const exec = require('child_process').exec;
    const buildPath = path.resolve(__dirname, 'build-contracts');
    
    if(fs.existsSync(buildPath)) {
      exec('rm -r ' + buildPath, function (err, stdout, stderr) {
        if(err) {
          console.error("cleanupContractBuildFolder - unable to remove contract build folders (error %s)", err);
        }
        // your callback goes here
      });
    }

    return true
  } catch(ex) {
    console.error("cleanupContractBuildFolder - error %s", ex.message);
    return false;
  }
}