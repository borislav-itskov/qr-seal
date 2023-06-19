const { StaticJsonRpcProvider } = require("@ethersproject/providers")
const { chains } = require("./config")
require('dotenv').config();

const run = async () => {
  const apiKey = process.env.PIMLICO_API_KEY
  const pimlicoEndpoint = `https://api.pimlico.io/v1/${chains.mumbai}/rpc?apikey=${apiKey}`
  const pimlicoProvider = new StaticJsonRpcProvider(pimlicoEndpoint)

  const userOperationHash = '0x34f0a32e800dd253243003a0076b888f06e5f9efeabd328af9e9d02e8b15a7c8'
  console.log("UserOperation hash:", userOperationHash)

  // let's also wait for the userOperation to be included, by continually querying for the receipts
  console.log("Querying for receipts...")
  let receipt = null
  while (receipt === null) {
    receipt = await pimlicoProvider.send("eth_getUserOperationReceipt", [userOperationHash])
    console.log(receipt)
    await new Promise((r) => setTimeout(r, 1000)) //sleep
  }

  const txHash = receipt.receipt.transactionHash
  console.log(`${txHash}`)
}

run()