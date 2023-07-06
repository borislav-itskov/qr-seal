import { ethers } from "ethers";

// TODO: Change those when we deploy on a specific network
export const FACTORY_ADDRESS = "0xAc1157C17F3CbC5ad6a677B890117C29183FcE79";
export const polygon = 'https://polygon-rpc.com'
export const localhost = 'http://127.0.0.1:8545'
export const mainProvider = new ethers.providers.JsonRpcProvider(polygon)
export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"