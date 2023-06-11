import { ethers } from "ethers";

// TODO: Change those when we deploy on a specific network
export const FACTORY_ADDRESS = "0xA09C4AEa4eCE1B292b35462DbcaC9932414c5D74";
export const AMBIRE_ADDRESS = "0x7b829de68DA4B1C7f75b88061CaF530A2b56fF7e";
export const polygon = 'https://polygon-rpc.com'
export const localhost = 'http://127.0.0.1:8545'
export const mainProvider = new ethers.providers.JsonRpcProvider(polygon)
export const deployGasLimit = 1000000