const { ethers } = require('ethers')
const { AmbireAccountFactory } = require('./config')
const ERC4337Account = require('../artifacts/contracts/ERC4337Account.sol/ERC4337Account.json')

const salt = '0x0'
function getAddressCreateTwo(factoryAddress, bytecode) {
    return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}

const localhost = 'http://127.0.0.1:8545'
const mainProvider = new ethers.providers.JsonRpcProvider(localhost)

describe('DeployERC4337 tests', function(){
  it('deploy on localhost', async function(){
    const pkWithETH = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    const owner = new ethers.Wallet(pkWithETH, mainProvider)
    const factory = new ethers.ContractFactory(
      AmbireAccountFactory.abi,
      AmbireAccountFactory.bytecode,
      owner
    )
    const deployContract = await factory.deploy(owner.address)
    const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

    const abicoder = new ethers.utils.AbiCoder()
    const bytecodeWithArgs = ethers.utils.concat([
      ERC4337Account.bytecode,
      abicoder.encode(['address', 'address[]'], [ENTRY_POINT_ADDRESS, [owner.address]])
    ])

    const erc4337Account = await deployContract.deploy(bytecodeWithArgs, salt)
    const receipt = await erc4337Account.wait()
    console.log(receipt)

    const addr = getAddressCreateTwo(deployContract.address, bytecodeWithArgs)
    const acc = new ethers.Contract(addr, ERC4337Account.abi, owner)
    const entryPoint = await acc.entryPoint()
    console.log(entryPoint)
  })
})