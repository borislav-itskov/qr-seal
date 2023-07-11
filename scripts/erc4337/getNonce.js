const { EntryPoint__factory } = require("@account-abstraction/contracts")
const { StaticJsonRpcProvider } = require("@ethersproject/providers")
const { ethers } = require("ethers")
const { rpcs } = require("./config")
require('dotenv').config();
const ERC4337Account = require('../../artifacts/contracts/ERC4337Account.sol/ERC4337Account.json')
const salt = '0x0'

function getAmbireAccountAddress(factoryAddress, bytecode) {
  return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}

function getSchnorrAddress(pk) {
  const publicKey = ethers.utils.arrayify(ethers.utils.computePublicKey(ethers.utils.arrayify(pk), true))
  const px = ethers.utils.hexlify(publicKey.slice(1, 33))
  const hash = ethers.utils.keccak256(ethers.utils.solidityPack(['string', 'bytes'], ['SCHNORR', px]))
  return '0x' + hash.slice(hash.length - 40, hash.length)
}

const run = async () => {
  const someWallet = ethers.Wallet.createRandom()
  const pk = someWallet.privateKey
  const AMBIRE_ACCOUNT_FACTORY_ADDR = "0x153E957A9ff1688BbA982856Acf178524aF96D78"
  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
  const provider = new StaticJsonRpcProvider(rpcs.mumbai)
  const entryPoint = EntryPoint__factory.connect(ENTRY_POINT_ADDRESS, provider)
  const owner = new ethers.Wallet(pk, provider)
  const abicoder = new ethers.utils.AbiCoder()
  const schnorrVirtualAddr = getSchnorrAddress(pk)
  const bytecodeWithArgs = ethers.utils.concat([
    ERC4337Account.bytecode,
    abicoder.encode(['address', 'address[]'], [ENTRY_POINT_ADDRESS, [owner.address, schnorrVirtualAddr]])
  ])

  const senderAddress = getAmbireAccountAddress(AMBIRE_ACCOUNT_FACTORY_ADDR, bytecodeWithArgs)
  const senderNonce = await entryPoint.getNonce(senderAddress, 0)
  console.log(senderNonce)

  const alreadyExistingNonce = await entryPoint.getNonce('0x98c7Ff1979781058798aC2824325c7e89f541f8b', 0)
  console.log(alreadyExistingNonce)
}

run()