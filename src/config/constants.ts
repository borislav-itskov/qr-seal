import { ethers } from "ethers";

// TODO: Change those when we deploy on a specific network
export const FACTORY_ADDRESS = "0x1bb0684486c35e35D56FaA806e12f6819dbe9527";
export const AMBIRE_ADDRESS = "0x1100E4Cf3fe64b928cccE36c78ad6b7696d72446";
export const polygon = 'https://polygon-rpc.com'
export const localhost = 'http://127.0.0.1:8545'
export const mainProvider = new ethers.providers.JsonRpcProvider(polygon)
export const deployGasLimit = 1000000