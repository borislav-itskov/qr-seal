import {
    Button,
    Modal,
    ModalContent,
    ModalOverlay,
    FormControl,
    FormLabel,
    Input,
    useDisclosure,
  } from "@chakra-ui/react";
import QRCodeScanner from "../../common/QRCodeScanner";
import { useState, createContext, useContext } from "react";
import Schnorrkel, { Key, Signature } from "@borislav.itskov/schnorrkel.js";
import { getAmbireAccountAddress } from "../../utils/helpers";
import buildinfo from "../../builds/FactoryAndAccountBuild.json";
import {
  getProxyDeployBytecode,
  getStorageSlotsFromArtifact,
} from "../../deploy/getBytecode";
import { ethers } from "ethers";
import { getEOAPrivateKey, getEOAPublicKey } from "../../auth/services/eoa";
import MultisigContext from "../../auth/context/multisig";

import { AMBIRE_ADDRESS, FACTORY_ADDRESS } from "../../config/constants";
import { useForm } from "react-hook-form";
import getSchnorrkelInstance from "../../singletons/Schnorr";

interface FormProps {
  to: string;
  value: number;
}

const CoSign = (props: any) => {
  const { createAndStoreMultisigDataIfNeeded, getAllMultisigData } = useContext(MultisigContext)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();

  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
    setValue,
  } = useForm<FormProps>();
  const handleScanSuccess = (scan: any = "") => {
    const data = scan.split("|");

    // TODO: Validate better if data is multisig!
    // if (data.length !== 6) {
    //   alert("Missing all multisig data in the QR code you scanned!");

    //   return;
    // }

    // open send transaction in readonly-mode, prefilled
    // put received data in global scope

    // const publicKey = getEOAPublicKey();
    // const multisigPartnerPublicKey = data[0];
    // const multisigPartnerKPublicHex = data[1];
    // const multisigPartnerKTwoPublicHex = data[2];
    // const multisigPartnerSignature = data[3];
    // const formTo = data[4];
    // const formValue = data[5];

    // HARDCODE VALUES THAT WE WILL REMOVE LATER
    const publicKey = getEOAPublicKey();
    const multisigPartnerPublicKey = '0x0295cbcef6754d5cd8a68a1585847ffea804d2ce4ee8c4419e012508a4f64def4a';
    const multisigPartnerKPublicHex = '03faefcee180c54a14cafc051c2e0dfa2348817c6d2d5d842aca25727cc9f2d189';
    const multisigPartnerKTwoPublicHex = '0266eb9b75229b9ae96d51a0581aee14fbfa90b1aa9676419d898a1369e3621f2c';
    const multisigPartnerSignature = '0x07172656fe3cbd363520d96f4cbb6a96cc7db4dcefb1c41e0f34d5b612036877';
    const formTo = '0xCD4D4a1955852c6dC2b8fd7E3FEB7724373DB9Cc'
    const formValue = '2'

    const publicKeyOne = new Key(Buffer.from(ethers.utils.arrayify(publicKey)));
    const publicKeyTwo = new Key(
      Buffer.from(ethers.utils.arrayify(multisigPartnerPublicKey))
    );
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey([
      publicKeyOne,
      publicKeyTwo,
    ]);
    const px = ethers.utils.hexlify(combinedPublicKey.buffer.slice(1, 33));
    const schnorrHash = ethers.utils.keccak256(
      ethers.utils.solidityPack(["string", "bytes"], ["SCHNORR", px])
    );
    const schnorrVirtualAddr =
      "0x" + schnorrHash.slice(schnorrHash.length - 40, schnorrHash.length);

    const bytecode = getProxyDeployBytecode(
      AMBIRE_ADDRESS,
      [{ addr: schnorrVirtualAddr, hash: true }],
      {
        ...getStorageSlotsFromArtifact(buildinfo),
      }
    );
    const multisigAddr = getAmbireAccountAddress(FACTORY_ADDRESS, bytecode);

    // Set data in local storage
    createAndStoreMultisigDataIfNeeded({
      "multisigPartnerPublicKey": multisigPartnerPublicKey,
      "multisigPartnerKPublicHex": multisigPartnerKPublicHex,
      "multisigPartnerKTwoPublicHex": multisigPartnerKTwoPublicHex,
      "multisigAddr": multisigAddr,
      "multisigPartnerSignature": multisigPartnerSignature
    })

    onClose();
    setValue('to', formTo);
    setValue('value', +formValue);
    onFormOpen();
  };
  const handleScanError = (error: any) => console.error(error);

  // sign and submit the transaction
  const onSubmit = (values: FormProps) => {
    const data = getAllMultisigData();
    if (!data) return

    const abiCoder = new ethers.utils.AbiCoder();
    const sendTosignerTxn = [
      values.to,
      ethers.utils.parseEther(values.value.toString()),
      "0x00",
    ];
    const txns = [sendTosignerTxn];
    // TO DO: the nonce is hardcoded to 0 here.
    // change it to read from the contract if any
    const msg = abiCoder.encode(
      ["address", "uint", "uint", "tuple(address, uint, bytes)[]"],
      [data.multisigAddr, 31337, 0, txns]
    );
    const publicKeyOne = new Key(
      Buffer.from(ethers.utils.arrayify(getEOAPublicKey()))
    );
    const publicKeyTwo = new Key(
      Buffer.from(ethers.utils.arrayify(data.multisigPartnerPublicKey))
    );
    const publicKeys = [publicKeyOne, publicKeyTwo];
    const privateKey = new Key(
      Buffer.from(ethers.utils.arrayify(getEOAPrivateKey()))
    );
    const partnerNonces = {
      kPublic: Key.fromHex(data.multisigPartnerKPublicHex),
      kTwoPublic: Key.fromHex(data.multisigPartnerKTwoPublicHex),
    };
    const schnorrkel = getSchnorrkelInstance()
    const publicNonces = schnorrkel.getPublicNonces(privateKey)
    const combinedPublicNonces = [publicNonces, partnerNonces];
    const hashFn = ethers.utils.keccak256;
    const { signature } = schnorrkel.multiSigSign(
      privateKey,
      msg,
      publicKeys,
      combinedPublicNonces,
      hashFn
    );
    const partnerSig = Signature.fromHex(data.multisigPartnerSignature)
    const summedSig = Schnorrkel.sumSigs([signature, partnerSig])
    console.log(summedSig)
  }

  return (
    <>
      <Button onClick={onOpen}>Co-Sign</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <QRCodeScanner
            qrCodeSuccessCallback={handleScanSuccess}
            qrCodeErrorCallback={handleScanError}
          />
        </ModalContent>
      </Modal>
      <Modal isOpen={isFormOpen} onClose={onFormClose}>
        <ModalOverlay />
        <ModalContent style={{ padding: 20 }}>
          <h2>Co-sign Transaction</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl>
              <FormLabel htmlFor="to">To:</FormLabel>
              <Input
                id="to"
                type="text"
                readOnly
                placeholder="0x..."
                {...register("to", {
                  required: "This is required",
                })}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="value">Amount:</FormLabel>
              <Input
                id="value"
                placeholder="0.00"
                readOnly
                type="number"
                step="0.000000001"
                {...register("value", {
                  required: "This is required",
                  valueAsNumber: true,
                })}
              />
            </FormControl>
            <Button
              mt={4}
              colorScheme="teal"
              isLoading={isSubmitting}
              type="submit"
            >
              Sign & Send
            </Button>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
  
export default CoSign;
