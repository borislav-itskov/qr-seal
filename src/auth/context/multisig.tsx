import { createContext, useState, useMemo, useCallback } from "react";

const STORAGE_KEY_MULTISIG = "multisig-data";

export interface MultisigData {
  multisigPartnerPublicKey: string;
  multisigPartnerKPublicHex: string;
  multisigPartnerKTwoPublicHex: string;
  multisigAddr: string;
  multisigPartnerSignature?: string;
}

export const getMultisigData = () =>
  localStorage.getItem(STORAGE_KEY_MULTISIG) || "";

export const createAndStoreMultisigDataInLocalStorageIfNeeded = (multisigData: MultisigData) => {
  const storedMultisigData = getMultisigData();
  if (storedMultisigData) return;
  // Store the private key hex string in local storage
  localStorage.setItem(STORAGE_KEY_MULTISIG, JSON.stringify(multisigData));
};

export const getMultisigDataFromLocalStorage = () => {
  const multisigData = getMultisigData();
  if (!multisigData) return "";

  return JSON.parse(multisigData)
};


const MultisigContext = createContext<any>({
  multisigData: getMultisigDataFromLocalStorage(),
  createAndStoreMultisigDataIfNeeded: (data: any) => {}, 
  getAllMultisigData: () => getMultisigDataFromLocalStorage(),
});

export const MultisigProvider = ({ children }: any) => {
  const [multisigData, setMultisigData] = useState(getMultisigDataFromLocalStorage());

  const getAllMultisigData = useCallback(() => {
    if (!multisigData) {
      return getMultisigDataFromLocalStorage()
    }
    else return multisigData
  }, [multisigData])

  const createAndStoreMultisigDataIfNeeded = (multisigData: MultisigData) => {
    createAndStoreMultisigDataInLocalStorageIfNeeded(multisigData)
    setMultisigData(multisigData)
  }

  return (
    <MultisigContext.Provider
      value={useMemo(()=> ({
        multisigData,
        createAndStoreMultisigDataIfNeeded,
        getAllMultisigData,
    }), [multisigData, getAllMultisigData])}
    >
      {children}
    </MultisigContext.Provider>
  );
};

export default MultisigContext;









