const { ethers } = require('hardhat')
const ERC4337Account = require('../artifacts/contracts/ERC4337Account.sol/ERC4337Account.json')
const { expect } = require('chai')

const salt = '0x0'
function getAddressCreateTwo(factoryAddress, bytecode) {
    return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}

const localhost = 'http://127.0.0.1:8545'

function getDeployCalldata(bytecodeWithArgs, salt2) {
  const setAddrPrivilegeABI = ['function deploy(bytes calldata code, uint256 salt) external']
  const iface = new ethers.utils.Interface(setAddrPrivilegeABI)
  return iface.encodeFunctionData('deploy', [
    bytecodeWithArgs,
    salt2
  ])
}

describe('create sender tests', function(){
  it('should work with ambire factory and account', async function(){
    const [signer, otherSigner] = await ethers.getSigners()
    const factory = await ethers.deployContract('AmbireAccountFactory', [signer.address])
    const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

    const abicoder = new ethers.utils.AbiCoder()
    const bytecodeWithArgs = ethers.utils.concat([
      ERC4337Account.bytecode,
      abicoder.encode(['address', 'address[]'], [ENTRY_POINT_ADDRESS, [signer.address]])
    ])

    const calldata = getDeployCalldata(bytecodeWithArgs, salt)
    const initcode = ethers.utils.hexlify(ethers.utils.concat([factory.address, calldata]))

    const senderCreator = await ethers.deployContract('SenderCreator')
    // await senderCreator.createSender(initcode)

    const senderAddress = getAddressCreateTwo(factory.address, bytecodeWithArgs)
    // const acc = new ethers.Contract(senderAddress, ERC4337Account.abi, signer)
    // const entryPointAddr = await acc.entryPoint()
    // expect(entryPointAddr).to.equal(ENTRY_POINT_ADDRESS)

    const entryPoint = await ethers.deployContract('EntryPoint')
    const createAcc = await entryPoint.createSenderIfNeeded(senderAddress, ethers.utils.hexlify(2_000_000), initcode)
  })
})