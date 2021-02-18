const router = require('express').Router();
const { validationResult, check } = require('express-validator');
const Whitelist = require('../models/Whitelist');
const { ethers } = require('ethers');
require('dotenv').config();

router.get('/:tranche/:address', async (req, res) => {
  try {
    let { tranche, address } = req.params;
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ msg: 'Address is invalid' });
    }

    const result = await Whitelist.findOne({ tranche, address });

    if (!result) {
      return res.status(404).json({ msg: 'Address has not registered' });
    }

    const { amount } = result;

    return res.status(200).json({
      tranche,
      address,
      amount,
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Internal Server Error' });
  }
});

module.exports = router;
