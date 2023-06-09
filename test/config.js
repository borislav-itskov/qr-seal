const AmbireAccount = require('../artifacts/contracts/AmbireAccount.sol/AmbireAccount.json')
const AmbireAccountFactory = require('../artifacts/contracts/AmbireAccountFactory.sol/AmbireAccountFactory.json')
const buildInfo = require('../builds/FactoryAndAccountBuild.json')
const deployGasLimit = 1000000

module.exports = {
  AmbireAccount,
  AmbireAccountFactory,
  buildInfo,
  deployGasLimit
}
  