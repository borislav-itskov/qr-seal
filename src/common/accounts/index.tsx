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
      <Heading textAlign={"center"} color={"teal.500"} mt={6} mb={5} fontSize={"xl"}>Your Accounts</Heading>
      <Flex flexDirection={['column','row']} justifyContent={"space-between"} gap={"2"}>
        <AccountAddress type="eoa" address={eoaAddress} addressType="Externaly Owned Account (EOA)" onCreate={createAndStoreEOA} />
        <AccountAddress type="multisig" address={multisigData.multisigAddr} addressType="Smart Account (with Multisig)" />
      </Flex>
    </Flex>

  );
};

export default Accounts;
