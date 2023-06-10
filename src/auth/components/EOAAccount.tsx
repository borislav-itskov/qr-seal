import React from "react";
import { Box, Text, Flex, useColorModeValue } from "@chakra-ui/react";
import Blockies from "react-blockies";
import { getEOAAddress } from "../services/eoa";

const EOAAccount = () => {
  const address = getEOAAddress();

  return (
    <Box maxW={"500px"} w={"full"} boxShadow={"2xl"} rounded={"lg"} p={6}>
      <Flex>
        <Box mr={4} rounded="lg">
          <Blockies seed={address} size={15} scale={4} className="identicon" />
        </Box>
        <Box>
          <Text fontSize={"lg"} textAlign="left" fontWeight={500} mb={2}>
            EOA Account Address
          </Text>
          <Text fontSize={"md"} textAlign="left" fontWeight={400}>
            {address}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default EOAAccount;
