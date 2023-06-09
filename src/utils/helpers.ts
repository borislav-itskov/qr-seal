import { ethers } from "ethers";

const salt = '0x0'
export function getAmbireAccountAddress(factoryAddress: string, bytecode: string) {
    return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}

export function wrapSchnorr(sig: string) {
    return `${sig}${'04'}`
}