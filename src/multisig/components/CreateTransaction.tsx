import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { utils } from "ethers";
import { useMemo } from "react";
import QRCode from "react-qr-code";
import { getEOAPrivateKey, getEOAPublicKey } from "../../auth/services/eoa";
import { useForm } from "react-hook-form";
import {
  Modal,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  Button,
} from "@chakra-ui/react";

interface FormProps {
  to: string;
  value: number;
}

const CreateTransaction = (props: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormProps>();

  const onSubmit = (values: FormProps) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        alert(JSON.stringify(values, null, 2));
        resolve(true);
      }, 3000);
    });
  };

  return (
    <>
      <Button onClick={onOpen}>Create Transaction</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent style={{ padding: 20 }}>
          <h2>Create Transaction</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl>
              <FormLabel htmlFor="to">To</FormLabel>
              <Input
                id="to"
                type="text"
                placeholder="to (address)"
                {...register("to", {
                  required: "This is required",
                })}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="value">To</FormLabel>
              <Input
                id="value"
                placeholder="value"
                type="number"
                {...register("value", {
                  required: "This is required",
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
    </>
  );
};

export default CreateTransaction;
