require('dotenv').config();
const fs = require('fs');
const fastcsv = require('fast-csv');
const mongodb = require('mongodb').MongoClient;
const path = require('path');
const { ethers } = require('ethers');
const { Contract } = ethers;
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;

async function insertToDB(tranche, dataFile) {
  let stream = fs.createReadStream(path.resolve(__dirname, dataFile));
  let csvData = [];
  let csvStream = fastcsv
    .parse({ headers: false })
    .on('data', function (data) {
      csvData.push({
        tranche: tranche.toString(),
        address: data[0].toLowerCase(),
        amount: parseInt(data[1]).toString(),
      });
    })
    .on('end', function () {
      if (csvData.length < 2) {
        csvData.push({
          tranche: tranche.toString(),
          address: '0x0000000000000000000000000000000000000000',
          amount: '0',
        });
      }
      mongodb.connect(
        process.env.MONGODB_URI,
        { useNewUrlParser: true, useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          client
            .db('merklestarter')
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
}

async function main() {
  try {
    const tranche = argv.tranche;
    if (tranche !== parseInt(tranche, 10)) {
      console.error('Please provide a valid tranche by flag --tranche');
      process.exit(1);
    }

    const starterAddress = process.env.STARTER_ADDRESS;
    const starterABI = require(path.resolve(__dirname, '..', 'contracts', 'MerkleStarter.json'))
      .abi;
    const provider = new ethers.providers.InfuraProvider('rinkeby', process.env.INFURA_ID);
    const starter = new Contract(starterAddress, starterABI, provider);
    const currentTranche = (await starter.tranches()).toNumber() - 1;
    if (tranche < 0 || tranche > currentTranche) {
      console.log(`tranche must be 0 <= tranche <= ${currentTranche}`);
      process.exit(1);
    }

    const dataFile = argv.dataFile;
    if (!dataFile) {
      console.error('Please provide data file by flag --dataFile');
      process.exit(1);
    }
    await insertToDB(tranche, dataFile);
  } catch (err) {
    console.log('Something went wrong! Please try again.');
  }
}

main();
