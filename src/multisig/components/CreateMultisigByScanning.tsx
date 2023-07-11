import {
  Flex,
  Button,
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import QRCodeScanner from "../../common/QRCodeScanner";
import { useContext } from "react";
import { Key } from "@borislav.itskov/schnorrkel.js";
import { getMultisigAddress } from "../../utils/helpers";
import { ethers } from "ethers";
import MultisigContext from "../../auth/context/multisig";
import { useEOA } from "../../auth/context/eoa";
import { useSteps } from "../../auth/context/step";

const CreateMultisigByScanning = (props: any) => {
  const toast = useToast()
  const { setActiveStep } = useSteps()
  const { eoaPublicKey } = useEOA()
  const { multisigData, createAndStoreMultisigDataIfNeeded } = useContext(MultisigContext)
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleScanSuccess = (scan: any = "") => {
    const data = scan.split("|");

    // TODO: Validate better if data is multisig!
    if (data.length !== 3) {
      alert("Missing all multisig data in the QR code you scanned!");

      return;
    }

    const publicKey = eoaPublicKey;
    const multisigPartnerPublicKey = data[0];
    const multisigPartnerKPublicHex = data[1];
    const multisigPartnerKTwoPublicHex = data[2];

    onClose();

    const publicKeyOne = new Key(Buffer.from(ethers.utils.arrayify(publicKey)));
    const publicKeyTwo = new Key(
      Buffer.from(ethers.utils.arrayify(multisigPartnerPublicKey))
    );

    try {
      const multisigAddr = getMultisigAddress([publicKeyOne, publicKeyTwo])

      // Set data in local storage
      createAndStoreMultisigDataIfNeeded({
        multisigPartnerPublicKey,
        multisigPartnerKPublicHex,
        multisigPartnerKTwoPublicHex,
        multisigAddr
      });

      setActiveStep(2)
      toast({
        title: "Multisig created.",
        description: "You can now create a transaction.",
        status: "success",
        duration: 9000,
        isClosable: true,
        position: 'top'
      })
    } catch (e) {
      console.log("The multisig creation failed", e);
    }
  };
  const handleScanError = (error: any) => console.error(error);

  if (!eoaPublicKey) return null

  return (
    <>
      {!multisigData && (<Flex alignItems={"center"} flex="1" alignSelf={"center"} height="100%">
      <Button flex={1} background={"blue.400"} color={"white"} _hover={{ color: "blue.400", background: "white" }} onClick={onOpen}>Create Multisig</Button>
      </Flex>)}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <QRCodeScanner
            qrCodeSuccessCallback={handleScanSuccess}
            qrCodeErrorCallback={handleScanError}
          />
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateMultisigByScanning;
