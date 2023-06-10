import React from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import Blockies from "react-blockies";

const AccountAddress = ({ address, addressType }: any) => {
  return (
    <Box flex={1} maxW={"300px"} boxShadow={"2xl"} rounded={"lg"} p={6}>
      <Flex flexDirection={"column"}>
        <Flex alignItems={"center"} mb={1}>
          <Box mr={4} rounded="lg">
            {address ? <Blockies seed={address} size={12} scale={4} className="identicon" /> : <></>}
          </Box>
          <Text fontSize={"md"} textAlign="left" fontWeight={500} mb={2}>
            {addressType}
          </Text>
        </Flex>
        <Box>
          <Text noOfLines={3} wordBreak={"break-word"} fontSize={"md"} textAlign="left" fontWeight={400}>
            {address || "No address generated yet"}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default AccountAddress;
