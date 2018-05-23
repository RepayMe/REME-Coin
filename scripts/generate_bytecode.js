require('dotenv').config({path: __dirname + '/../.env'});

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3();
var ethereumjsAbi = require('ethereumjs-abi')

const abi = JSON.parse(fs.readFileSync(__dirname + "/../build/contracts/RemeCoin.json")).abi;
const bytecode = JSON.parse(fs.readFileSync(__dirname + "/../build/contracts/RemeCoin.json")).bytecode;

const RemeCoin = web3.eth.contract(abi);

const parameters = {
  fee: process.env.FEE,
  feeBeneficiary: process.env.FEE_BENEFICIARY,
  feeThreshold: web3.toWei(process.env.FEE_THRESHOLD, 'ether')
};

var bytecodeWithParams = RemeCoin.new.getData(
  parameters.fee,
  parameters.feeBeneficiary,
  parameters.feeThreshold,
  { data: bytecode }
);

var constructorBytecode = ethereumjsAbi.rawEncode(
  [
    "uint",
    "address",
    "uint",
  ],
  [
    parameters.fee,
    parameters.feeBeneficiary,
    parameters.feeThreshold
  ]
);

fs.writeFileSync(__dirname + '/../deployment/abi.txt', JSON.stringify(abi));
fs.writeFileSync(__dirname + '/../deployment/bytecode.txt', bytecodeWithParams);
fs.writeFileSync(__dirname + '/../deployment/constructor_bytecode.txt', constructorBytecode.toString('hex'));