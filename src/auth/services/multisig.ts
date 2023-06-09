const STORAGE_KEY_MULTISIG = "multisig-data";

interface MultisigData {
  multisigPartnerPublicKey: string;
  multisigPartnerKPublicHex: string;
  multisigPartnerKTwoPublicHex: string;
  multisigAddr: string
}

export const getMultisigData = () =>
  localStorage.getItem(STORAGE_KEY_MULTISIG) || "";

export const createAndStoreMultisigDataIfNeeded = (multisigData: MultisigData) => {
  const storedPrivateKey = getMultisigData();
  if (storedPrivateKey) return;

  // Store the private key hex string in local storage
  localStorage.setItem(STORAGE_KEY_MULTISIG, JSON.stringify(multisigData));
};

export const getAllMultisicData = () => {
  const privateKeyHex = getMultisigData();
  if (!privateKeyHex) throw new Error("No Multisig data found");
};
