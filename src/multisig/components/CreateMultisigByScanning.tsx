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
import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { getAmbireAccountAddress } from "../../utils/helpers";
import buildinfo from "../../builds/FactoryAndAccountBuild.json";
import {
  getProxyDeployBytecode,
  getStorageSlotsFromArtifact,
} from "../../deploy/getBytecode";
import { ethers } from "ethers";
import MultisigContext from "../../auth/context/multisig";
import { AMBIRE_ADDRESS, FACTORY_ADDRESS } from "../../config/constants";
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
        multisigPartnerPublicKey: multisigPartnerPublicKey,
        multisigPartnerKPublicHex: multisigPartnerKPublicHex,
        multisigPartnerKTwoPublicHex: multisigPartnerKTwoPublicHex,
        multisigAddr: multisigAddr,
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
