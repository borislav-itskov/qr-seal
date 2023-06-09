import {
  Button,
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import QRCodeScanner from "../../common/QRCodeScanner";
import { useState } from "react";

const CreateMultisigByScanning = (props: any) => {
  const [multisigPublicAddress, setMultisigPublicAddress] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const handleScanSuccess = (scan: any = "") => {
    const data = scan.split("|");

    // TODO: Validate better if data is multisig!
    if (data.length !== 3) {
      alert("Missing all multisig data in the QR code you scanned!");

      return;
    }

    const multisigPartnerPublicKey = data[0];
    const multisigPartnerKPublicHex = data[1];
    const multisigPartnerKTwoPublicHex = data[2];

    // TODO: Create multisig!
    console.log(
      "Scanned!",
      multisigPartnerPublicKey,
      multisigPartnerKPublicHex,
      multisigPartnerKTwoPublicHex
    );
    onClose();
  };
  const handleScanError = (error: any) => console.error(error);

  if (multisigPublicAddress) {
    return (
      <p style={{ fontSize: 16 }}>
        Multisig account public address:{" "}
        <small style={{ fontSize: 14 }}>{multisigPublicAddress}</small>
      </p>
    );
  }

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
