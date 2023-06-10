import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import {
  Button,
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { utils } from "ethers";
import { useMemo } from "react";
import QRCode from "react-qr-code";
import { getEOAPrivateKey, getEOAPublicKey } from "../../auth/services/eoa";
import getSchnorrkelInstance from "../../singletons/Schnorr";

const JoinMultisig = (props: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const qrCodeValue = useMemo(() => {
    const schnorrkel = getSchnorrkelInstance();
    const publicKey = getEOAPublicKey();

    const privateKey = new Key(Buffer.from(utils.arrayify(getEOAPrivateKey())))
    const publicNonces = schnorrkel.hasNonces(privateKey)
      ? schnorrkel.getPublicNonces(privateKey)
      : schnorrkel.generatePublicNonces(privateKey);

    const kPublicHex = publicNonces.kPublic.toHex();
    const kTwoPublicHex = publicNonces.kTwoPublic.toHex();

    return publicKey + "|" + kPublicHex + "|" + kTwoPublicHex;
  }, []);

  return (
    <>
      <Button onClick={onOpen}>Join Multisig</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <QRCode size={380} value={qrCodeValue} style={{ padding: 20 }} />
        </ModalContent>
      </Modal>
    </>
  );
};

export default JoinMultisig;
