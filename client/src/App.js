import React, { useEffect, useState } from 'react';
import { Collapse, Navbar, NavbarToggler, NavbarBrand, Nav, NavItem } from 'reactstrap';
import ConnectWallet from 'components/ConnectWallet';
import Status from 'components/Status';
import Claim from 'components/Claim';
import { BackTop, Spin } from 'antd';
import { connectMetaMask } from 'utils/connectMetaMask';
import { useSelector } from 'react-redux';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import './App.css';
import { Button } from 'antd';
import Web3 from 'web3';
import store from 'store';
import BN from 'bn.js';

import {
  setWeb3,
  setAddress,
  setToken,
  setStarter,
  setTranche,
  setClaimableAmount,
  setLoading,
  setTranches,
  setProofs,
  setBalances,
} from 'store/actions.js';

import MerkleStarter from 'contracts/MerkleStarter.json';
import IERC20 from 'contracts/IERC20.json';
import './assets/scss/style-landing-page.scss';

const starterAddress = process.env.REACT_APP_STARTER_ADDRESS;
const tokenAddress = process.env.REACT_APP_TOKEN_ADDRESS;

function App() {
  const loading = useSelector((state) => state.loading);
  const address = useSelector((state) => state.address);
  const [isOpen, setIsOpen] = useState(false);
  let web3 = null;
  const toggle = () => setIsOpen(!isOpen);
  let [mainmenuArea, setMainmenuArea] = useState('');

  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: process.env.REACT_APP_INFURA_ID,
      },
    },
  };
  const web3Modal = new Web3Modal({
    network: process.env.REACT_APP_NETWORK_ID,
    cacheProvider: true,
    providerOptions,
  });

  const onConnect = async () => {
    await web3Modal.clearCachedProvider();
    const provider = await web3Modal.connect();
    store.dispatch(setLoading(true));
    await subscribeProvider(provider);
    web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const currentAccount = accounts[0].toLowerCase();
    store.dispatch(setWeb3(web3));
    store.dispatch(setAddress(currentAccount));

    let starter = new web3.eth.Contract(MerkleStarter.abi, starterAddress);
    const token = new web3.eth.Contract(IERC20.abi, tokenAddress);

    let tranche = await starter.methods.tranches().call({ from: currentAccount });

    let claimableAmount = 0;
    const tranches = [];
    const proofs = [];
    const balances = [];

    for (let i = 0; i < tranche; i++) {
      const isClaimed = await starter.methods.claimed(i, currentAccount).call();
      if (isClaimed) {
        continue;
      }
      let res;
      res = await fetch(`${process.env.REACT_APP_SERVER_URL}/proof/${i}/${currentAccount}`);
      if (res.status !== 200) continue;
      let { proof } = await res.json();
      res = await fetch(`${process.env.REACT_APP_SERVER_URL}/status/${i}/${currentAccount}`);
      if (res.status !== 200) continue;
      let { amount } = await res.json();
      claimableAmount += parseInt(amount);
      amount = new BN(amount + '000000000000000000');
      tranches.push(i);
      proofs.push(proof);
      balances.push(amount);
    }

    store.dispatch(setClaimableAmount(claimableAmount));
    store.dispatch(setStarter(starter));
    store.dispatch(setToken(token));
    store.dispatch(setTranche(tranche));
    store.dispatch(setTranches(tranches));
    store.dispatch(setProofs(proofs));
    store.dispatch(setBalances(balances));
    store.dispatch(setLoading(false));
  };

  const subscribeProvider = async (provider) => {
    if (!provider.on) {
      return;
    }
    provider.on('close', async () => {
      window.location.reload();
    });
    provider.on('accountsChanged', async (accounts) => {
      console.log('on accountsChanged');
      window.location.reload();
    });
    provider.on('chainChanged', async (chainId) => {
      console.log('on chainChanged');
      window.location.reload();
    });
    provider.on('networkChanged', async (networkId) => {
      console.log('on networkChanged', networkId);
      window.location.reload();
    });
  };

  return (
    <div className='landing-page-style'>
      <BackTop />
      <Navbar light expand='md' className={`navbar-menu ${mainmenuArea}`}>
        <div className='container'>
          <NavbarToggler onClick={toggle} />
          <Collapse isOpen={isOpen} navbar>
            <Nav className='mr-auto menu-landing-page' navbar>
              <NavItem></NavItem>
              <NavItem></NavItem>
              <NavItem></NavItem>
            </Nav>
            {/* <ConnectWallet /> */}
            {address ? <p>{address}</p> : <Button onClick={() => onConnect()}>Connect</Button>}
          </Collapse>
        </div>
      </Navbar>
      <div className='header-area'>
        <div className='vcenter'>
          <div className='container'>
            <div className='row row-middle'>
              <div className='col-12 col-sm-8 col-md-7 left-header-area'>
                <Status />
                <div className='space-30 hidden-xs'></div>
                <Claim />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Spin spinning={loading} size='500' tip='Loading, please wait...'></Spin>
    </div>
  );
}

export default App;
