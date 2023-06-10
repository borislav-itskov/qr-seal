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

const JoinMultisig = (props: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const qrCodeValue = useMemo(() => {
    const schnorrkel = new Schnorrkel();
    const publicKey = getEOAPublicKey();

    const publicNonces = schnorrkel.generatePublicNonces(
      new Key(Buffer.from(utils.arrayify(getEOAPrivateKey())))
    );

    const kPublicHex = publicNonces.kPublic.toHex();
    const kTwoPublicHex = publicNonces.kTwoPublic.toHex();

    return publicKey + "|" + kPublicHex + "|" + kTwoPublicHex;
  }, []);

  return (
    <>
      <Button onClick={onOpen} flex={1} background={"blue.400"} color={"white"} _hover={{ color: "blue.400", background: "white" }} my={3}>Join Multisig</Button>
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
