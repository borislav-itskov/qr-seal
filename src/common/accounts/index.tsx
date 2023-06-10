import React, { useContext } from 'react'
import { getEOAAddress } from "../../auth/services/eoa";
import AccountAddress from "./AccountAddress";
import MultisigContext from "../../auth/context/multisig";
import { Flex, Text } from "@chakra-ui/react"

const Accounts = () => {
  const address = getEOAAddress();
  const { multisigData } = useContext(MultisigContext)
  return (
    <Flex flexDirection={"column"} mb={3}>
      <Text textAlign={"center"} color={"teal.500"} fontSize={"xl"}>My Addresses</Text>
      <Flex>
        <AccountAddress address={address} addressType="EOA" />
        <AccountAddress address={multisigData.multisigAddr} addressType="Multisig" />
      </Flex>
    </Flex>

  );
};

export default Accounts;
