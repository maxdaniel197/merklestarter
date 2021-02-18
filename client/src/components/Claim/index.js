import React from 'react';
import { message } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from 'store/actions';
import BN from 'bn.js';
import './style.css';

export default function Claim() {
  const dispatch = useDispatch();
  const token = process.env.REACT_APP_TOKEN_ADDRESS;
  const address = useSelector((state) => state.address);
  const tranche = useSelector((state) => state.tranche);
  const starter = useSelector((state) => state.starter);

  const tranches = useSelector((state) => state.tranches);
  const proofs = useSelector((state) => state.proofs);
  const balances = useSelector((state) => state.balances);
  const claimableAmount = useSelector((state) => state.claimableAmount);

  const claim = async () => {
    try {
      if (!address) {
        message.error('Please connect wallet first.');
        return;
      }
      if (claimableAmount === 0) {
        message.error('You have nothing to claim.');
        return;
      }

      dispatch(actions.setLoading(true));
      const result = await starter.methods
        .multiClaim(address, tranches, balances, proofs)
        .send({ from: address });
      if (result.status) {
        message.success('Receive Token successfully');
        dispatch(actions.setClaimableAmount(0));
      }
      dispatch(actions.setLoading(false));
    } catch (err) {
      dispatch(actions.setLoading(false));
      if (err.code === 4001) {
        return;
      }
      message.error('Claim has failed');
    }
  };

  return (
    <div>
      <a className='btn-icon wow fadeIn' href='#' onClick={() => claim()}>
        <strong>Claim starter tokens</strong>
      </a>

      <ol className='add-token'>
        <li>
          Open MetaMask, in <strong>Assets</strong> tab, click <strong>Add Token</strong>
        </li>
        <li>
          Choose <strong>Custom Token</strong>
        </li>
        <li>Fill Token address: {token}</li>
      </ol>
    </div>
  );
}
