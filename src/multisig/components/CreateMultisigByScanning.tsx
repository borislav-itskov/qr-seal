import {
  Button,
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import QRCodeScanner from "../../common/QRCodeScanner";
import { useState } from "react";
import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { getAmbireAccountAddress } from "../../utils/helpers";
import buildinfo from "../../builds/FactoryAndAccountBuild.json";
import {
  getProxyDeployBytecode,
  getStorageSlotsFromArtifact,
} from "../../deploy/getBytecode";
import { ethers } from "ethers";
import { getEOAPublicKey } from "../../auth/services/eoa";
import { createAndStoreMultisigDataIfNeeded } from "../../auth/services/multisig";

// TODO: Change those when we deploy on a specific network
const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const AMBIRE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const CreateMultisigByScanning = (props: any) => {
  const [multisigPublicAddress, setMultisigPublicAddress] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const handleScanSuccess = (scan: any = "") => {
    const data = scan.split("|");

    // TODO: Validate better if data is multisig!
    if (data.length !== 3) {
      alert("Missing all multisig data in the QR code you scanned!");

      return;
    }

    const publicKey = getEOAPublicKey();
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
      setMultisigPublicAddress(multisigAddr);

      // Set data in local storage
      createAndStoreMultisigDataIfNeeded({
        "multisigPartnerPublicKey": multisigPartnerPublicKey,
        "multisigPartnerKPublicHex": multisigPartnerKPublicHex,
        "multisigPartnerKTwoPublicHex": multisigPartnerKTwoPublicHex,
        "multisigAddr": multisigAddr
      })

    } catch (e) {
      console.log("The multisig creation failed", e);
    }
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
