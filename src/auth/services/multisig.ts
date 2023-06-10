const STORAGE_KEY_MULTISIG = "multisig-data";

export interface MultisigData {
  multisigPartnerPublicKey: string;
  multisigPartnerKPublicHex: string;
  multisigPartnerKTwoPublicHex: string;
  multisigAddr: string
}

export const getMultisigData = () =>
  localStorage.getItem(STORAGE_KEY_MULTISIG) || "";

export const createAndStoreMultisigDataIfNeeded = (multisigData: MultisigData) => {
  const storedMultisigData = getMultisigData();
  if (storedMultisigData) return;

  // Store the private key hex string in local storage
  localStorage.setItem(STORAGE_KEY_MULTISIG, JSON.stringify(multisigData));
};

export const getAllMultisigData = () => {
  const multisigData = getMultisigData();
  if (!multisigData) return '';

  return JSON.parse(multisigData)
};
