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
import { getTxnSchnorrkelSigner, getUserOpSchnorrkelSigner } from "../../singletons/Schnorr";
import { useEOA } from "../../auth/context/eoa";

const JoinMultisig = (props: any) => {
  const { eoaPublicKey, eoaPrivateKey } = useEOA()

  const { isOpen, onOpen, onClose } = useDisclosure();
  const qrCodeValue = useMemo(() => {
    const txnSchnorrkel = getTxnSchnorrkelSigner();
    const userOpSchnorrkel = getUserOpSchnorrkelSigner();

    const privateKey = new Key(Buffer.from(utils.arrayify(eoaPrivateKey)))
    const txnPublicNonces = txnSchnorrkel.hasNonces(privateKey)
      ? txnSchnorrkel.getPublicNonces(privateKey)
      : txnSchnorrkel.generatePublicNonces(privateKey);
    const userOpPublicNonces = userOpSchnorrkel.hasNonces(privateKey)
      ? userOpSchnorrkel.getPublicNonces(privateKey)
      : userOpSchnorrkel.generatePublicNonces(privateKey);

    const txnPublicHex = txnPublicNonces.kPublic.toHex();
    const txnTwoPublicHex = txnPublicNonces.kTwoPublic.toHex();
    const userOpPublicHex = userOpPublicNonces.kPublic.toHex();
    const userOpTwoPublicHex = userOpPublicNonces.kTwoPublic.toHex();

    return eoaPublicKey + "|" + txnPublicHex + "|" + txnTwoPublicHex + "|" + userOpPublicHex + "|" + userOpTwoPublicHex;
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
