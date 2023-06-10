const { ethers } = require("ethers")

const localhost = 'http://127.0.0.1:8545'
const provider = new ethers.providers.JsonRpcProvider(localhost)

async function fund() {

  // transfer funds to both accounts - this one and the multisig
  const hardhatPk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  const addressOne = '0xEFA78F620881ae23aBD760f1c94B184E9a60117e'
  const multisigAddress = '0x027F1b6B5866CA6dB2c46c6b228C059Fbb8B7040'

  const fundWallet = new ethers.Wallet(hardhatPk, provider)
  const firstTxn = await fundWallet.sendTransaction({
    to: addressOne,
    value: ethers.utils.parseEther('20')
  })
  await firstTxn.wait()
  const secondTxn = await fundWallet.sendTransaction({
    to: multisigAddress,
    value: ethers.utils.parseEther('20')
  })
  await secondTxn.wait()

  console.log(ethers.utils.formatEther(await provider.getBalance(addressOne)))
  console.log(ethers.utils.formatEther(await provider.getBalance(multisigAddress)))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
fund().catch((error) => {
  console.error(error)
  process.exitCode = 1
});
