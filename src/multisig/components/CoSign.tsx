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
import { getAmbireAccountAddress, wrapSchnorr } from "../../utils/helpers";
import buildinfo from "../../builds/FactoryAndAccountBuild.json";
import {
  getProxyDeployBytecode,
  getStorageSlotsFromArtifact,
} from "../../deploy/getBytecode";
import { ethers } from "ethers";
import { getEOAAddress, getEOAPrivateKey, getEOAPublicKey } from "../../auth/services/eoa";
import MultisigContext from "../../auth/context/multisig";

import { AMBIRE_ADDRESS, FACTORY_ADDRESS, mainProvider, deployGasLimit } from "../../config/constants";
import { useForm } from "react-hook-form";
import getSchnorrkelInstance from "../../singletons/Schnorr";
import AmbireAccountFactory from '../../builds/AmbireAccountFactory.json'

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
    if (data.length !== 6) {
      alert("Missing all multisig data in the QR code you scanned!");

      return;
    }

    const publicKey = getEOAPublicKey();
    const multisigPartnerPublicKey = data[0];
    const multisigPartnerKPublicHex = data[1];
    const multisigPartnerKTwoPublicHex = data[2];
    const multisigPartnerSignature = data[3];
    const formTo = data[4];
    const formValue = data[5];

    // HARDCODE VALUES THAT WE WILL REMOVE LATER
    // const publicKey = getEOAPublicKey();
    // const multisigPartnerPublicKey = '0x02afc56ffa2958ca5614f22a012f17e2df1a332304677ecc429e2f867f6e7db7bf';
    // const multisigPartnerKPublicHex = '033dd7be8995d101f29cd12bd773e5549bd0ef507f922251197177f9aedaf2d2b6';
    // const multisigPartnerKTwoPublicHex = '03761d7910d20615400cda0d1cac80880145fcb94bc1e0699549c72db68a170df3';
    // const multisigPartnerSignature = '439d20128e356b51e567abfaefa29ebf351a4831bf3e621230a51c1af3517413';
    // const formTo = '0xCD4D4a1955852c6dC2b8fd7E3FEB7724373DB9Cc'
    // const formValue = '2'

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
      "multisigPartnerSignature": multisigPartnerSignature,
      "combinedPublicKey": combinedPublicKey,
      "bytecode": bytecode
    })

    onClose();
    setValue('to', formTo);
    setValue('value', +formValue);
    onFormOpen();
  };
  const handleScanError = (error: any) => console.error(error);

  // sign and submit the transaction
  const onSubmit = async (values: FormProps) => {
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
    // console.log(publicNonces.kPublic.toHex())
    // console.log(publicNonces.kTwoPublic.toHex())
    const combinedPublicNonces = [publicNonces, partnerNonces];
    const hashFn = ethers.utils.keccak256;
    const { signature, challenge, finalPublicNonce } = schnorrkel.multiSigSign(
      privateKey,
      msg,
      publicKeys,
      combinedPublicNonces,
      hashFn
    );
    const partnerSig = Signature.fromHex(data.multisigPartnerSignature)
    const summedSig = Schnorrkel.sumSigs([signature, partnerSig])
    const verification = Schnorrkel.verify(summedSig, msg, finalPublicNonce, data.combinedPublicKey, hashFn)
    console.log('VERIFICATION: ' + verification)
    expect(verification).to.equal(true)

    const px = ethers.utils.hexlify(data.combinedPublicKey.buffer.slice(1, 33));
    const parity = data.combinedPublicKey.buffer[0] - 2 + 27
    
    const sigData = abiCoder.encode([ 'bytes32', 'bytes32', 'bytes32', 'uint8' ], [
      px,
      challenge.buffer,
      summedSig.buffer,
      parity
    ])
    const ambireSig = wrapSchnorr(sigData)

    const wallet = new ethers.Wallet(
      ethers.utils.arrayify(getEOAPrivateKey()),
      mainProvider
    )
    const factory = new ethers.Contract(FACTORY_ADDRESS, AmbireAccountFactory.abi, wallet)
    // const deployment = await factory.deploy(data.bytecode, 0)
    console.log(data.bytecode)
    console.log(txns)
    console.log(ambireSig)
    const deployment = await factory.deployAndExecute(data.bytecode, 0, txns, ambireSig)
    console.log(deployment)
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
