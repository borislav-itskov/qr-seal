import React, { useContext, useEffect } from "react";
import logo from "./qr-seal-logo-transparent.png";
import "./App.css";
import { Flex, Text, Box, Heading } from "@chakra-ui/react"
import MultisigContext from "./auth/context/multisig";
import {
  Step,
  StepIndicator,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react"

import InstallPWA from "./install/InstallPWA";
import Accounts from "./common/accounts";
import CreateMultisigByScanning from "./multisig/components/CreateMultisigByScanning";
import JoinMultisig from "./multisig/components/JoinMultisig";
import CreateTransaction from "./multisig/components/CreateTransaction";
import CoSign from "./multisig/components/CoSign";
import { getEOAAddress } from "./auth/services/eoa";

const steps = [
  { title: "EOA" },
  { title: "Multisig" },
  { title: "Transaction"},
]

function App() {
  const address = getEOAAddress();
  const { multisigData } = useContext(MultisigContext);
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })

  useEffect(() => {
    if (address && !multisigData) {
      setActiveStep(1)
    }

    if (address && multisigData) {
      setActiveStep(2)
    }
  }, [setActiveStep, address, multisigData]);

  return (
  <Flex color={"white"} justifyContent={"center"} minHeight={"100vh"} backgroundColor="blue.100">
      <Flex flex="1" maxWidth={600} flexDirection={"column"}>
        <Flex alignItems="center" justifyContent="center" px={10} py={50} flexDirection="column">
          <img src={logo} alt="qr seal logo" width="200" height="300" style={{ marginBottom: 10 }} />
          <Heading fontWeight={600} fontSize="4xl" color="teal.800" mb="2">QR Seal</Heading>
          <Heading lineHeight="6" fontWeight={400} textAlign="center" fontSize="1xl" color="teal.700">Privacy-Preserving, Gas-Optimized Multisig<br /> via Account Abstraction, ERC-4337 & Schnorr 🤿 Signatures.</Heading>
        </Flex>
        <Flex width={"100%"} flexDirection={"column"}>
            <Stepper index={activeStep} colorScheme="teal" mb={3} gap="2">
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                  <StepStatus
                  complete={`✅`} incomplete={`${index === 1 ? `🤿` : `✉️`}`} active={`${index === 1 ? `🤿` : `✉️`}`} />
                  </StepIndicator>

                  <Box flexShrink="0">
                    <StepTitle>{step.title}</StepTitle>
                  </Box>

                  <StepSeparator />
                </Step>
              ))}
            </Stepper>
            <Flex flexDirection={"column"} flex={1}>
              {/* TODO: Figure out on a later step if we should leave this installation button */}
              <InstallPWA />
              <Accounts />
              <Flex flexDirection={"column"}>
                <CreateMultisigByScanning />
                <JoinMultisig />

                {activeStep === 2 && <>
                  <CreateTransaction />
                  <CoSign />
                </>}

              </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default App;
