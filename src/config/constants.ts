import { ethers } from "ethers";

// TODO: Change those when we deploy on a specific network
export const FACTORY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const AMBIRE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const localhost = 'http://127.0.0.1:8545'
export const mainProvider = new ethers.providers.JsonRpcProvider(localhost)
export const deployGasLimit = 1000000