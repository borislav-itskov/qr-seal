import React, { useContext } from 'react'
import AccountAddress from "./AccountAddress";
import MultisigContext from "../../auth/context/multisig";
import { Flex, Heading } from "@chakra-ui/react"
import { useEOA } from '../../auth/context/eoa';

const Accounts = () => {
  const { eoaAddress, createAndStoreEOA } = useEOA();
  const { multisigData } = useContext(MultisigContext)

  return (
    <Flex flexDirection={"column"} mb={3}>
      <Heading textAlign={"center"} color={"teal.500"} fontSize={"xl"}>My Addresses</Heading>
      <Flex justifyContent={"space-between"} gap={"2"}>
        <AccountAddress type="eoa" address={eoaAddress} createAndStoreEOA={createAndStoreEOA} addressType="Externaly Owned Account (EOA)" />
        <AccountAddress type="multisig" address={multisigData.multisigAddr} addressType="Account Abstraction Smart Account (Multisig)" />
      </Flex>
    </Flex>

  );
};

export default Accounts;
