import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { OnboardingButton } from './OnboardingButton.jsx';

import './App.css';

const cSeedMnemonic = "";

const steps = require('./steps.js');

class App extends Component {
  // Initialize the state
  constructor(props){
    super(props);
    
    this.getstatetimer = false;
    // this.gettokenholderstimer = false;

    this.state = {
      state: {
        step: steps.ROLLOUT_START,
        untrustedwallet: false,
        trustedwallet: false,
        contract: false
      }
    }
    
    // this.state.idToOwner = false; // used client side for visualisation
    this.state.settings = false; // used client side for visualisation
  }

  componentDidMount() {
    this.getState(); // start periodic state update
    // this.getTokenholders(); // start periodic state update
  }
  
  componentWillUnmount() {
    if(this.getstatetimer!==false) {
      clearTimeout(this.getstatetimer);
      this.getstatetimer = false;
    }
    // if(this.gettokenholderstimer!==false) {
    //   clearTimeout(this.gettokenholderstimer);
    //   this.gettokenholderstimer = false;
    // }
  }

  // Retrieves the Home of items from the Express app
  getState = async () => {
    try {
      if(this.getstatetime!==false) {
        clearTimeout(this.getstatetimer);
        this.getstatetimer = false;
      }
      // console.log("getstate");
      fetch('/api/getstate')
      .then(res => res.json())
      .then(rawdata => {
        this.setState({ state: rawdata.data, settings: rawdata.settings });
        this.getstatetimer = setTimeout(this.getState, 5000);
      })
      .catch((ex) => {
        console.log("getState - error %o", ex)
        this.getstatetimer = setTimeout(this.getState, 5000);
      })
    } catch(ex) {
      console.error("getState - error %s", ex.message);
    }
  }
  
  // // Retrieves the Home of items from the Express app
  // getTokenholders = async () => {
  //   try {
  //     if(this.gettokenholderstimer!==false) {
  //       clearTimeout(this.gettokenholderstimer);
  //       this.gettokenholderstimer = false;
  //     }
  //     // console.log("getstate");
  //     fetch('/api/tokenholders')
  //     .then(res => res.json())
  //     .then(rawdata => {
  //       this.setState({ idToOwner: rawdata.idToOwner, ownerNTokens: rawdata.ownerNTokens });
  //       this.gettokenholderstimer = setTimeout(this.getTokenholders, 5000);
  //     })
  //     .catch((ex) => {
  //       console.log("getTokenholders - error %o", ex)
  //       this.gettokenholderstimer = setTimeout(this.getTokenholders, 5000);
  //     })
  //   } catch(ex) {
  //     console.error("getTokenholders handler - error %s", ex.message);
  //   }
  // }

  resetDeployContract = () => {
    fetch('/api/test/redeploycontract')
    .then(result=>{
      console.log("done start redeploy contract %o", result);
    })
  }

  resetState = () => {
    fetch('/api/test/resetstate')
    .then(result=>{
      console.log("done reset state %o", result);
      // this.setState(prevState=>{ return {idToOwner: false }});
      this.getState();
    })
  }

  powerOff = () => {
    fetch('/api/poweroff')
    .then(result=>{
      console.log("done start poweroff", result);
    })
  }

  setUntrustedWallet = () => {
    let bip39 = prompt("Enter BIP39 mnemonic for the initiator wallet");
    if(false!==bip39&&null!=bip39) {
      fetch('/api/setuntrustedwallet?bip39='+ encodeURIComponent(bip39))
      .then(result=>{
        console.log("done creating untrusted wallet %o", result);
        this.getState();
      })
    } else {
      alert("initiator wallet not set");
    }
  }
  
  buyToken = () => {
    fetch('/api/test/buytoken')
    .then(result=>{
      console.log("done buying token %o", result);
      // this.setState(prevState=>{ return {idToOwner: false }});
      this.getState();
    })
  }
  
  sellTokens = () => {
    fetch('/api/selltokens')
    .then(result=>{
      console.log("done selling tokens %o", result);
      // this.setState(prevState=>{ return {idToOwner: false }});
      this.getState();
    })
  }

  render() {
    const { state, settings } = this.state; // , idToOwner
    // console.log("state %o", state);
    // console.log("steps %o", state, steps);
    
    const buttonstyle = {
      width: '25vh',
      color: 'white',
      borderColor: 'white'
    }
    
    if((undefined===state)||(state.step==='unknown')) {
      return (<div className="App"><h1>WAITING FOR CURRENT STATE</h1></div>)
    }
    
    let items = [];
    items.push(<OnboardingButton key={'item-' + items.length} />)
    items.push(<div key={'item-' + items.length}><br /></div>)
    
    if(settings===false) {
      items.push(<Typography key={'item-' + items.length} variant='h4'>Contacting server</Typography>);
    } else {
        let description = steps.getStepDescription(state);
        items.push(<Typography key={'item-' + items.length} variant='h4'>{ description }</Typography>);
        items.push(<Typography key={'item-' + items.length} variant='subtitle1'>Network: { settings.network }  [ { new Date(state.lastupdate).toLocaleString() } ]</Typography>);
    }
    items.push(<div key={'item-' + items.length}><br /></div>)
    
    if(state.untrustedwallet!==false) {
      items.push(<Typography key={'item-' + items.length} variant='h5'>Initiator Wallet</Typography>);
      items.push(<Typography  key={'item-' + items.length}>{ state.untrustedwallet.address } - { state.untrustedwallet.balance } ETH</Typography>);
      // items.push(<Typography  key={'item-' + items.length}>{ state.untrustedwallet.mnemonic }</Typography>);
      if(state.untrustedwallet.lasttransactionhash) {
        items.push(<Typography  key={'item-' + items.length}>{ state.untrustedwallet.lasttransactionhash } [ { state.untrustedwallet.lasttransactionage} ]</Typography>)
      }
      items.push(<div key={'item-' + items.length}><br /></div>)
    }

    if(state.step===steps.WAIT_FOR_SET_UNTRUSTED_WALLET) {
      items.push(<div key={'item-' + items.length}><br /></div>)
      items.push(<Button key={'item-' + items.length} variant="outlined" style={buttonstyle} onClick={this.setUntrustedWallet}>Set initiator wallet</Button>);
    }
    
    if(state.step===steps.WAIT_FOR_FUNDS_IN_UNTRUSTED_WALLET) {
      // nothing to do here
    }
    
    if(state.trustedwallet!==false) {
      let walletinfo = state.trustedwallet.address;
      if(state.trustedwallet.balance) {
        walletinfo += " - " + state.trustedwallet.balance + " ETH"
      }

      items.push(<Typography key={'item-' + items.length} variant='h5'>Copernicus Wallet</Typography>);
      items.push(<Typography key={'item-' + items.length}>{ walletinfo }</Typography>);
      if(state.trustedwallet.lasttransactionhash) {
        items.push(<Typography key={'item-' + items.length}>{ state.trustedwallet.lasttransactionhash } [ { state.trustedwallet.lasttransactionage} ]</Typography>)
      }
      items.push(<div key={'item-' + items.length}><br /></div>)
    }
    
    if(state.contract!==false) {
      let contractinfo = state.contract.address;
      if(state.contract.balance!==false) {
        contractinfo += " - " + state.contract.balance + " ETH"
      }
      
      items.push(<Typography key={'item-' + items.length} variant='h5'>Contract Address</Typography>);
      items.push(<Typography key={'item-' + items.length}>{ contractinfo  }</Typography>);
      if(state.contract.lasttransactionhash) {
        items.push(<Typography  key={'item-' + items.length}>{ state.contract.lasttransactionhash } [ { state.contract.lasttransactionage} ]</Typography>)
      }
      items.push(<div key={'item-' + items.length}><br /></div>)
      
      // if(idToOwner!==false) {
      //   items.push(<Typography key={'item-' + items.length} variant='h6'>Token Owners</Typography>);
      //   Object.keys(idToOwner).forEach((key)=>{
      //     let ownerlabel = idToOwner[key];
      //     if(idToOwner[key]==state.untrustedwallet.address) {
      //       ownerlabel = 'Initiator wallet'
      //     } else if(idToOwner[key]==state.trustedwallet.address) {
      //       ownerlabel = 'Copernicus wallet'
      //     }
      //     items.push(<Typography key={'item-' + items.length} >{key} - <a target="_blank" rel="noopener noreferrer" href={"https://rinkeby.etherscan.io/address/" + idToOwner[key]}>{ ownerlabel }</a></Typography>);
      //   })
      // } else {
      //   items.push(<Typography key={'item-' + items.length} variant='h6'>Token Owners</Typography>);
      //   items.push(<Typography key={'item-' + items.length} variant='h6'>- WAITING FOR LATEST STATUS -</Typography>);
      // }

      items.push(<div key={'item-' + items.length}><br /></div>)
      items.push(<Button key={'item-' + items.length} variant="outlined" style={buttonstyle} onClick={this.sellTokens}>CHECK OPEN SEA ORDERS AGAIN</Button>)
      // items.push(<div key={'item-' + items.length}><br /></div>)
      // items.push(<Button key={'item-' + items.length} variant="outlined" style={buttonstyle} onClick={this.buyToken}>BUY COPERNICUS TOKEN</Button>)
    }

    if(state.step!==steps.ROLLOUT_START) {
      items.push(<div key={'item-' + items.length}><br /></div>)
      items.push(<Button key={'item-' + items.length} variant="outlined" style={buttonstyle} onClick={this.resetDeployContract}>RE-DEPLOY CONTRACT</Button>)
      items.push(<div key={'item-' + items.length}><br /></div>)
      items.push(<Button key={'item-' + items.length} variant="outlined" style={buttonstyle} onClick={this.resetState}>RESET TO ZERO STATE</Button>)
      items.push(<div key={'item-' + items.length}><br /></div>)
      items.push(<Button key={'item-' + items.length} variant="outlined" style={buttonstyle} onClick={this.powerOff}>POWER OFF</Button>)
      items.push(<div key={'item-' + items.length}><br /></div>)
    }
    
    return (
      <div className="App" style={{display: 'flex', flexDirection:'column', justifyContent: 'space-around', alignItems: 'center'}}>
        {
          items
        }
      </div>
    );
  }
}

export default App;