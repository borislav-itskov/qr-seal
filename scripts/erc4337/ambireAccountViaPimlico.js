const { EntryPoint__factory } = require("@account-abstraction/contracts")
const { StaticJsonRpcProvider } = require("@ethersproject/providers")
const { ethers } = require("ethers")
const { rpcs, chainIds, chains, factoryAddr } = require("./config")
require('dotenv').config();
const { default: Schnorrkel, Key } = require('@borislav.itskov/schnorrkel.js')
const ERC4337Account = require('../../artifacts/contracts/ERC4337Account.sol/ERC4337Account.json')
const salt = '0x0'

function wrapSchnorr(sig) {
  return `${sig}${'04'}`
}

function getAmbireAccountAddress(factoryAddress, bytecode) {
  return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}

function getSchnorrAddress(pk) {
  const publicKey = ethers.utils.arrayify(ethers.utils.computePublicKey(ethers.utils.arrayify(pk), true))
  const px = ethers.utils.hexlify(publicKey.slice(1, 33))
  const hash = ethers.utils.keccak256(ethers.utils.solidityPack(['string', 'bytes'], ['SCHNORR', px]))
  return '0x' + hash.slice(hash.length - 40, hash.length)
}

function getDeployCalldata(bytecodeWithArgs, salt2) {
  const abi = ['function deploy(bytes calldata code, uint256 salt) external']
  const iface = new ethers.utils.Interface(abi)
  return iface.encodeFunctionData('deploy', [
    bytecodeWithArgs,
    salt2
  ])
}

function getExecuteCalldata(txns) {
  const abi = ['function executeBySender(tuple(address, uint, bytes)[] calldata txns) external payable']
  const iface = new ethers.utils.Interface(abi)
  return iface.encodeFunctionData('executeBySender', [txns])
}

const run = async () => {
  const someWallet = ethers.Wallet.createRandom()
  const pk = someWallet.privateKey
  const AMBIRE_ACCOUNT_FACTORY_ADDR = factoryAddr.mumbai
  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
  const provider = new StaticJsonRpcProvider(rpcs.mumbai)
  const entryPoint = EntryPoint__factory.connect(ENTRY_POINT_ADDRESS, provider)
  const abicoder = new ethers.utils.AbiCoder()
  const schnorrVirtualAddr = getSchnorrAddress(pk)
  const bytecodeWithArgs = ethers.utils.concat([
    ERC4337Account.bytecode,
    abicoder.encode(['address', 'address[]'], [ENTRY_POINT_ADDRESS, [schnorrVirtualAddr]])
  ])

  const senderAddress = getAmbireAccountAddress(AMBIRE_ACCOUNT_FACTORY_ADDR, bytecodeWithArgs)
  const code = await provider.getCode(senderAddress)
  const hasCode = code !== '0x'
  const initCode = hasCode
    ? '0x'
    : ethers.utils.hexlify(ethers.utils.concat([
        AMBIRE_ACCOUNT_FACTORY_ADDR,
        getDeployCalldata(bytecodeWithArgs, salt)
    ]))
  const entryPointNonce = await entryPoint.getNonce(senderAddress, 0)
  const userOpNonce = entryPointNonce.toHexString()

  // GENERATE THE CALLDATA
  const to = "0xCB8B547f2895475838195ee52310BD2422544408" // test metamask addr
  const value = 0
  const data = "0x68656c6c6f" // "hello" encoded to to utf-8 bytes
  const singleTxn = [to, value, data]
  const txns = [singleTxn]
  const executeCalldata = getExecuteCalldata(txns)

  // // FILL OUT THE REMAINING USEROPERATION VALUES
  const gasPrice = await provider.getGasPrice()

  const userOperation = {
    sender: senderAddress,
    nonce: userOpNonce,
    initCode,
    callData: executeCalldata,
    callGasLimit: ethers.utils.hexlify(100_000), // hardcode it for now at a high value
    verificationGasLimit: ethers.utils.hexlify(2_000_000), // hardcode it for now at a high value
    preVerificationGas: ethers.utils.hexlify(50_000), // hardcode it for now at a high value
    maxFeePerGas: ethers.utils.hexlify(gasPrice),
    maxPriorityFeePerGas: ethers.utils.hexlify(gasPrice),
    paymasterAndData: "0x",
    signature: "0x"
  }

  // REQUEST PIMLICO VERIFYING PAYMASTER SPONSORSHIP
  const apiKey = process.env.PIMLICO_API_KEY
  const pimlicoEndpoint = `https://api.pimlico.io/v1/${chains.mumbai}/rpc?apikey=${apiKey}`
  const pimlicoProvider = new StaticJsonRpcProvider(pimlicoEndpoint)
  const sponsorUserOperationResult = await pimlicoProvider.send("pm_sponsorUserOperation", [
    userOperation,
    {
      entryPoint: ENTRY_POINT_ADDRESS
    }
  ])
  const paymasterAndData = sponsorUserOperationResult.paymasterAndData
  userOperation.paymasterAndData = paymasterAndData

  // SIGN THE USEROPERATION
  const schnorrPrivateKey = new Key(Buffer.from(ethers.utils.arrayify(pk)))
  const userOpHash = await entryPoint.getUserOpHash(userOperation)
  const signature = Schnorrkel.signHash(schnorrPrivateKey, userOpHash)
  const publicKey = ethers.utils.arrayify(ethers.utils.computePublicKey(ethers.utils.arrayify(pk), true))
  const schnorrPublicKey = new Key(Buffer.from(ethers.utils.arrayify(publicKey)))
  const verificationUserOp = Schnorrkel.verifyHash(
    signature.signature,
    userOpHash,
    signature.finalPublicNonce,
    schnorrPublicKey
  )
  console.log(verificationUserOp)
  const px = ethers.utils.hexlify(schnorrPublicKey.buffer.slice(1, 33))
  const parity = schnorrPublicKey.buffer[0] - 2 + 27
  const sigDataUserOp = abicoder.encode([ 'bytes32', 'bytes32', 'bytes32', 'uint8' ], [
    px,
    signature.challenge.buffer,
    signature.signature.buffer,
    parity
  ])
  const wrappedSig = wrapSchnorr(sigDataUserOp)
  userOperation.signature = wrappedSig

  // SUBMIT THE USEROPERATION TO BE BUNDLED
  const userOperationHash = await pimlicoProvider.send("eth_sendUserOperation", [userOperation, ENTRY_POINT_ADDRESS])
  console.log("UserOperation hash:", userOperationHash)

  // let's also wait for the userOperation to be included, by continually querying for the receipts
  console.log("Querying for receipts...")
  let receipt = null
  let counter = 0
  while (receipt === null) {
    try {
      await new Promise((r) => setTimeout(r, 1000)) //sleep
      counter++
      receipt = await pimlicoProvider.send("eth_getUserOperationReceipt", [userOperationHash])
      console.log(receipt)
    } catch (e) {
      console.log('error throwed, retry counter ' + counter)
    }
  }

  const txHash = receipt.receipt.transactionHash
  console.log(`${txHash}`)
}

run()