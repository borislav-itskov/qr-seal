import {
  Button,
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import QRCodeScanner from "../../common/QRCodeScanner";

const CreateMultisigByScanning = (props: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const handleScanSuccess = (scan: any) => {
    // TODO: Validate if data is multisig!
    // TODO: Create multisig!
    console.log("Scanned!", scan);

    onClose();
  };
  const handleScanError = (error: any) => console.error(error);

  return (
    <>
      <Button onClick={onOpen}>Create Multisig</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
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
