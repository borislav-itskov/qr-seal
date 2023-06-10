import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { ethers } from "ethers";
import { useContext, useState } from "react";
import QRCode from "react-qr-code";
import { useForm } from "react-hook-form";
import {
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  FormLabel,
  FormControl,
  Input,
  Button,
} from "@chakra-ui/react";
import MultisigContext from "../../auth/context/multisig";
import getSchnorrkelInstance from "../../singletons/Schnorr";
import { useEOA } from "../../auth/context/eoa";

interface FormProps {
  to: string;
  value: number;
}

const CreateTransaction = (props: any) => {
  const { eoaPrivateKey, eoaPublicKey } = useEOA()
  const { getAllMultisigData } = useContext(MultisigContext)

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isQrOpen,
    onOpen: onQrOpen,
    onClose: onQrClose,
  } = useDisclosure();
  const [qrCodeValue, setQrCodeValue] = useState("");
  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
  } = useForm<FormProps>();

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
      Buffer.from(ethers.utils.arrayify(eoaPublicKey))
    );
    const publicKeyTwo = new Key(
      Buffer.from(ethers.utils.arrayify(data.multisigPartnerPublicKey))
    );
    const publicKeys = [publicKeyOne, publicKeyTwo];
    const schnorrkel = getSchnorrkelInstance()
    const privateKey = new Key(
      Buffer.from(ethers.utils.arrayify(eoaPrivateKey))
    );
    const partnerNonces = {
      kPublic: Key.fromHex(data.multisigPartnerKPublicHex),
      kTwoPublic: Key.fromHex(data.multisigPartnerKTwoPublicHex),
    };
    console.log(partnerNonces.kPublic.toHex())
    console.log(partnerNonces.kTwoPublic.toHex())

    const publicNonces = schnorrkel.generatePublicNonces(privateKey);
    const combinedPublicNonces = [publicNonces, partnerNonces];
    const hashFn = ethers.utils.keccak256;
    const { signature } = schnorrkel.multiSigSign(
      privateKey,
      msg,
      publicKeys,
      combinedPublicNonces,
      hashFn
    );
    const sigHex = signature.toHex()
    const kPublicHex = publicNonces.kPublic.toHex();
    const kTwoPublicHex = publicNonces.kTwoPublic.toHex();
    // const qrCode = eoaPublicKey + "|" + kPublicHex + "|" + kTwoPublicHex + "|" + sigHex + "|" + values.to + "|" + values.value.toString()
    const qrCode =
      eoaPublicKey +
      "|" +
      kPublicHex +
      "|" +
      kTwoPublicHex +
      "|" +
      sigHex +
      "|" +
      values.to +
      "|" +
      values.value
    setQrCodeValue(qrCode);
    onQrOpen();
    // console.log(eoaPublicKey)
    // console.log(kPublicHex)
    // console.log(kTwoPublicHex)
    // console.log(sigHex)
    // console.log(values.to)
    // console.log(values.value)
    return new Promise((resolve) => resolve(true));
  };

  return (
    <>
      <Button onClick={onOpen}   _hover={{ bg: 'transparent', color: "teal.400", borderColor: "teal.400" }} background={"teal.400"} borderWidth={3} borderColor={"teal.400"} color={"white"} flex={1} my={4}>Create Transaction</Button>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent style={{ padding: 20 }}>
          <h2 style={{ marginBottom: 20 }}>Create Transaction</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl>
              <FormLabel htmlFor="to">To:</FormLabel>
              <Input
                id="to"
                type="text"
                placeholder="0x..."
                mb={4}
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
                type="number"
                step="0.000000001"
                mb={4}
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
              Submit
            </Button>
          </form>
        </ModalContent>
      </Modal>
      {/* the qr code modal */}
      <Modal isOpen={isQrOpen} onClose={onQrClose}>
        <ModalOverlay />
        <ModalContent>
          <QRCode size={380} value={qrCodeValue} style={{ padding: 20 }} />
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateTransaction;
