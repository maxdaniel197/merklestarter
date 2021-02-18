import React from 'react';
import { Button } from 'antd';
import './style.css';
import { useSelector } from 'react-redux';
import { connectMetaMask } from 'utils/connectMetaMask';

export default function ConnectWallet() {
  const web3 = useSelector(state => state.web3);
  const address = useSelector(state => state.address);

  const connect = () => {
    connectMetaMask();
  };

  const splitAddress = address => {
    let head = address.slice(0, 6);
    let tail = address.slice(-4);
    address = `${head}...${tail}`;
    return address;
  };

  return (
    <div>
      {web3 && address ? (
        <p>{splitAddress(address)}</p>
      ) : (
        <Button onClick={() => connect()}>Connect MetaMask</Button>
      )}
    </div>
  );
}
