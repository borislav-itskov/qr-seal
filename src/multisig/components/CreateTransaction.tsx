import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { ethers } from "ethers";
import { useContext, useState } from "react";
import QRCode from "react-qr-code";
import { getEOAPrivateKey, getEOAPublicKey } from "../../auth/services/eoa";
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

interface FormProps {
  to: string;
  value: number;
}

const CreateTransaction = (props: any) => {
  const { getAllMultisigData } = useContext(MultisigContext)

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isQrOpen, onOpen: onQrOpen, onClose: onQrClose } = useDisclosure();
  const [qrCodeValue, setQrCodeValue] = useState("");
  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
  } = useForm<FormProps>();

  const onSubmit = (values: FormProps) => {
    const data = getAllMultisigData()
    if (!data) return
    const abiCoder = new ethers.utils.AbiCoder()
    const sendTosignerTxn = [values.to, ethers.utils.parseEther(values.value.toString()), '0x00']
    const txns = [sendTosignerTxn]
    // TO DO: the nonce is hardcoded to 0 here.
    // change it to read from the contract if any
    const msg = abiCoder.encode(['address', 'uint', 'uint', 'tuple(address, uint, bytes)[]'], [data.multisigAddr, 31337, 0, txns])
    const publicKeyOne = new Key(Buffer.from(ethers.utils.arrayify(getEOAPublicKey())));
    const publicKeyTwo = new Key(Buffer.from(ethers.utils.arrayify(data.multisigPartnerPublicKey)));
    const publicKeys = [publicKeyOne, publicKeyTwo]
    const schnorrkel = new Schnorrkel()
    const privateKey =  new Key(Buffer.from(ethers.utils.arrayify(getEOAPrivateKey())))
    const partnerNonces = {
      kPublic: Key.fromHex(data.multisigPartnerKPublicHex),
      kTwoPublic: Key.fromHex(data.multisigPartnerKTwoPublicHex)
    }
    const publicNonces = schnorrkel.generatePublicNonces(privateKey)
    const combinedPublicNonces = [publicNonces, partnerNonces]
    const hashFn = ethers.utils.keccak256
    const {signature} = schnorrkel.multiSigSign(privateKey, msg, publicKeys, combinedPublicNonces, hashFn)
    const sigHex = ethers.utils.hexlify(signature.buffer)

    const kPublicHex = publicNonces.kPublic.toHex();
    const kTwoPublicHex = publicNonces.kTwoPublic.toHex();
    // const qrCode = getEOAPublicKey() + "|" + kPublicHex + "|" + kTwoPublicHex + "|" + sigHex + "|" + values.to + "|" + values.value.toString()
    const qrCode = getEOAPublicKey() + "|" + kPublicHex + "|" + kTwoPublicHex + "|" + sigHex + "|" + msg
    setQrCodeValue(qrCode)
    onQrOpen()
    return new Promise((resolve) => resolve(true))
  };

  return (
    <>
      <Button onClick={onOpen}>Create Transaction</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent style={{ padding: 20 }}>
          <h2>Create Transaction</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl>
              <FormLabel htmlFor="to">To:</FormLabel>
              <Input
                id="to"
                type="text"
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
              Submit
            </Button>
          </form>
        </ModalContent>
      </Modal>
      {/* the qr code modal */}
      <Modal isOpen={isQrOpen} onClose={onQrClose}>
        <ModalOverlay />
        <ModalContent>
          <QRCode value={qrCodeValue} style={{ padding: 20 }} />
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateTransaction;
