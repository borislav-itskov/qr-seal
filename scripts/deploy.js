const { ethers } = require("ethers")
const { AmbireAccountFactory, AmbireAccount } = require("../test/config")

const localhost = 'http://127.0.0.1:8545'
const provider = new ethers.providers.JsonRpcProvider(localhost)

async function deploy() {

  // transfer funds to both accounts - this one and the multisig
  const hardhatPk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

  const fundWallet = new ethers.Wallet(hardhatPk, provider)
  const contractFactory = new ethers.ContractFactory(AmbireAccountFactory.abi, AmbireAccountFactory.bytecode, fundWallet)
  const factory = await contractFactory.deploy(fundWallet.address)

  const contractFactoryAmbire = new ethers.ContractFactory(AmbireAccount.abi, AmbireAccount.bytecode, fundWallet)
  const ambire = await contractFactoryAmbire.deploy()

  console.log('Factory address: ' + factory.address)
  console.log('Ambire address: ' + ambire.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deploy().catch((error) => {
  console.error(error)
  process.exitCode = 1
});
