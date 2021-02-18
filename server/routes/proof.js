const router = require('express').Router();
const BN = require('bn.js');
const TRANCHES = require('../constants/tranches').TRANCHES;
const Whitelist = require('../models/Whitelist');
const Merkle = require('../utils/merkle.module');
const { ethers } = require('ethers');

require('dotenv').config();

router.get('/:trancheId/:address', async (req, res) => {
  try {
    if (!ethers.utils.isAddress(req.params.address)) {
      return res.status(400).json({ msg: 'Address is invalid' });
    }

    let { trancheId, address } = req.params;
    console.log(trancheId, address);
    const info = await Whitelist.findOne({ tranche: trancheId, address });
    console.log(info);
    if (!info) return res.status(500).json({ msg: 'Internal Server Error' });
    let { amount } = info;
    amount = new BN(amount.toString() + '000000000000000000');
    let result = await Whitelist.find({ tranche: trancheId });
    let list = [];
    for (let i = 0; i < result.length; i++) {
      list.push([result[i].address, new BN(result[i].amount.toString() + '000000000000000000')]);
    }
    let tranche = await Merkle.getTranche(...list);
    let tree = await Merkle.createTree(tranche);

    let proof = await Merkle.getAccountBalanceProof(tree.tree, address, amount);

    return res.status(200).json({ proof: proof });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: 'Internal Server Error' });
  }
});

module.exports = router;
