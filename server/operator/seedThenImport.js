require('dotenv').config();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const BN = require('bn.js');
const fs = require('fs');
const Merkle = require('../utils/merkle.module');
const fastcsv = require('fast-csv');
const csv = require('csv-parser');
const mongodb = require('mongodb').MongoClient;
const { ethers } = require('ethers');
const { Contract, Wallet } = ethers;
const path = require('path');

async function seedNewAllocations(dataFile) {
  try {
    var provider = new ethers.providers.InfuraProvider('rinkeby', process.env.INFURA_ID);
    var wallet = new Wallet(process.env.PRIVATE_KEY, provider);
    const listeners = [];
    let totalAllocation = new BN('0');
    const s = fs.createReadStream(path.resolve(__dirname, dataFile)).pipe(csv({ headers: false }));
    for await (const row of s) {
      const values = Object.values(row);
      const user = values[0].toLowerCase();
      const alloc = new BN(values[1] + '000000000000000000');
      totalAllocation = totalAllocation.add(alloc);
      listeners.push([user, alloc]);
    }

    if (listeners.length < 2) {
      listeners.push(['0x0000000000000000000000000000000000000000', new BN('0')]);
    }

    let tranche = await Merkle.getTranche(...listeners);
    let tree = await Merkle.createTree(tranche);
    let treeRoot = Merkle.root(tree.tree.layers);
    let merkleRoot = Merkle.hexRoot(treeRoot);

    totalAllocation = totalAllocation.toString();
    console.log('merkleRoot', merkleRoot);
    console.log('totalAllocation', totalAllocation);

    const tokenAddress = process.env.TOKEN_ADDRESS;
    const erc20ABI = require(path.resolve(__dirname, '..', 'contracts', 'IERC20.json')).abi;
    const starterAddress = process.env.STARTER_ADDRESS;
    const starterABI = require(path.resolve(__dirname, '..', 'contracts', 'MerkleStarter.json'))
      .abi;
    let token = new Contract(tokenAddress, erc20ABI, provider).connect(wallet);
    let starter = new Contract(starterAddress, starterABI, provider).connect(wallet);

    let tx;
    tx = await token.approve(starterAddress, totalAllocation);
    await tx.wait();
    console.log('approve done !');

    tx = await starter.seedNewAllocations(merkleRoot, totalAllocation);
    await tx.wait();

    console.log('Seed new allocation done !');
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

async function insertToDB(dataFile) {
  try {
    var provider = new ethers.providers.InfuraProvider('rinkeby', process.env.INFURA_ID);
    const starterAddress = process.env.STARTER_ADDRESS;
    const starterABI = require(path.resolve(__dirname, '..', 'contracts', 'MerkleStarter.json'))
      .abi;
    let starter = new Contract(starterAddress, starterABI, provider);

    const currentTranche = (await starter.tranches()).toNumber() - 1;

    let stream = fs.createReadStream(path.resolve(__dirname, dataFile));
    let csvData = [];
    let csvStream = fastcsv
      .parse()
      .on('data', function (data) {
        csvData.push({
          tranche: currentTranche.toString(),
          address: data[0].toLowerCase(),
          amount: parseInt(data[1]).toString(),
        });
      })
      .on('end', function () {
        if (csvData.length < 2) {
          csvData.push({
            tranche: currentTranche.toString(),
            address: '0x0000000000000000000000000000000000000000',
            amount: '0',
          });
        }
        mongodb.connect(
          'mongodb://localhost:27017',
          { useNewUrlParser: true, useUnifiedTopology: true },
          (err, client) => {
            if (err) throw err;
            client
              .db('starter')
              .collection('listeners')
              .insertMany(csvData, (err, res) => {
                if (err) throw err;
                console.log(`Inserted: ${res.insertedCount} rows`);
                client.close();
              });
          }
        );
      });

    stream.pipe(csvStream);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

async function main() {
  const dataFile = argv.dataFile;
  if (!dataFile) {
    console.error('Please provide data file by flag --dataFile');
    process.exit(1);
  }
  await seedNewAllocations(dataFile);
  await insertToDB(dataFile);
}

main();
