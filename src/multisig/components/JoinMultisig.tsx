import { Key } from "@borislav.itskov/schnorrkel.js";
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
import { getSchnorrkelInstance } from "../../singletons/Schnorr";
import { useEOA } from "../../auth/context/eoa";

const JoinMultisig = (props: any) => {
  const { eoaPublicKey, eoaPrivateKey } = useEOA()

  const { isOpen, onOpen, onClose } = useDisclosure();
  const qrCodeValue = useMemo(() => {
    const schnorrkel = getSchnorrkelInstance();

    const privateKey = new Key(Buffer.from(utils.arrayify(eoaPrivateKey)))
    const publicNonces = schnorrkel.hasNonces(privateKey)
      ? schnorrkel.getPublicNonces(privateKey)
      : schnorrkel.generatePublicNonces(privateKey);

    const kOne = publicNonces.kPublic.toHex();
    const kTwo = publicNonces.kTwoPublic.toHex();

    return eoaPublicKey + "|" + kOne + "|" + kTwo
  }, [eoaPrivateKey, eoaPublicKey]);

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
