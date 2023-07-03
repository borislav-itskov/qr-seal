const rpcs = {
  mumbai: 'https://rpc-mumbai.maticvigil.com',
  linea: 'https://rpc.goerli.linea.build/',
  polygon: 'https://polygon-rpc.com'
}
const chains = {
  linea: 'linea-testnet',
  mumbai: 'mumbai',
  polygon: 'polygon',
}
const chainIds = {
  linea: 59140,
  mumbai: 80001,
  polygon: 137,
}
const factoryAddr = {
  mumbai: '0x153E957A9ff1688BbA982856Acf178524aF96D78',
  polygon: '0xAc1157C17F3CbC5ad6a677B890117C29183FcE79',
}

module.exports = {
  rpcs,
  chains,
  chainIds,
  factoryAddr
}