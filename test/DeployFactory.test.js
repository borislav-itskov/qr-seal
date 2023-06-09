const { ethers } = require('hardhat')
const { getProxyDeployBytecode, getStorageSlotsFromArtifact } = require('../src/deploy/getBytecodeJs');
const { buildInfo } = require('./config');

describe('AmbireAccountFactory tests', function(){
  it('deploys the factory', async function(){
    const [owner] = await ethers.getSigners();
    const factory = await ethers.deployContract('AmbireAccountFactory', [owner.address])

    const contract = await ethers.deployContract('AmbireAccount')
    const bytecode = getProxyDeployBytecode(contract.address, [{addr: owner.address, hash: true}], {
      ...getStorageSlotsFromArtifact(buildInfo)
    })
  })
})