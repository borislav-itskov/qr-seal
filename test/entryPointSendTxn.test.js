const { ethers } = require('hardhat')

describe('Entry point', function(){
  it('should be able to send a txn via the entry point', async function(){
    const [signer] = await ethers.getSigners()
    const entryPoint = await ethers.deployContract('EntryPoint')
    const erc4337 = await ethers.deployContract('ERC4337Account', [entryPoint.address, [signer.address]])
    const abi = ['function executeBySender(tuple(address, uint, bytes)[] calldata txns) external payable']
    const iface = new ethers.utils.Interface(abi)
    const to = entryPoint.address
    const value = 0
    const data = "0x68656c6c6f" // "hello" encoded to to utf-8 bytes
    const singleTxn = [to, value, data]
    const txns = [singleTxn]
    const calldata = iface.encodeFunctionData('executeBySender', [txns])
    const result = await entryPoint.sendTxnOutside(erc4337.address, calldata, ethers.utils.hexlify(100_000))
    console.log(result)
  })
})