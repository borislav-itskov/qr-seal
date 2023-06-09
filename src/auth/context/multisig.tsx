import { createContext, useState, useMemo, useEffect } from "react";
import { getAllMultisigData, createAndStoreMultisigDataIfNeeded, MultisigData as MultisigDataType } from "../services/multisig";


const MultisigContext = createContext({
  multisigData: {},
  createAndStoreMultisigDataIfNeeded: (multisigData: MultisigDataType) => {},
  getAllMultisigData: () => {},
});

export const MultisigProvider = ({ children }: any) => {
  const [multisigData, setMultisigData] = useState({});

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedMultisigData = getAllMultisigData();
      setMultisigData(updatedMultisigData);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <MultisigContext.Provider
      value={useMemo(()=> ({
        multisigData,
        createAndStoreMultisigDataIfNeeded,
        getAllMultisigData,
    }), [multisigData])}
    >
      {children}
    </MultisigContext.Provider>
  );
};

export default MultisigContext;









