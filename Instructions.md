# Merkle Starter

## Intro

- **Merkle Starter**: Operator will create a mechanism to store whitelist information with a data structure called Merkle Tree. With this mechanism, operator now cost only 1 transaction each time they want to do whitelist. Distribute cost now are pushed to user, they must send a claim transaction to get their tokens.

## Repo structure

Merkle Starter system contains 3 part:

- `contracts`: write and deploy `MerkleStarter` contract.
- `server`: Store all merkle whitelist data, imported by csv file.
- `client`: connect wallet and claim data.

## Deployment

> **IMPORTANT**: Don't post your private key in any where public, don't share to any body. If you lose your key, you will lose you money.

### Contract

Step 1: install dependencies:

```js
npm install
```

Step 2: Copy `.env.example` to a new `.env` file and fill your environment variables here:

```js
INFURA_ID=<fill infura id here>
PRIVATE_KEY=<fill private key here>
TOKEN_ADDRESS=<fill your token address here>
```

if you not have a infura id, go to `https://infura.io/` to register one.

Step 3: run deployment with a specific network

```js
truffle migrate --reset --network <fill network here>
```

for example

```js
truffle migrate --reset --network rinkeby
```

if you want to config more network, you can add/change it in `truffle-config.js`, example:

```js
rinkeby: {
  provider: new HDWalletProvider(
    process.env.PRIVATE_KEY,
    'https://rinkeby.infura.io/v3/' + process.env.INFURA_ID
  ),
  network_id: '4',
},
```

at end of migration, you can see deployed `MerkleStarter` contract address in terminal. Or you can get address in `contracts/build/contracts/MerkleStarter.json` file.

### Server

Server is the most important part in Merkle Starter.

- Step 1: prepare your server, i recommend use a Ubuntu server.
- Step 2: Install mongodb and run it on: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
- Step 3: Install node and npm if needed. I'm using node v12.16.1. I recommend to use `nvm` to install node.
- Step 4: Go to `server` then install dependencies:

```js
npm install
```

- Step 5: Copy `.env.example` to a new `.env` file and fill your environment variables here:

```js
MONGODB_URI=<mongodb uri, for default you can use 'mongodb://localhost:27017'>
NETWORK_ID=<your using network id, ex mainnet = 1, rinkeby = 4>
PRIVATE_KEY=<your private key>
INFURA_ID=<your infura id>
TOKEN_ADDRESS=<your token address>
STARTER_ADDRESS=<deployed above MerkleStarter contract address>
```

- Step 5: Prepare your csv file, place it in `operator` folder. For example `0.csv`
- Step 6: seed merkle root to `MerkleStarter` contract. Run:

```js
node operator/seed --dataFile=<your csv file placed in operator folder here>
```

for example

```js
node operator/seed --dataFile=0.csv
```

> IMPORTANT: once data go to contract, it can't be reversed. So please check your csv file properly before start whitelist.

- Step 7: import Merkle data to mongodb.

> Note: unlike step 6, here is insert to your mongodb, which can be edited if you face some errors.

Run:

```js
node operator/import.js --tranche=<current whitelist turn> --dataFile=<your csv file placed in operator folder here>
```

for example

```js
node operator/import.js --tranche=0 --dataFile=0.csv
```

> IMPORTANT: tranche must be exactly the turn that you seeded to MerkleStarter contract. So to be clear, i recommend you to name the csv data file to be same as the whitelist turn, for example `0.csv` for first turn, `1.csv` for second turn.

- Step 8.0: if you want to run a local version, just run:

```js
npm start
```

your server now running on `http://localhost:8000`

- Step 8.1: run server online

I recommend to use `pm2` to run server as a daemon. Install `pm2` by:

```js
npm install pm2@latest -g
```

Then start server:

```js
pm2 start bin/www --name whitelist-v2
```

Your server now run at `serverIP:8000`.

### Client

- Step 1: go to client, install dependencies:

```js
npm install
```

- Step 2: Copy `.env.example` to a new `.env` file and fill your environment variables here:

```js
SKIP_PREFLIGHT_CHECK=true
REACT_APP_SERVER_URL=<your server url>
REACT_APP_NETWORK_ID=<network id>
REACT_APP_TOKEN_ADDRESS=<your token address>
STARTER_ADDRESS=<deployed above MerkleStarter contract>
REACT_APP_INFURA_ID=<your Infura ID>
```

- Step 3.0: if you want to run local version, just run:

```js
npm start
```

- Step 3.1: if you want to deploy a live version, you can use `Firebase hosting` for easy page end with `web.app`

fist build your client

```js
npm run build
```

install firebase hosting:https://firebase.google.com/docs/hosting/quickstart

then init firebase:

```js
firebase init hosting
```

then deploy to firebase host

```js
firebase deploy --only hosting
```

Now your web live at `your-web-name.web.app`

## Deploy use your own domain

For https and run with your domain, i recommend add your domain to Cloudflare, point a DNS to your server.
Then in your server, you setup nginx to redirect domain name your server/client URL.

## LICENSE

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](./LICENSE)


