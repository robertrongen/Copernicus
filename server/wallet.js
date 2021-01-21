const Wallet = require('ethereumjs-wallet');
const bip39 =  require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey')
// const { hdkey } = require('ethereumjs-wallet')
const createKeccakHash = require('keccak')
const fs = require('fs');

export const cTrustedWalletPath = "./copernicus-wallet.json"

export const toChecksumAddress = function (address) { // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-55.md
  if (!address) return address

  address = address.toLowerCase().replace('0x', '')
  var hash = createKeccakHash('keccak256').update(address).digest('hex')
  var ret = '0x'

  for (var i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}

export const newWallet = async function(mnemonic='') {
  var slot = 0;
  var path = "m/44'/60'/0'/0/" + slot;
  if(mnemonic=='') {
    mnemonic = bip39.generateMnemonic()
  }
  
  var seed = await bip39.mnemonicToSeed(mnemonic);
  var hdwallet = hdkey.fromMasterSeed(seed);
  console.log("got seed %o", seed);
  console.log("got hdwallet %o", hdwallet);
  var toWallet = hdwallet.derivePath(path).getWallet();
  var privatekey = toWallet.getPrivateKey().toString('hex');
  var publicKey = toWallet.getPublicKey().toString('hex');
  var address = toWallet.getAddress().toString('hex');
  
  let wallet = {
    "mnemonic": mnemonic,
      "address": exports.toChecksumAddress(address),
      "privatekey": exports.toChecksumAddress(privatekey)
    };

  return wallet;
}

export const loadTrustedWallet = async (web3) => {
  try {
    if(false==fs.existsSync(cTrustedWalletPath)) {
      // console.error('loadTrustedWallet: trusted wallet has not been created yet!');
      return false;
    }
    
    let rawdata = fs.readFileSync(cTrustedWalletPath);
    let trustedwallet = JSON.parse(rawdata);

    return trustedwallet;
  } catch(ex) {
    console.error('loadTrustedWallet error: ' + ex.message);
    return false;
  }
}

export const createTrustedWallet = async () => {
  try {
    if(false!=fs.existsSync(cTrustedWalletPath)) {
      console.warn('createTrustedWallet: trusted wallet already exists. Overwriting is not allowed!');
      return true;
    }

    let wallet = await newWallet("")
    console.log('createTrustedWallet - created trusted wallet %o', wallet)
    fs.writeFileSync(cTrustedWalletPath,JSON.stringify(wallet));
    
    return true;
  } catch(ex) {
    console.error('createTrustedWallet error: ' + ex.message);
    return false;
  }
}

export const moveTrustedWalletToBackup = () => {
  if(fs.existsSync(cTrustedWalletPath)) {
    const d = new Date();
    const suffix1 = (d.getFullYear()*100 + d.getMonth()+1)*100 + d.getDate()
    const suffix2 = ((d.getHours()*100 + d.getMinutes())*100 + d.getSeconds());
    
    let newpath = cTrustedWalletPath.replace('.json', suffix1 + '-' + suffix2 + '.json');
    console.log('move old trusted wallet file to %s',newpath);
    fs.renameSync(cTrustedWalletPath, newpath);
  }
  
  return true;
}