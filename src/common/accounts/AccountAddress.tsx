import React from "react";
import { Box, Text, Flex, Button } from "@chakra-ui/react";
import Blockies from "react-blockies";
import CreateMultisigByScanning from "../../multisig/components/CreateMultisigByScanning";

const AccountAddress = ({
  address,
  addressType,
  onCreate,
  type,
}: any) => {
  return (
    <Box flex={1} maxW={["100%","300px"]} boxShadow={"2xl"} rounded={"lg"} p={6}>
      {address ? (
        <Flex flexDirection={"column"}>
          <Flex alignItems={"center"} mb={1}>
            <Box mr={4} rounded="lg">
              {address ? (
                <Blockies
                  seed={address}
                  size={12}
                  scale={4}
                  className="identicon"
                />
              ) : (
                <></>
              )}
            </Box>
            <Text
              fontSize={"md"}
              color={"teal.700"}
              textAlign="left"
              fontWeight={500}
              mb={2}
            >
              {addressType}
            </Text>
          </Flex>
          <Box>
            <Text
              noOfLines={3}
              wordBreak={"break-word"}
              fontSize={"md"}
              textAlign="left"
              color={"teal.900"}
              fontWeight={600}
            >
              {address || "No address generated yet"}
            </Text>
          </Box>
        </Flex>
      ) : type === "eoa" ? (
        <Button
          onClick={onCreate}
          flex={1}
          background={"blue.400"}
          color={"white"}
          _hover={{ color: "blue.400", background: "white" }}
          my={3}
        >
          Create EOA
        </Button>
      ) : (
        <CreateMultisigByScanning />
      )}
    </Box>
  );
};

export default AccountAddress;
