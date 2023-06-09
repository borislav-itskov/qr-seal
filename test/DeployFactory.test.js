const { ethers } = require('hardhat')
const { expect } = require('chai')
const { getProxyDeployBytecode, getStorageSlotsFromArtifact } = require('../src/deploy/getBytecodeJs')
const { buildInfo, AmbireAccount } = require('./config')
const { default: Schnorrkel, Key } = require('@borislav.itskov/schnorrkel.js')
const { generateRandomKeys } = require('@borislav.itskov/schnorrkel.js/dist/core/index.js')
const schnorrkel = new Schnorrkel()

const salt = '0x0'
function getAmbireAccountAddress(factoryAddress, bytecode) {
    return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}
function wrapSchnorr(sig) {
  return `${sig}${'04'}`
}

describe('AmbireAccountFactory tests', function(){
  it('should deploy the factory, deploy the contract, execute a multisignature schnorr transaction', async function(){
    const [signer] = await ethers.getSigners()
    const factory = await ethers.deployContract('AmbireAccountFactory', [signer.address])

    // configure the schnorr virtual address
    const pkPairOne = generateRandomKeys()
    const pkPairTwo = generateRandomKeys()
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey([
      pkPairOne.publicKey,
      pkPairTwo.publicKey
    ])
    const px = ethers.utils.hexlify(combinedPublicKey.buffer.slice(1, 33))
    const parity = combinedPublicKey.buffer[0] - 2 + 27
    const hash = ethers.utils.keccak256(ethers.utils.solidityPack(['string', 'bytes'], ['SCHNORR', px]))
    const combinedPublicAddress = '0x' + hash.slice(hash.length - 40, hash.length)

    // deploy the ambire account
    const contract = await ethers.deployContract('AmbireAccount')
    const bytecode = getProxyDeployBytecode(contract.address, [{addr: combinedPublicAddress, hash: true}], {
      ...getStorageSlotsFromArtifact(buildInfo)
    })
    await factory.deploy(bytecode, 0)
    const ambireAccountAddress = getAmbireAccountAddress(factory.address, bytecode)

    // give money to the multisig address
    await signer.sendTransaction({
      to: ambireAccountAddress,
      value: ethers.utils.parseEther('200'),
    })

    // send money to the signer txn
    const abiCoder = new ethers.utils.AbiCoder()
    const sendTosignerTxn = [signer.address, ethers.utils.parseEther('2'), '0x00']
    const txns = [sendTosignerTxn]
    const msg = abiCoder.encode(['address', 'uint', 'uint', 'tuple(address, uint, bytes)[]'], [ambireAccountAddress, 31337, 0, txns])
    const publicKeys = [pkPairOne.publicKey, pkPairTwo.publicKey]
    const publicNonces = [schnorrkel.generatePublicNonces(pkPairOne.privateKey), schnorrkel.generatePublicNonces(pkPairTwo.privateKey)]
    const hashFn = ethers.utils.keccak256
    const {signature: sigOne, challenge, finalPublicNonce} = schnorrkel.multiSigSign(pkPairOne.privateKey, msg, publicKeys, publicNonces, hashFn)
    const {signature: sigTwo} = schnorrkel.multiSigSign(pkPairTwo.privateKey, msg, publicKeys, publicNonces, hashFn)
    const schnorrSignature = Schnorrkel.sumSigs([sigOne, sigTwo])
    const verification = Schnorrkel.verify(schnorrSignature, msg, finalPublicNonce, combinedPublicKey, hashFn)
    expect(verification).to.equal(true)

    const ambireAccount = new ethers.Contract(ambireAccountAddress, AmbireAccount.abi, signer)
    const canSign = await ambireAccount.privileges(combinedPublicAddress)
    expect(canSign).to.equal('0x0000000000000000000000000000000000000000000000000000000000000001')

    // wrap the schnorr signature and validate that it is valid
    const sigData = abiCoder.encode([ 'bytes32', 'bytes32', 'bytes32', 'uint8' ], [
      px,
      challenge.buffer,
      schnorrSignature.buffer,
      parity
    ])
    const ambireSig = wrapSchnorr(sigData)
    await ambireAccount.execute(txns, ambireSig)

    const balance = ethers.utils.formatEther(await signer.getBalance())
    expect(balance > 9801).to.equal(true)
    expect(balance < 9802).to.equal(true)
  })
  it('should deploy the factory and call deployAndExecute and deploy the ambire account executing a multisignature schnorr transaction', async function(){
    const [signer, otherSigner] = await ethers.getSigners()
    const factory = await ethers.deployContract('AmbireAccountFactory', [otherSigner.address])

    // configure the schnorr virtual address
    const pkPairOne = generateRandomKeys()
    const pkPairTwo = generateRandomKeys()
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey([
      pkPairOne.publicKey,
      pkPairTwo.publicKey
    ])
    const px = ethers.utils.hexlify(combinedPublicKey.buffer.slice(1, 33))
    const parity = combinedPublicKey.buffer[0] - 2 + 27
    const hash = ethers.utils.keccak256(ethers.utils.solidityPack(['string', 'bytes'], ['SCHNORR', px]))
    const combinedPublicAddress = '0x' + hash.slice(hash.length - 40, hash.length)

    // deploy the ambire account
    const contract = await ethers.deployContract('AmbireAccount')
    const bytecode = getProxyDeployBytecode(contract.address, [{addr: combinedPublicAddress, hash: true}], {
      ...getStorageSlotsFromArtifact(buildInfo)
    })
    const abiCoder = new ethers.utils.AbiCoder()
    const sendTosignerTxn = [otherSigner.address, ethers.utils.parseEther('2'), '0x00']
    const txns = [sendTosignerTxn]

    const ambireAccountAddress = getAmbireAccountAddress(factory.address, bytecode)

    // give money to the multisig address
    await otherSigner.sendTransaction({
      to: ambireAccountAddress,
      value: ethers.utils.parseEther('200'),
    })

    // // send money to the signer txn
    const msg = abiCoder.encode(['address', 'uint', 'uint', 'tuple(address, uint, bytes)[]'], [ambireAccountAddress, 31337, 0, txns])
    const publicKeys = [pkPairOne.publicKey, pkPairTwo.publicKey]
    const publicNonces = [schnorrkel.generatePublicNonces(pkPairOne.privateKey), schnorrkel.generatePublicNonces(pkPairTwo.privateKey)]
    const hashFn = ethers.utils.keccak256
    const {signature: sigOne, challenge, finalPublicNonce} = schnorrkel.multiSigSign(pkPairOne.privateKey, msg, publicKeys, publicNonces, hashFn)
    const {signature: sigTwo} = schnorrkel.multiSigSign(pkPairTwo.privateKey, msg, publicKeys, publicNonces, hashFn)
    const schnorrSignature = Schnorrkel.sumSigs([sigOne, sigTwo])
    const verification = Schnorrkel.verify(schnorrSignature, msg, finalPublicNonce, combinedPublicKey, hashFn)
    expect(verification).to.equal(true)

    // // wrap the schnorr signature and validate that it is valid
    const sigData = abiCoder.encode([ 'bytes32', 'bytes32', 'bytes32', 'uint8' ], [
      px,
      challenge.buffer,
      schnorrSignature.buffer,
      parity
    ])
    const ambireSig = wrapSchnorr(sigData)
    await factory.deployAndExecute(bytecode, 0, txns, ambireSig)
    
    const balance = ethers.utils.formatEther(await otherSigner.getBalance())
    expect(balance > 9801).to.equal(true)
    expect(balance < 9802).to.equal(true)
  })
})