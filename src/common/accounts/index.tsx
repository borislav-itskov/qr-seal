import React, { useContext } from 'react'
import { getEOAAddress, createAndStoreEOAIfNeeded } from "../../auth/services/eoa";
import AccountAddress from "./AccountAddress";
import MultisigContext from "../../auth/context/multisig";
import { Flex, Heading } from "@chakra-ui/react"

const Accounts = () => {
  const address = getEOAAddress();
  const { multisigData } = useContext(MultisigContext)
  return (
    <Flex flexDirection={"column"} mb={3}>
      <Heading textAlign={"center"} color={"teal.500"} fontSize={"xl"}>My Addresses</Heading>
      <Flex justifyContent={"space-between"} gap={"2"}>
        <AccountAddress address={address} addressType="Externaly Owned Account (EOA)" onCreate={createAndStoreEOAIfNeeded} />
        <AccountAddress address={multisigData.multisigAddr} addressType="Multisig (Smart Account)" />
      </Flex>
    </Flex>

  );
};

export default Accounts;
