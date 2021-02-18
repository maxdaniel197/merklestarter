import React, { useState, useEffect } from 'react';
import './style.css';
import { useSelector } from 'react-redux';
import BN from 'bn.js';

export default function Status() {
  const address = useSelector((state) => state.address);
  const token = useSelector((state) => state.token);
  const claimableAmount = useSelector((state) => state.claimableAmount);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function getBalance() {
      if (token && address) {
        const unit = new BN('1000000000000000000');
        let result = await token.methods.balanceOf(address).call();
        result = new BN(result);

        result = result.div(unit);
        result = parseInt(result);
        setBalance(result);
      }
    }

    getBalance();
  });

  return (
    <div>
      <p className='balance'>Balance: {balance}</p>
      <p className='balance'>Claimable Amount: {claimableAmount}</p>
    </div>
  );
}
