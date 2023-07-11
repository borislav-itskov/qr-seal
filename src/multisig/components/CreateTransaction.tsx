import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { ethers } from "ethers";
import { useContext, useState } from "react";
import QRCode from "react-qr-code";
import { useForm } from "react-hook-form";
import {
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  FormLabel,
  FormControl,
  Input,
  Button,
} from "@chakra-ui/react";
import MultisigContext from "../../auth/context/multisig";
import { getSchnorrkelInstance } from "../../singletons/Schnorr";
import { useEOA } from "../../auth/context/eoa";
import { ENTRY_POINT_ADDRESS, FACTORY_ADDRESS, mainProvider } from "../../config/constants";
import { EntryPoint__factory } from "@account-abstraction/contracts"
import ERC4337Account from '../../builds/ERC4337Account.json'
import { computeSchnorrAddress, getDeployCalldata, getExecuteCalldata } from "../../utils/helpers";

interface FormProps {
  to: string;
  value: number;
}

const CreateTransaction = (props: any) => {
  const { eoaPrivateKey, eoaPublicKey } = useEOA()
  const { getAllMultisigData } = useContext(MultisigContext)

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isQrOpen,
    onOpen: onQrOpen,
    onClose: onQrClose,
  } = useDisclosure();
  const [qrCodeValue, setQrCodeValue] = useState("");
  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
  } = useForm<FormProps>();

  const onSubmit = async (values: FormProps) => {
    const data = getAllMultisigData();
    if (!data) return

    const abiCoder = new ethers.utils.AbiCoder();
    const sendTosignerTxn = [
      values.to,
      ethers.utils.parseEther(values.value.toString()),
      "0x00",
    ];
    const txns = [sendTosignerTxn];
    // TO DO: the nonce is hardcoded to 0 here.
    // change it to read from the contract if any
    const publicKeyOne = new Key(
      Buffer.from(ethers.utils.arrayify(eoaPublicKey))
    );
    const publicKeyTwo = new Key(
      Buffer.from(ethers.utils.arrayify(data.multisigPartnerPublicKey))
    );
    const publicKeys = [publicKeyOne, publicKeyTwo];
    const schnorrkel = getSchnorrkelInstance()
    const privateKey = new Key(
      Buffer.from(ethers.utils.arrayify(eoaPrivateKey))
    );
    const partnerNonces = {
      kPublic: Key.fromHex(data.multisigPartnerKPublicHex),
      kTwoPublic: Key.fromHex(data.multisigPartnerKTwoPublicHex),
    };

    const publicNonces = schnorrkel.generatePublicNonces(privateKey);
    const combinedPublicNonces = [publicNonces, partnerNonces];

    // configure the user operation
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys);
    const schnorrVirtualAddr = computeSchnorrAddress(combinedPublicKey)
    const entryPoint = EntryPoint__factory.connect(ENTRY_POINT_ADDRESS, mainProvider)
    const entryPointNonce = await entryPoint.getNonce(data.multisigAddr, 0)
    const userOpNonce = entryPointNonce.toHexString()
    const bytecodeWithArgs = ethers.utils.concat([
      ERC4337Account.bytecode,
      abiCoder.encode(['address', 'address[]'], [ENTRY_POINT_ADDRESS, [schnorrVirtualAddr]])
    ])
    const initCode = ethers.utils.hexlify(ethers.utils.concat([
        FACTORY_ADDRESS,
        getDeployCalldata(bytecodeWithArgs)
    ]))
    const executeCalldata = getExecuteCalldata([txns])
    const gasPrice = await mainProvider.getGasPrice()
    const hexGasPrice = ethers.utils.hexlify(gasPrice)
    const userOperation = {
      sender: data.multisigAddr,
      nonce: userOpNonce,
      initCode,
      callData: executeCalldata,
      callGasLimit: ethers.utils.hexlify(100_000), // hardcode it for now at a high value
      verificationGasLimit: ethers.utils.hexlify(2_000_000), // hardcode it for now at a high value
      preVerificationGas: ethers.utils.hexlify(50_000), // hardcode it for now at a high value
      maxFeePerGas: hexGasPrice,
      maxPriorityFeePerGas: hexGasPrice,
      paymasterAndData: "0x",
      signature: "0x"
    }

    // REQUEST PIMLICO VERIFYING PAYMASTER SPONSORSHIP
    const apiKey = process.env.REACT_APP_PIMLICO_API_KEY
    const pimlicoEndpoint = `https://api.pimlico.io/v1/polygon/rpc?apikey=${apiKey}`
    const pimlicoProvider = new ethers.providers.StaticJsonRpcProvider(pimlicoEndpoint)
    const sponsorUserOperationResult = await pimlicoProvider.send("pm_sponsorUserOperation", [
      userOperation,
      {
        entryPoint: ENTRY_POINT_ADDRESS
      }
    ])
    const paymasterAndData = sponsorUserOperationResult.paymasterAndData
    userOperation.paymasterAndData = paymasterAndData

    const userOpHash = await entryPoint.getUserOpHash(userOperation)
    const { signature } = schnorrkel.multiSigSignHash(
      privateKey,
      userOpHash,
      publicKeys,
      combinedPublicNonces
    );
    const sigHex = signature.toHex()
    const kPublicHex = publicNonces.kPublic.toHex();
    const kTwoPublicHex = publicNonces.kTwoPublic.toHex();
    const qrCode =
      eoaPublicKey +
      "|" +
      kPublicHex +
      "|" +
      kTwoPublicHex +
      "|" +
      sigHex +
      "|" +
      values.to +
      "|" +
      values.value +
      "|" +
      hexGasPrice +
      "|" +
      paymasterAndData
    setQrCodeValue(qrCode);
    onQrOpen();
    return new Promise((resolve) => resolve(true));
  };

  return (
    <>
      <Button onClick={onOpen}   _hover={{ bg: 'transparent', color: "teal.400", borderColor: "teal.400" }} background={"teal.400"} borderWidth={3} borderColor={"teal.400"} color={"white"} flex={1} my={4}>Create Transaction</Button>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent style={{ padding: 20 }}>
          <h2 style={{ marginBottom: 20 }}>Create Transaction</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl>
              <FormLabel htmlFor="to">To:</FormLabel>
              <Input
                id="to"
                type="text"
                placeholder="0x..."
                mb={4}
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
                type="number"
                step="0.000000001"
                mb={4}
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
      {/* the qr code modal */}
      <Modal isOpen={isQrOpen} onClose={onQrClose}>
        <ModalOverlay />
        <ModalContent>
          <QRCode size={380} value={qrCodeValue} style={{ padding: 20 }} />
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateTransaction;
