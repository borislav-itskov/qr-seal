import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { utils } from 'ethers';

const STORAGE_KEY_EOA = 'eoa-private-key';

type EOAContextType = {
  eoaPrivateKey: string;
  eoaPublicKey: string;
  eoaAddress: string;
  createAndStoreEOA: () => void;
};

const EOAContext = createContext<EOAContextType>({
  eoaPrivateKey: '',
  eoaPublicKey: '',
  eoaAddress: '',
  createAndStoreEOA: () => {},
});

export const useEOA = () => useContext(EOAContext);

export const EOAProvider: React.FC = ({ children }) => {
  const [eoaPrivateKey, setEOAPrivateKey] = useState<string>('');
  const [eoaPublicKey, setEOAPublicKey] = useState<string>('');
  const [eoaAddress, setEOAAddress] = useState<string>('');

  useEffect(() => {
    const storedPrivateKey = localStorage.getItem(STORAGE_KEY_EOA) || '';
    setEOAPrivateKey(storedPrivateKey);
  }, []);

  const createAndStoreEOA = useCallback(() => {
    const privateKeyBytes = utils.randomBytes(32);
    const privateKeyHex = utils.hexlify(privateKeyBytes);
    localStorage.setItem(STORAGE_KEY_EOA, privateKeyHex);
    setEOAPrivateKey(privateKeyHex);
  }, []);

  useEffect(() => {
    if (eoaPrivateKey) {
      const privateKeyBytes = utils.arrayify(eoaPrivateKey);
      const uncompressedPublicKey = utils.computePublicKey(privateKeyBytes, false);
      const publicKey = utils.computePublicKey(uncompressedPublicKey, true);
      setEOAPublicKey(publicKey);
      setEOAAddress(utils.computeAddress(publicKey));
    }
  }, [eoaPrivateKey]);

  return (
    <EOAContext.Provider value={{ eoaPrivateKey, eoaPublicKey, eoaAddress, createAndStoreEOA }}>
      {children}
    </EOAContext.Provider>
  );
};
