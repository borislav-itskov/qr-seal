import {
    Button,
    Modal,
    ModalContent,
    ModalOverlay,
    FormControl,
    FormLabel,
    Input,
    useDisclosure,
    useToast,
    Alert,
    AlertIcon,
    Box,
    AlertTitle,
    AlertDescription,
    Text,
    Flex,
  } from "@chakra-ui/react";
import QRCodeScanner from "../../common/QRCodeScanner";
import { useState, useContext } from "react";
import Schnorrkel, { Key, Signature } from "@borislav.itskov/schnorrkel.js";
import { computeSchnorrAddress, getDeployCalldata, getExecuteCalldata, getMultisigAddress, wrapSchnorr } from "../../utils/helpers";
import { ethers } from "ethers";
import MultisigContext from "../../auth/context/multisig";

import { FACTORY_ADDRESS, mainProvider, ENTRY_POINT_ADDRESS } from "../../config/constants";
import { useForm } from "react-hook-form";
import { getSchnorrkelInstance } from "../../singletons/Schnorr";
import { useEOA } from "../../auth/context/eoa";
import { useSteps } from "../../auth/context/step";
import { EntryPoint__factory } from "@account-abstraction/contracts";
import ERC4337Account from '../../builds/ERC4337Account.json'

interface FormProps {
  to: string;
  value: number;
  gasPrice: string;
}

const CoSign = (props: any) => {
  const toast = useToast()
  const { setActiveStep } = useSteps()
  const { eoaPrivateKey, eoaPublicKey } = useEOA()
  const { createAndStoreMultisigDataIfNeeded, getAllMultisigData } = useContext(MultisigContext)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const [transactionHash, setTransactionHash] = useState<any>(null)
  const [paymasterAndData, setPaymasterAndData] = useState<any>(null)

  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
    setValue,
  } = useForm<FormProps>();
  const handleScanSuccess = (scan: any = "") => {
    const data = scan.split("|");

    // TODO: Validate better if data is multisig!
    if (data.length !== 8) {
      alert("Missing all multisig data in the QR code you scanned!");

      return;
    }

    const publicKey = eoaPublicKey;
    const multisigPartnerPublicKey = data[0];
    const multisigPartnerKPublicHex = data[1];
    const multisigPartnerKTwoPublicHex = data[2];
    const multisigPartnerSignature = data[3];
    const formTo = data[4];
    const formValue = data[5];
    const gasPrice = data[6];
    const pimlicoPaymaster = data[7];

    const publicKeyOne = new Key(Buffer.from(ethers.utils.arrayify(publicKey)));
    const publicKeyTwo = new Key(
      Buffer.from(ethers.utils.arrayify(multisigPartnerPublicKey))
    );
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey([
      publicKeyOne,
      publicKeyTwo,
    ]);
    const multisigAddr = getMultisigAddress([publicKeyOne, publicKeyTwo])

    // Set data in local storage
    createAndStoreMultisigDataIfNeeded({
      "multisigPartnerPublicKey": multisigPartnerPublicKey,
      "multisigPartnerKPublicHex": multisigPartnerKPublicHex,
      "multisigPartnerKTwoPublicHex": multisigPartnerKTwoPublicHex,
      "multisigAddr": multisigAddr,
      "multisigPartnerSignature": multisigPartnerSignature,
      "combinedPublicKey": combinedPublicKey
    })

    onClose();
    setValue('to', formTo);
    setValue('value', +formValue);
    setValue('gasPrice', gasPrice);
    setPaymasterAndData(pimlicoPaymaster)
    onFormOpen();
  };
  const handleScanError = (error: any) => console.error(error);

  // sign and submit the transaction
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
    const publicKeyOne = new Key(
      Buffer.from(ethers.utils.arrayify(eoaPublicKey))
    );
    const publicKeyTwo = new Key(
      Buffer.from(ethers.utils.arrayify(data.multisigPartnerPublicKey))
    );
    const publicKeys = [publicKeyOne, publicKeyTwo];
    const privateKey = new Key(
      Buffer.from(ethers.utils.arrayify(eoaPrivateKey))
    );
    const partnerNonces = {
      kPublic: Key.fromHex(data.multisigPartnerKPublicHex),
      kTwoPublic: Key.fromHex(data.multisigPartnerKTwoPublicHex),
    };
    const schnorrkel = getSchnorrkelInstance()
    const publicNonces = schnorrkel.getPublicNonces(privateKey)
    const combinedPublicNonces = [publicNonces, partnerNonces];

    const entryPoint = EntryPoint__factory.connect(ENTRY_POINT_ADDRESS, mainProvider)
    const entryPointNonce = await entryPoint.getNonce(data.multisigAddr, 0)
    const schnorrVirtualAddr = computeSchnorrAddress(data.combinedPublicKey)
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
    const userOperation = {
      sender: data.multisigAddr,
      nonce: userOpNonce,
      initCode,
      callData: executeCalldata,
      callGasLimit: ethers.utils.hexlify(100_000), // hardcode it for now at a high value
      verificationGasLimit: ethers.utils.hexlify(2_000_000), // hardcode it for now at a high value
      preVerificationGas: ethers.utils.hexlify(50_000), // hardcode it for now at a high value
      maxFeePerGas: values.gasPrice,
      maxPriorityFeePerGas: values.gasPrice,
      paymasterAndData: paymasterAndData,
      signature: "0x"
    }
    const userOpHash = await entryPoint.getUserOpHash(userOperation)
    const { signature, challenge, finalPublicNonce } = schnorrkel.multiSigSignHash(
      privateKey,
      userOpHash,
      publicKeys,
      combinedPublicNonces
    );
    const partnerSig = Signature.fromHex(data.multisigPartnerSignature)
    const summedSig = Schnorrkel.sumSigs([signature, partnerSig])
    const verification = Schnorrkel.verifyHash(summedSig, userOpHash, finalPublicNonce, data.combinedPublicKey)
    console.log('VERIFICATION: ' + verification)

    // set the user op signature
    const px = ethers.utils.hexlify(data.combinedPublicKey.buffer.slice(1, 33))
    const parity = data.combinedPublicKey.buffer[0] - 2 + 27
    const sigDataUserOp = abiCoder.encode([ 'bytes32', 'bytes32', 'bytes32', 'uint8' ], [
      px,
      challenge.buffer,
      summedSig.buffer,
      parity
    ])
    const wrappedSig = wrapSchnorr(sigDataUserOp)
    userOperation.signature = wrappedSig

    // send the transaction
    const apiKey = process.env.REACT_APP_PIMLICO_API_KEY
    const pimlicoEndpoint = `https://api.pimlico.io/v1/polygon/rpc?apikey=${apiKey}`
    const pimlicoProvider = new ethers.providers.StaticJsonRpcProvider(pimlicoEndpoint)
    const userOperationHash = await pimlicoProvider.send("eth_sendUserOperation", [userOperation, ENTRY_POINT_ADDRESS])

    // let's also wait for the userOperation to be included, by continually querying for the receipts
    console.log("Querying for receipts...")
    let receipt = null
    let counter = 0
    while (receipt === null) {
      try {
        await new Promise((r) => setTimeout(r, 1000)) //sleep
        counter++
        receipt = await pimlicoProvider.send("eth_getUserOperationReceipt", [userOperationHash])
        console.log(receipt)
      } catch (e) {
        console.log('error throwed, retry counter ' + counter)
      }
    }

    const txHash = receipt.receipt.transactionHash
    console.log(`${txHash}`)

    onFormClose()
    toast({
      title: 'Successfully signed!',
      position: 'top',
      status: 'success',
      duration: 9000,
      isClosable: true,
    })
    setActiveStep(3)

    setTransactionHash(txHash)
  }

  const openInExplorer = () => {
    if (!transactionHash) return;

    const polygonScanUrl = `https://polygonscan.com/tx/${transactionHash}`;
    window.open(polygonScanUrl, '_blank');
  }

  return (
    <>
      <Flex flex={"1"} height="100%" flexDirection={"column"}>
      <Button onClick={onOpen} flex={1} my={4} _hover={{ bg: 'transparent', color: "teal.400", borderColor: "teal.400" }} background={"teal.400"} py={2} borderWidth={3} borderColor={"teal.400"} color={"white"}>Co-Sign</Button>
      {transactionHash && (
        <Alert status="success" mt={4} mb={8} colorScheme="teal">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle color="teal.900">Transaction Sent! Hash:</AlertTitle>
            <AlertDescription display="flex" alignItems="center" flexDirection="column">
              <Text mr={2} color="teal.900" wordBreak="break-word">{transactionHash}</Text>
              <Button size="sm" onClick={openInExplorer}>
                View on PolygonScan
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <QRCodeScanner
            qrCodeSuccessCallback={handleScanSuccess}
            qrCodeErrorCallback={handleScanError}
          />
        </ModalContent>
      </Modal>
      <Modal isOpen={isFormOpen} onClose={onFormClose}>
        <ModalOverlay />
        <ModalContent style={{ padding: 20 }}>
          <h2>Co-sign Transaction</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl>
              <FormLabel htmlFor="to">To:</FormLabel>
              <Input
                id="to"
                type="text"
                readOnly
                placeholder="0x..."
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
                readOnly
                type="number"
                step="0.000000001"
                {...register("value", {
                  required: "This is required",
                  valueAsNumber: true,
                })}
              />
            </FormControl>
            <FormControl>
              <Input id="gasPrice" type="hidden" />
            </FormControl>
            <Button
              mt={4}
              colorScheme="teal"
              isLoading={isSubmitting}
              type="submit"
            >
              Sign & Send
            </Button>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
  
export default CoSign;
