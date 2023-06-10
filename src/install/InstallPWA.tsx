import React, { useEffect, useState } from "react";
import { Box, Button } from "@chakra-ui/react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const InstallPWA: React.FC = () => {
  const [installable, setInstallable] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const listener = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallable(true);
      setInstallPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", listener as any);

    // Cleanup
    return () =>
      window.removeEventListener("beforeinstallprompt", listener as any);
  }, []);

  const handleClick = async () => {
    if (!installPromptEvent) return;

    // Show the install prompt
    await installPromptEvent.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPromptEvent.userChoice;
    console.log("User response to the install prompt:", outcome);

    // Cleanup
    setInstallPromptEvent(null);
    setInstallable(false);
  };

  return (
    <Box
      position="fixed"
      bottom="1rem"
      right="1rem"
      zIndex="999"
      bg="white"
      p={3}
      boxShadow="md"
      borderRadius="md"
    >
      <Button onClick={handleClick} disabled={!installable} colorScheme="blue">
        Install (PWA) App
      </Button>
    </Box>
  );
};

export default InstallPWA;
