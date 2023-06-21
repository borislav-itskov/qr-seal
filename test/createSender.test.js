const { ethers } = require('hardhat')
const ERC4337Account = require('../artifacts/contracts/ERC4337Account.sol/ERC4337Account.json')
const { expect } = require('chai')
const { chainIds } = require('../scripts/erc4337/config')
const { default: Schnorrkel, Key } = require('@borislav.itskov/schnorrkel.js')

const salt = '0x0'
function getAddressCreateTwo(factoryAddress, bytecode) {
    return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}

const localhost = 'http://127.0.0.1:8545'

function getDeployCalldata(bytecodeWithArgs, salt2) {
  const setAddrPrivilegeABI = ['function deploy(bytes calldata code, uint256 salt) external']
  const iface = new ethers.utils.Interface(setAddrPrivilegeABI)
  return iface.encodeFunctionData('deploy', [
    bytecodeWithArgs,
    salt2
  ])
}

function getExecuteCalldata(txns, signature) {
  const abi = ['function execute(tuple(address, uint, bytes)[] calldata txns, bytes calldata signature) public payable']
  const iface = new ethers.utils.Interface(abi)
  return iface.encodeFunctionData('execute', [
    txns,
    signature
  ])
}

function wrapSchnorr(sig) {
  return `${sig}${'04'}`
}

function getSchnorrAddress(pk) {
  const publicKey = ethers.utils.arrayify(ethers.utils.computePublicKey(ethers.utils.arrayify(pk), true))
  const px = ethers.utils.hexlify(publicKey.slice(1, 33))
  const hash = ethers.utils.keccak256(ethers.utils.solidityPack(['string', 'bytes'], ['SCHNORR', px]))
  return '0x' + hash.slice(hash.length - 40, hash.length)
}


describe('create sender tests', function(){
  it('should work with ambire factory and account', async function(){
    const pk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    const [signer, otherSigner] = await ethers.getSigners()
    const factory = await ethers.deployContract('AmbireAccountFactory', [signer.address])
    const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

    const abicoder = new ethers.utils.AbiCoder()
    const schnorrVirtualAddr = getSchnorrAddress(pk)
    const bytecodeWithArgs = ethers.utils.concat([
      ERC4337Account.bytecode,
      abicoder.encode(['address', 'address[]'], [ENTRY_POINT_ADDRESS, [signer.address, schnorrVirtualAddr]])
    ])

    const calldata = getDeployCalldata(bytecodeWithArgs, salt)
    const initcode = ethers.utils.hexlify(ethers.utils.concat([factory.address, calldata]))

    const senderCreator = await ethers.deployContract('SenderCreator')
    await senderCreator.createSender(initcode)

    const senderAddress = getAddressCreateTwo(factory.address, bytecodeWithArgs)
    const acc = new ethers.Contract(senderAddress, ERC4337Account.abi, signer)
    const entryPointAddr = await acc.entryPoint()
    expect(entryPointAddr).to.equal(ENTRY_POINT_ADDRESS)

    // const entryPoint = await ethers.deployContract('EntryPoint')
    // const createAcc = await entryPoint.createSenderIfNeeded(senderAddress, ethers.utils.hexlify(2_000_000), initcode)

    // GENERATE THE CALLDATA
    const to = "0xCB8B547f2895475838195ee52310BD2422544408" // test metamask addr
    const value = 0
    const data = "0x68656c6c6f" // "hello" encoded to to utf-8 bytes

    // VERIFY SCHNORR IS WORKING ON CHAIN
    const singleTxn = [to, value, data]
    const txns = [singleTxn]
    const msg = abicoder.encode(['address', 'uint', 'uint', 'tuple(address, uint, bytes)[]'], [senderAddress, 31337, 0, txns])
    const hashFn = ethers.utils.keccak256
    const schnorrPrivateKey = new Key(Buffer.from(ethers.utils.arrayify(pk)))
    const schnorrSig = Schnorrkel.sign(schnorrPrivateKey, msg, hashFn)
    const publicKey = ethers.utils.arrayify(ethers.utils.computePublicKey(ethers.utils.arrayify(pk), true))
    const schnorrPublicKey = new Key(Buffer.from(ethers.utils.arrayify(publicKey)))
    const verification = Schnorrkel.verify(
      schnorrSig.signature,
      msg,
      schnorrSig.finalPublicNonce,
      schnorrPublicKey,
      hashFn
    )
    console.log(verification)

    // wrap the schnorr signature and validate that it is valid
    const px = ethers.utils.hexlify(schnorrPublicKey.buffer.slice(1, 33))
    const parity = schnorrPublicKey.buffer[0] - 2 + 27
    const sigData = abicoder.encode([ 'bytes32', 'bytes32', 'bytes32', 'uint8' ], [
      px,
      schnorrSig.challenge.buffer,
      schnorrSig.signature.buffer,
      parity
    ])
    const ambireSig = wrapSchnorr(sigData)
    const executeCalldata = getExecuteCalldata(txns, ambireSig)

    const txn = await signer.sendTransaction({
      to: senderAddress,
      data: executeCalldata
    })
    const receipt = await txn.wait()
    console.log(receipt)
  })
})