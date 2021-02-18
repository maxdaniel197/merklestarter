import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import store from 'store';
import {
  setWeb3,
  setAddress,
  setToken,
  setStarter,
  setTranche,
  setClaimableAmount,
} from 'store/actions.js';

import MerkleStarter from '../contracts/MerkleStarter.json';
import IERC20 from '../contracts/IERC20.json';

const starterAddress = process.env.REACT_APP_STARTER_ADDRESS;
const tokenAddress = process.env.REACT_APP_TOKEN_ADDRESS;

export const connectMetaMask = async () => {
  // this returns the provider, or null if it wasn't detected
  const provider = await detectEthereumProvider();
  const ethereum = window.ethereum;
  if (provider) {
    startApp(provider); // Initialize your app
  } else {
    console.log('Please install MetaMask!');
  }

  async function startApp(provider) {
    // If the provider returned by detectEthereumProvider is not the same as
    // window.ethereum, something is overwriting it, perhaps another wallet.
    if (provider !== window.ethereum) {
      console.error('Do you have multiple wallets installed?');
    } else {
      const web3 = new Web3(window.ethereum);
      const starter = new web3.eth.Contract(MerkleStarter.abi, starterAddress);
      const token = new web3.eth.Contract(IERC20.abi, tokenAddress);

      let tranche = await starter.methods.tranches().call();
      tranche -= 1;

      store.dispatch(setStarter(starter));
      store.dispatch(setToken(token));
      store.dispatch(setWeb3(web3));
      store.dispatch(setTranche(tranche));
      connect();
    }
    // Access the decentralized web!
  }

  /**********************************************************/
  /* Handle chain (network) and chainChanged (per EIP-1193) */
  /**********************************************************/

  // Normally, we would recommend the 'eth_chainId' RPC method, but it currently
  // returns incorrectly formatted chain ID values.

  ethereum.on('chainChanged', handleChainChanged);

  function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    window.location.reload();
  }

  /***********************************************************/
  /* Handle user accounts and accountsChanged (per EIP-1193) */
  /***********************************************************/

  let currentAccount = null;
  ethereum
    .request({ method: 'eth_accounts' })
    .then(handleAccountsChanged)
    .catch((err) => {
      // Some unexpected error.
      // For backwards compatibility reasons, if no accounts are available,
      // eth_accounts will return an empty array.
      console.error(err);
    });

  // Note that this event is emitted on page load.
  // If the array of accounts is non-empty, you're already
  // connected.
  ethereum.on('accountsChanged', handleAccountsChanged);

  // For now, 'eth_accounts' will continue to always return an array
  async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
      store.dispatch(setAddress(null));
    } else if (accounts[0] !== currentAccount) {
      const web3 = new Web3(window.ethereum);
      currentAccount = web3.utils.toChecksumAddress(accounts[0]);
      store.dispatch(setAddress(currentAccount));

      const starter = new web3.eth.Contract(MerkleStarter.abi, starterAddress);
      let tranche = await starter.methods.tranches().call();
      let claimableAmount = 0;
      for (let i = 0; i < tranche; i++) {
        const isClaimed = await starter.methods.claimed(i, currentAccount).call();
        if (isClaimed) {
          continue;
        }
        let res = await fetch(`${process.env.REACT_APP_SERVER_URL}/status/${i}/${currentAccount}`);
        if (res.status === 200) {
          let { amount } = await res.json();
          claimableAmount += parseInt(amount);
        }
      }
      store.dispatch(setClaimableAmount(claimableAmount));
    }
  }

  /*********************************************/
  /* Access the user's accounts (per EIP-1102) */
  /*********************************************/

  // You should only attempt to request the user's accounts in response to user
  // interaction, such as a button click.
  // Otherwise, you popup-spam the user like it's 1999.
  // If you fail to retrieve the user's account(s), you should encourage the user
  // to initiate the attempt.

  function connect() {
    ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(handleAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err);
        }
      });
  }
};
