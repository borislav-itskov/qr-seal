import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { utils } from 'ethers';
import { useSteps } from './step';
import { useToast } from '@chakra-ui/react';

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

export const EOAProvider: React.FC<any> = ({ children }) => {
  const toast = useToast();
  const { setActiveStep } = useSteps()
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
    setActiveStep(1)
    toast({
      title: 'EOA created!',
      description: 'You can now create a multisig wallet.',
      status: 'success',
      duration: 5000,
      isClosable: true,
      position: 'top'
    });
  }, [setActiveStep, toast]);

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
