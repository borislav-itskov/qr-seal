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
import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { getAmbireAccountAddress } from "../../utils/helpers";
import buildinfo from "../../builds/FactoryAndAccountBuild.json";
import {
  getProxyDeployBytecode,
  getStorageSlotsFromArtifact,
} from "../../deploy/getBytecode";
import { ethers } from "ethers";
import { getEOAPublicKey } from "../../auth/services/eoa";
import MultisigContext from "../../auth/context/multisig";

import { AMBIRE_ADDRESS, FACTORY_ADDRESS } from "../../config/constants";
import { useForm } from "react-hook-form";

interface FormProps {
  to: string;
  value: number;
}

const CoSign = (props: any) => {
  const { createAndStoreMultisigDataIfNeeded } = useContext(MultisigContext)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const [ to, setTo ] = useState("");
  const [ amount, setAmount ] = useState("");
  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
  } = useForm<FormProps>();
  const handleScanSuccess = (scan: any = "") => {
    const data = scan.split("|");

    // TODO: Validate better if data is multisig!
    if (data.length !== 6) {
      alert("Missing all multisig data in the QR code you scanned!");

      return;
    }

    console.log(data)
    // open send transaction in readonly-mode, prefilled
    // put received data in global scope

    const publicKey = getEOAPublicKey();
    const multisigPartnerPublicKey = data[0];
    const multisigPartnerKPublicHex = data[1];
    const multisigPartnerKTwoPublicHex = data[2];
    const multisigPartnerSignature = data[3];
    const formTo = data[4];
    const formValue = data[5];

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
      "multisigAddr": multisigAddr
    })

    onClose();
    setTo(formTo);
    setAmount(formValue);
    onFormOpen();
  };
  const handleScanError = (error: any) => console.error(error);

  const onSubmit = (values: FormProps) => {
    console.log(values)
  }

  return (
    <>
      <Button onClick={onOpen} flex={1} _hover={{ bg: 'transparent', color: "teal.400", borderColor: "teal.400" }} background={"teal.400"} borderWidth={3} borderColor={"teal.400"} color={"white"}>Co-Sign</Button>
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
          <h2>Create Transaction</h2>
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
              Submit
            </Button>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
  
export default CoSign;
