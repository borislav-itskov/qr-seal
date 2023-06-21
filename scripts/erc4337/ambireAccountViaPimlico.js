const { EntryPoint__factory } = require("@account-abstraction/contracts")
const { StaticJsonRpcProvider } = require("@ethersproject/providers")
const { ethers } = require("ethers")
const { getAddress } = require("ethers/lib/utils")
const { rpcs, chainIds, chains } = require("./config")
require('dotenv').config();
const { default: Schnorrkel, Key } = require('@borislav.itskov/schnorrkel.js')
const ERC4337Account = require('../../artifacts/contracts/ERC4337Account.sol/ERC4337Account.json')
const salt = '0x0'

function wrapEthSign(sig) {
  return `${sig}${'01'}`
}

function wrapSchnorr(sig) {
  return `${sig}${'04'}`
}

function getAmbireAccountAddress(factoryAddress, bytecode) {
  return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}

function getDeployCalldata(bytecodeWithArgs, salt2) {
  const abi = ['function deploy(bytes calldata code, uint256 salt) external']
  const iface = new ethers.utils.Interface(abi)
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

const run = async () => {
  const AMBIRE_ACCOUNT_FACTORY_ADDR = "0x153E957A9ff1688BbA982856Acf178524aF96D78"
  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
  const provider = new StaticJsonRpcProvider(rpcs.mumbai)
  const owner = new ethers.Wallet(process.env.DEPLOY_PRIVATE_KEY)
  const abicoder = new ethers.utils.AbiCoder()
  const bytecodeWithArgs = ethers.utils.concat([
    ERC4337Account.bytecode,
    abicoder.encode(['address', 'address[]'], [ENTRY_POINT_ADDRESS, [owner.address]])
  ])
  const calldata = getDeployCalldata(bytecodeWithArgs, salt)
  const initCode = ethers.utils.hexlify(ethers.utils.concat([AMBIRE_ACCOUNT_FACTORY_ADDR, calldata]))

  const entryPoint = EntryPoint__factory.connect(ENTRY_POINT_ADDRESS, provider)
  const senderAddress = await entryPoint.callStatic
    .getSenderAddress(initCode)
    .then(() => {
      throw new Error("Expected getSenderAddress() to revert")
    })
    .catch((e) => {
      const data = e.message.match(/0x6ca7b806([a-fA-F\d]*)/)?.[1]
      if (!data) {
        return Promise.reject(new Error("Failed to parse revert data"))
      }
      const addr = getAddress(`0x${data.slice(24, 64)}`)
      return Promise.resolve(addr)
    })

  console.log(senderAddress)
  
  // GENERATE THE CALLDATA
  const to = "0xCB8B547f2895475838195ee52310BD2422544408" // test metamask addr
  const value = 0
  const data = "0x68656c6c6f" // "hello" encoded to to utf-8 bytes

  // create an execute calldata to ambire
  // we will need to sign it as well...
  // send money to the signer txn
  const singleTxn = [to, value, data]
  const txns = [singleTxn]
  const msg = abicoder.encode(['address', 'uint', 'uint', 'tuple(address, uint, bytes)[]'], [senderAddress, chainIds.mumbai, 0, txns])
  const hashFn = ethers.utils.keccak256
  const schnorrPrivateKey = new Key(Buffer.from(ethers.utils.arrayify(`0x${process.env.DEPLOY_PRIVATE_KEY}`)))
  const schnorrSig = Schnorrkel.sign(schnorrPrivateKey, msg, hashFn)
  const privateKeyBytes = ethers.utils.arrayify(`0x${process.env.DEPLOY_PRIVATE_KEY}`);
  const uncompressedPublicKey = ethers.utils.computePublicKey(privateKeyBytes, false);
  const publicKey = ethers.utils.computePublicKey(uncompressedPublicKey, true);
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

  // // FILL OUT THE REMAINING USEROPERATION VALUES
  const gasPrice = await provider.getGasPrice()

  const userOperation = {
    sender: senderAddress,
    nonce: ethers.utils.hexlify(0),
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
  const signature = await owner.signMessage(ethers.utils.arrayify(await entryPoint.getUserOpHash(userOperation)))
  const wrappedSig = wrapEthSign(signature)

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