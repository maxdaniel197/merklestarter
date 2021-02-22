require('dotenv').config();
const MerkleStarter = artifacts.require('./MerkleStarter.sol');

module.exports = async function (deployer) {
  const tokenAddress = process.env.TOKEN_ADDRESS;
  await deployer.deploy(MerkleStarter, tokenAddress, '2000000000000000');
};
