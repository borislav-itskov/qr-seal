const { SimpleAccountFactory__factory, EntryPoint__factory, SimpleAccount__factory } = require("@account-abstraction/contracts")
const { StaticJsonRpcProvider } = require("@ethersproject/providers")
const { Wallet } = require("ethers")
const { arrayify, hexlify, getAddress, hexConcat } = require("ethers/lib/utils")
const { rpcs, chains } = require("./config")
require('dotenv').config();

const run = async () => {
  // GENERATE THE INITCODE
  const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0x9406Cc6185a346906296840746125a0E44976454"
  const provider = new StaticJsonRpcProvider(rpcs.mumbai)
  const owner = Wallet.createRandom()
  
  const simpleAccountFactory = SimpleAccountFactory__factory.connect(SIMPLE_ACCOUNT_FACTORY_ADDRESS, provider)
  const initCode = hexConcat([
    SIMPLE_ACCOUNT_FACTORY_ADDRESS,
    simpleAccountFactory.interface.encodeFunctionData("createAccount", [owner.address, 0])
  ])

  // CALCULATE THE SENDER ADDRESS
  const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

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
  
  // GENERATE THE CALLDATA
  const to = "0xCB8B547f2895475838195ee52310BD2422544408" // test metamask addr
  const value = 0
  const data = "0x68656c6c6f" // "hello" encoded to to utf-8 bytes

  const simpleAccount = SimpleAccount__factory.connect(senderAddress, provider)
  const callData = simpleAccount.interface.encodeFunctionData("execute", [to, value, data])

  // FILL OUT THE REMAINING USEROPERATION VALUES
  const gasPrice = await provider.getGasPrice()

  const userOperation = {
    sender: senderAddress,
    nonce: hexlify(0),
    initCode,
    callData,
    callGasLimit: hexlify(100_000), // hardcode it for now at a high value
    verificationGasLimit: hexlify(400_000), // hardcode it for now at a high value
    preVerificationGas: hexlify(50_000), // hardcode it for now at a high value
    maxFeePerGas: hexlify(gasPrice),
    maxPriorityFeePerGas: hexlify(gasPrice),
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
  const signature = await owner.signMessage(arrayify(await entryPoint.getUserOpHash(userOperation)))

  userOperation.signature = signature

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