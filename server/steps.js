// steps
const ROLLOUT_START = 0;
const WAIT_FOR_COMPILED_CONTRACT = 0;
const WAIT_FOR_SET_UNTRUSTED_WALLET = 1;
const WAIT_FOR_FUNDS_IN_UNTRUSTED_WALLET = 2;
const WAIT_FOR_CREATE_TRUSTED_WALLET = 3;
const WAIT_FOR_FUNDS_IN_TRUSTED_WALLET = 4;
const WAIT_FOR_FUNDS_IN_TRUSTED_WALLET_CONFIRMED = 5;
const WAIT_FOR_CONTRACT_DEPLOYED = 6;
const WAIT_FOR_CONTRACT_DEPLOYED_CONFIRMED = 7;
const WAIT_FOR_SELLORDERS_CREATED = 8;
const ROLLOUT_COMPLETE = 9;
const ROLLOUT_FAILED_UNABLE_TO_COMPILE_CONTRACTS = 10;

// only used during testing:
const RESET_START = 20;
const RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT = 21;
const RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED = 22;
const RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET = 23;
const RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET_CONFIRMED = 24;
const RESET_CLEANUP_STATUS = 25;

const getStepDescription = (state) => {
  let description = '';
  switch(state.step) {
    case ROLLOUT_START:
      description="Clean state after reset";
      break;
    case WAIT_FOR_COMPILED_CONTRACT:
      description="Waiting for compiled smart contract";
      break;
    case WAIT_FOR_SET_UNTRUSTED_WALLET:
      description="Waiting for initiator wallet info";
      break;
    case WAIT_FOR_FUNDS_IN_UNTRUSTED_WALLET:
      description="Waiting for funds in the initiator wallet";
      break;
    case WAIT_FOR_CREATE_TRUSTED_WALLET:
      description="Waiting for creation of the copernicus wallet";
      break;
    case WAIT_FOR_FUNDS_IN_TRUSTED_WALLET:
      description="Waiting for funds in the copernicus wallet";
      break;
    case WAIT_FOR_FUNDS_IN_TRUSTED_WALLET_CONFIRMED:
      description="Waiting for confirmation of funds in the copernicus wallet";
      break;
    case WAIT_FOR_CONTRACT_DEPLOYED:
      description="Waiting for contract deployment";
      break;
    case WAIT_FOR_CONTRACT_DEPLOYED_CONFIRMED:
      description="Waiting for contract deployment (confirmation)";
      break;
    case WAIT_FOR_SELLORDERS_CREATED:
      description="Create sell orders for all tokens";
      break;
    case ROLLOUT_COMPLETE:
      description="Rollout complete";
      break;
    case ROLLOUT_FAILED_UNABLE_TO_COMPILE_CONTRACTS:
      description="Rollout failed - unable to compile contracts";
      break;
    case RESET_START:
      description="Reset - Start";
      break;
    case RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT:
      description="Reset - Extracting funds from the contract";
      break;
    case RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED:
      description="Reset - Waiting for extracting funds from the contract (confirmation)";
      break;
    case RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET:
      description="Reset - Extracting funds from the copernicus wallet";
      break;
    case RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET_CONFIRMED:
      description="Reset - Waiting for extracted funds from the copernicus wallet (confirmation)";
      break;
    case RESET_CLEANUP_STATUS:
      description="Reset - Cleaning up local files";
      break;
    default:
      description="Invalid state (" + state.step + ")";
      break;
  }
  
  return description;
}

module.exports = {
  ROLLOUT_START,
  WAIT_FOR_COMPILED_CONTRACT,
  WAIT_FOR_SET_UNTRUSTED_WALLET,
  WAIT_FOR_FUNDS_IN_UNTRUSTED_WALLET,
  WAIT_FOR_CREATE_TRUSTED_WALLET,
  WAIT_FOR_FUNDS_IN_TRUSTED_WALLET,
  WAIT_FOR_FUNDS_IN_TRUSTED_WALLET_CONFIRMED,
  WAIT_FOR_CONTRACT_DEPLOYED,
  WAIT_FOR_SELLORDERS_CREATED,
  ROLLOUT_COMPLETE,
  ROLLOUT_FAILED_UNABLE_TO_COMPILE_CONTRACTS,
  RESET_START,
  RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT,
  RESET_WITHDRAW_FUNDS_FROM_THE_CONTRACT_CONFIRMED,
  RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET,
  RESET_TRANSFER_FUNDS_FROM_THE_TRUSTED_WALLET_CONFIRMED,
  RESET_CLEANUP_STATUS,
  getStepDescription
}