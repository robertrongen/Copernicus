import { newWallet, moveTrustedWalletToBackup } from './wallet.js';
import { getLastTransaction, cleanupContractBuildFolder } from './blockchainutils.js';

const fs = require('fs');
const steps = require('./steps.js');
const solc = require('solc')

const cStateFile = 'state.json'
export const cZeroState = {
  step: steps.ROLLOUT_START,
  untrustedwallet: false,
  trustedwallet: false,
  contract: false,
  // idToOwner:[],
  // ownerNTokens:0,
  // currentopenseatoken: false,
  lastupdate: new Date()
}

export const resetState = () => {
  moveTrustedWalletToBackup();
  
  cleanupContractBuildFolder();
  
  return Object.assign({}, cZeroState);
}

export const loadState = (web3) => {
  try {
    if(false==fs.existsSync(cStateFile)) {
      // no state file exists: create a new one
      storeState(resetState());
    }
    
    let rawdata = fs.readFileSync(cStateFile);
    let data = JSON.parse(rawdata);
    return data;
  } catch(ex) {
    console.error('loadState error: ' + ex.message);
    return false;
  }
}

export const storeState = (stateobject) => {
  try {
    fs.writeFileSync(cStateFile,JSON.stringify(stateobject, 0,2));
    return true;
  } catch(ex) {
    console.error('storeState error: ' + ex.message);
    return false;
  }
}