const { ethers } = require("ethers")

const localhost = 'http://127.0.0.1:8545'
const provider = new ethers.providers.JsonRpcProvider(localhost)

async function checkBalance() {
  const balance = await provider.getBalance('0xdd2a7Dc3d038b5EA4164D41B3617aDa5eb4179bf')

  console.log('balance', balance)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
checkBalance().catch((error) => {
  console.error(error)
  process.exitCode = 1
});
