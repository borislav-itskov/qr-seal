import { utils } from "ethers";

const STORAGE_KEY_EOA = "eoa-private-key";

export const getEOAPrivateKey = () =>
  localStorage.getItem(STORAGE_KEY_EOA) || "";

export const createAndStoreEOAIfNeeded = () => {
  const storedPrivateKey = getEOAPrivateKey();
  if (storedPrivateKey) return;

  // Generate a 32-byte private key
  const privateKeyBytes = utils.randomBytes(32);

  // Convert the private key bytes to a hexadecimal string
  const privateKeyHex = utils.hexlify(privateKeyBytes);

  // Store the private key hex string in local storage
  localStorage.setItem(STORAGE_KEY_EOA, privateKeyHex);
};

export const getEOAPublicKey = () => {
  const privateKeyHex = getEOAPrivateKey();
  if (!privateKeyHex) throw new Error("No EOA private key found");

  // Convert hex string back to bytes
  const privateKeyBytes = utils.arrayify(privateKeyHex);

  // Compute uncompressed public key
  const uncompressedPublicKey = utils.computePublicKey(privateKeyBytes, false);

  // Convert uncompressed public key to bytes and then to compressed format
  const publicKey = utils.computePublicKey(uncompressedPublicKey, true);

  return publicKey;
};

export const getEOAAddress = () => {
  const publicKey = getEOAPublicKey();
  if (!publicKey) return "";

  // Compute the Ethereum address from the public key
  return utils.computeAddress(publicKey);
};
