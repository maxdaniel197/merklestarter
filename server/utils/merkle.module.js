const Web3Util = require('web3-utils');
const EthUtil = require('ethereumjs-util');
const BN = require('bn.js');

const getTranche = function (...accountBalances) {
  return accountBalances.reduce(
    (prev, [account, balance, claimed]) => ({
      ...prev,
      [account]: { balance, claimed },
    }),
    {}
  );
};

const bufArrToHexArr = function (arr) {
  if (arr.some(el => !Buffer.isBuffer(el))) {
    throw new Error('Array is not an array of buffers');
  }

  return arr.map(el => `0x${el.toString('hex')}`);
};

const bufIndexOf = function (el, arr) {
  let hash;

  if (el.length !== 32 || !Buffer.isBuffer(el)) {
    hash = keccakFromString(el.toString());
  } else {
    hash = el;
  }

  for (let i = 0; i < arr.length; i++) {
    if (hash.equals(arr[i])) {
      return i;
    }
  }

  return -1;
};

const createTreeWithAccounts = async function (accounts) {
  const elements = Object.entries(accounts).map(([account, { balance }]) =>
    Web3Util.soliditySha3(account.toLowerCase(), balance.toString())
  );

  return createMerkleTree(elements);
};

const createMerkleTree = function (_elements) {
  let elements = _elements.filter(el => el).map(el => Buffer.from(Web3Util.hexToBytes(el)));

  elements = elements.sort(Buffer.compare);

  elements = bufDedup(elements);

  let layers = getLayers(elements);

  let MerkleTree = {
    elements: elements,
    layers: layers,
  };

  return MerkleTree;
};

const bufDedup = function (_elements) {
  return _elements.filter((el, idx) => {
    return idx === 0 || !_elements[idx - 1].equals(el);
  });
};

const getLayers = function (_elements) {
  if (_elements.length === 0) {
    return [['']];
  }

  let layers = [];
  layers.push(_elements);

  while (layers[layers.length - 1].length > 1) {
    layers.push(getNextLayer(layers[layers.length - 1]));
  }
  return layers;
};

const getNextLayer = function (_elements) {
  return _elements.reduce((layer, el, idx, arr) => {
    if (idx % 2 === 0) {
      layer.push(combinedHash(el, arr[idx + 1]));
    }
    return layer;
  }, []);
};

const combinedHash = function (first, second) {
  if (!first) {
    return second;
  }
  if (!second) {
    return first;
  }

  return EthUtil.keccak256(sortAndConcat(first, second));
};

const sortAndConcat = function (...args) {
  return Buffer.concat([...args].sort(Buffer.compare));
};

const root = function (layers) {
  return layers[layers.length - 1][0];
};

const hexRoot = function (root) {
  return EthUtil.bufferToHex(root);
};

const getAccountBalanceProof = function (tree, account, balance) {
  const element = Web3Util.soliditySha3(account.toLowerCase(), balance.toString());
  return getHexProof(element, tree.elements, tree.layers);
};

const getHexProof = function (element, elements, layers) {
  const el = Buffer.from(Web3Util.hexToBytes(element));

  const proof = getProof(el, elements, layers);
  return bufArrToHexArr(proof);
};

const getProof = function (el, elements, layers) {
  let idx = bufIndexOf(el, elements);

  if (idx === -1) {
    throw new Error('Element does not exist in Merkle tree');
  }

  return layers.reduce((proof, layer) => {
    const pairElement = getPairElement(idx, layer);

    if (pairElement) {
      proof.push(pairElement);
    }

    idx = Math.floor(idx / 2);

    return proof;
  }, []);
};

const getPairElement = function (idx, layer) {
  const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

  if (pairIdx < layer.length) {
    return Buffer(layer[pairIdx]);
  }
  return null;
};

const createTree = async function (tranche) {
  try {
    const tree = await createTreeWithAccounts(tranche);

    const totalAmount = Object.values(tranche).reduce(
      (prev, current) => prev.add(current.balance),
      new BN(0)
    );
    return { tree: tree, balances: tranche, totalAmount: totalAmount };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

module.exports = { getTranche, getAccountBalanceProof, createTree, root, hexRoot };
