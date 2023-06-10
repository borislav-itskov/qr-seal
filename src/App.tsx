import React, { useContext, useEffect } from "react";
import logo from "./qr-seal-logo-transparent.png";
import "./App.css";
import MultisigContext from "./auth/context/multisig";
import {
  Flex,
  Box,
  Heading,
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
import JoinMultisig from "./multisig/components/JoinMultisig";
import CreateTransaction from "./multisig/components/CreateTransaction";
import CoSign from "./multisig/components/CoSign";
import { useEOA } from "./auth/context/eoa";

const steps = [
  { title: "EOA" },
  { title: "Multisig" },
  { title: "Transaction"},
]

function App() {
  const { eoaAddress } = useEOA()
  const { multisigData } = useContext(MultisigContext);
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })

  useEffect(() => {
    if (eoaAddress && !multisigData) {
      setActiveStep(1)
    }

    if (eoaAddress && multisigData) {
      setActiveStep(2)
    }
  }, [activeStep, setActiveStep, eoaAddress, multisigData]);

  return (
  <Flex color={"white"} justifyContent={"center"} minHeight={"100vh"} backgroundColor="blue.100">
      <Flex flex="1" maxWidth={600} flexDirection={"column"}>
        <Flex alignItems="center" justifyContent="center" px={10} pt={50} pb={34} flexDirection="column">
          <img src={logo} alt="qr seal logo" width="200" height="300" style={{ marginBottom: 10 }} />
          <Heading fontWeight={600} fontSize="4xl" color="teal.800" mb="2">QR Seal</Heading>
          <Heading lineHeight="6" fontWeight={400} textAlign="center" fontSize="1xl" color="teal.700">Privacy-Preserving, Gas-Optimized Multisig<br /> via Account Abstraction, ERC-4337 & Schnorr 🤿 Signatures.</Heading>
        </Flex>
        <Flex width={"100%"} flexDirection={"column"}>
            <Stepper index={activeStep} colorScheme="teal" mb={3} variant="withCustomIndicatorSize" size={"lg"} gap="2">
              {steps.map((step, index) => (
                  <Step key={index}>
                    {/* @ts-ignore */}
                    <StepIndicator borderColor={step > activeStep ? 'teal.500' : 'teal.300'}>
                    <StepStatus
                    complete={`✅`} incomplete={`${index === 1 ? `🤿` : `✉️`}`} active={`${index === 1 ? `🤿` : `✉️`}`} />
                    </StepIndicator>
                    <Box flexShrink="0">
                      {/* @ts-ignore */}
                      <StepTitle color="teal.600" fontWeight={800}>{step.title}</StepTitle>
                    </Box>
                    {/* @ts-ignore */}
                    <StepSeparator bg={step > activeStep ? 'teal.500' : 'teal.300'} />
                  </Step>
              ))}
            </Stepper>
            <Flex flexDirection={"column"} flex={1}>
              {/* TODO: Figure out on a later step if we should leave this installation button */}
              {/* <InstallPWA /> */}
              <Accounts />
              <Flex flexDirection={"column"}>
                <Flex alignItems={"center"} justifyContent={"center"} gap={2}>
                  {eoaAddress && <JoinMultisig />}
                </Flex>

                <Flex alignItems={"center"} justifyContent={"center"} gap={2}>
                  {activeStep === 2 && <CreateTransaction />}
                  <CoSign />
                </Flex>

              </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default App;
