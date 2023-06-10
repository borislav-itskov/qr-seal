const { ethers } = require('ethers')
const { expect } = require('chai')
const { getProxyDeployBytecode, getStorageSlotsFromArtifact } = require('../src/deploy/getBytecodeJs')
const { buildInfo, AmbireAccount, AmbireAccountFactory } = require('../test/config')
const { default: Schnorrkel } = require('@borislav.itskov/schnorrkel.js')
const { generateRandomKeys } = require('@borislav.itskov/schnorrkel.js/dist/core/index.js')
const schnorrkel = new Schnorrkel()

const salt = '0x0'
function getAmbireAccountAddress(factoryAddress, bytecode) {
    return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}
function wrapSchnorr(sig) {
  return `${sig}${'04'}`
}

const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const AMBIRE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const localhost = 'http://127.0.0.1:8545'
const mainProvider = new ethers.providers.JsonRpcProvider(localhost)

async function doShit() {
    const pkWithETH = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
    const otherSigner = new ethers.Wallet(pkWithETH, mainProvider)
    const factory = new ethers.Contract(FACTORY_ADDRESS, AmbireAccountFactory.abi, otherSigner)

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
    const bytecode = getProxyDeployBytecode(AMBIRE_ADDRESS, [{addr: combinedPublicAddress, hash: true}], {
        ...getStorageSlotsFromArtifact(buildInfo)
    })
    const abiCoder = new ethers.utils.AbiCoder()
    const sendTosignerTxn = [otherSigner.address, ethers.utils.parseEther('2'), '0x00']
    const txns = [sendTosignerTxn]

    const ambireAccountAddress = getAmbireAccountAddress(factory.address, bytecode)

    // send money to the signer txn
    const msg = abiCoder.encode(['address', 'uint', 'uint', 'tuple(address, uint, bytes)[]'], [ambireAccountAddress, 31337, 0, txns])
    const publicKeys = [pkPairOne.publicKey, pkPairTwo.publicKey]
    const publicNonces = [schnorrkel.generatePublicNonces(pkPairOne.privateKey), schnorrkel.generatePublicNonces(pkPairTwo.privateKey)]
    const hashFn = ethers.utils.keccak256
    const {signature: sigOne} = schnorrkel.multiSigSign(pkPairOne.privateKey, msg, publicKeys, publicNonces, hashFn)
    const {signature: sigTwo, challenge, finalPublicNonce} = schnorrkel.multiSigSign(pkPairTwo.privateKey, msg, publicKeys, publicNonces, hashFn)
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
    const alabala = await factory.deployAndExecute(bytecode, 0, txns, ambireSig)
    console.log(alabala)
}

doShit()