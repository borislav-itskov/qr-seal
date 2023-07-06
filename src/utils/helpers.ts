import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { ethers } from "ethers";
import ERC4337Account from '../builds/ERC4337Account.json'
import { ENTRY_POINT_ADDRESS, FACTORY_ADDRESS } from "../config/constants";

const salt = '0x0'
export function getAmbireAccountAddress(factoryAddress: string, bytecode: string|Uint8Array) {
  return ethers.utils.getCreate2Address(factoryAddress, ethers.utils.hexZeroPad(salt, 32), ethers.utils.keccak256(bytecode))
}

export function wrapSchnorr(sig: string) {
  return `${sig}${'04'}`
}

export function computeSchnorrAddress(combinedPublicKey: Key) {
  const px = ethers.utils.hexlify(combinedPublicKey.buffer.slice(1, 33));
  const schnorrHash = ethers.utils.keccak256(
    ethers.utils.solidityPack(["string", "bytes"], ["SCHNORR", px])
  );
  return "0x" + schnorrHash.slice(schnorrHash.length - 40, schnorrHash.length);
}

export function getDeployCalldata(bytecodeWithArgs: any) {
  const abi = ['function deploy(bytes calldata code, uint256 salt) external']
  const iface = new ethers.utils.Interface(abi)
  return iface.encodeFunctionData('deploy', [
    bytecodeWithArgs,
    '0x0'
  ])
}

export function getExecuteCalldata(txns: any) {
  const abi = ['function executeBySender(tuple(address, uint, bytes)[] calldata txns) external payable']
  const iface = new ethers.utils.Interface(abi)
  return iface.encodeFunctionData('executeBySender', txns)
}

export function getMultisigAddress(publicKeys: Array<Key>) {
  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys);
  const schnorrVirtualAddr = computeSchnorrAddress(combinedPublicKey)

  const abiCoder = new ethers.utils.AbiCoder();
  const bytecodeWithArgs = ethers.utils.concat([
    ERC4337Account.bytecode,
    abiCoder.encode(['address', 'address[]'], [ENTRY_POINT_ADDRESS, [schnorrVirtualAddr]])
  ])
  return getAmbireAccountAddress(FACTORY_ADDRESS, bytecodeWithArgs);
}