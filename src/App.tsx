import logo from "./qr-seal-logo-transparent.png";
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
  Text,
  Link,
  useColorModeValue,
  Stack,
  Container
} from "@chakra-ui/react";

import Accounts from "./common/accounts";
import JoinMultisig from "./multisig/components/JoinMultisig";
import CreateTransaction from "./multisig/components/CreateTransaction";
import CoSign from "./multisig/components/CoSign";
import { useEOA } from "./auth/context/eoa";
import { useSteps } from "./auth/context/step";

const steps = [
  { title: "EOA" },
  { title: "Multisig" },
  { title: "Transaction" },
];

function App() {
  const { eoaAddress } = useEOA()
  const { activeStep } = useSteps()
  const isMobile = window.innerWidth <= 430

  return (
    <Flex
      color={"white"}
      minHeight={"100vh"}
      backgroundColor="blue.100"
      flexDirection={"column"}
      justifyContent={"space-between"}
    >
      <Flex
        justifyContent={"center"}
      >
        <Flex flex="1" maxWidth={600} flexDirection={"column"}>
          <Flex
            alignItems="center"
            justifyContent="center"
            px={10}
            pt={50}
            pb={34}
            flexDirection="column"
          >
            <img
              src={logo}
              alt="qr seal logo"
              width="200"
              height="300"
              style={{ marginBottom: 10 }}
            />
            <Heading fontWeight={600} fontSize="4xl" color="teal.800" mb="2">
              QR Seal
            </Heading>
            <Heading
              lineHeight="6"
              fontWeight={400}
              textAlign="center"
              fontSize="1xl"
              color="teal.700"
            >
              Privacy-Preserving, Gas-Optimized Multisig
              <br /> via Account Abstraction, ERC-4337 & Schnorr 🤿 Signatures.
            </Heading>
          </Flex>
          <Flex width={"100%"} flexDirection={"column"}>
            <Stepper
              index={activeStep}
              colorScheme="teal"
              mb={3}
              variant="withCustomIndicatorSize" size={isMobile ? "md" : "lg"} gap={isMobile? "1" : "2"}
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  {/* @ts-ignore */}
                  <StepIndicator borderColor={step > activeStep ? "teal.500" : "teal.300"}>
                    <StepStatus
                      complete={`✅`}
                      incomplete={`${index === 1 ? `🤿` : `✉️`}`}
                      active={`${index === 1 ? `🤿` : `✉️`}`}
                    />
                  </StepIndicator>
                  <Box flexShrink="0">
                    {/* @ts-ignore */}
                    <StepTitle color="teal.600" fontSize={isMobile ? "sm": "xl"} fontWeight={800}>
                      {step.title}
                    </StepTitle>
                  </Box>
                  {/* @ts-ignore */}
                  <StepSeparator  bg={step > activeStep ? "teal.500" : "teal.300"} />
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
                  {activeStep === 1 && <CoSign />}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Box
        bg="blue.50"
        color={useColorModeValue('blue.700', 'blue.200')}>
        <Box
          borderTopWidth={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('blue.200', 'blue.700')}>
          <Container
            as={Stack}
            maxW={'6xl'}
            py={4}
            direction={{ base: 'column', md: 'row' }}
            spacing={4}
            justify={{ base: 'center', md: 'center' }}
            align={{ base: 'center', md: 'center' }}>
            <Text textAlign="center">Build at the <Link href="https://ethprague.com" fontWeight="600" transition="all 0.4s" _hover={{ opacity: 0.6 }} target="_blank">
            ETHPrague hackathon 2023 🇨🇿
          </Link> | Made with ❤️ by team <Link fontWeight="600" transition="all 0.4s" _hover={{ opacity: 0.6 }} href="https://devfolio.co/projects/qr-seal-7871" target="_blank">GoodMorning</Link> | <Link fontWeight="600" transition="all 0.4s" _hover={{ opacity: 0.6 }} href="https://github.com/borislav-itskov/qr-seal" target="_blank">
          Open Source</Link></Text>
            <Stack direction={'row'} spacing={6}>
            </Stack>
          </Container>
        </Box>
      </Box>
    </Flex>
  );
}

export default App;
