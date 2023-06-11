const { ethers } = require("ethers")
const { AmbireAccountFactory, AmbireAccount } = require("../test/config")

const polygon = 'https://polygon-rpc.com'
const provider = new ethers.providers.JsonRpcProvider(polygon)

async function generateFactoryDeploy (gasPrice) {4
	const txn = {}
  	const hardhatPk = ''
	const fundWallet = new ethers.Wallet(hardhatPk, provider)
	const factory = new ethers.ContractFactory(AmbireAccountFactory.abi, AmbireAccountFactory.bytecode, fundWallet)

	txn.data = factory.getDeployTransaction(fundWallet.address)
	txn.from = fundWallet.address
	txn.value = '0x00'
	txn.type = null
	txn.gasLimit = ethers.BigNumber.from(1e6)
	txn.data = txn.data.data
	txn.gasPrice = gasPrice
	txn.nonce = await provider.getTransactionCount(fundWallet.address)
	txn.chainId = 137
	return await fundWallet.signTransaction(txn)
}

async function generateAmbireDeploy (gasPrice) {
	const txn = {}
  	const hardhatPk = ''
	const fundWallet = new ethers.Wallet(hardhatPk, provider)
	const factory = new ethers.ContractFactory(AmbireAccount.abi, AmbireAccount.bytecode, fundWallet)

	txn.data = factory.getDeployTransaction()
	txn.from = fundWallet.address
	txn.value = '0x00'
	txn.type = null
	txn.gasLimit = 10000000n
	txn.data = txn.data.data
	txn.gasPrice = gasPrice
	txn.nonce = await provider.getTransactionCount(fundWallet.address)
	txn.chainId = 137
	return await fundWallet.signTransaction(txn)
}

async function deploy() {

  const feeData = await provider.getFeeData()
  const sig = await generateAmbireDeploy(feeData.gasPrice)
  console.log(sig)

  // const contractFactoryAmbire = new ethers.ContractFactory(AmbireAccount.abi, AmbireAccount.bytecode, fundWallet)
  // const ambireTxn = contractFactoryAmbire.getDeployTransaction({
  //   gasPrice: feeData.gasPrice,
  //   gasLimit: ethers.BigNumber.from(1e6)
  // })
  // const ambireSig = await fundWallet.signTransaction(ambireTxn)
  // console.log(ambireSig)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deploy().catch((error) => {
  console.error(error)
  process.exitCode = 1
});
