import React, { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

// TODO: Figure out why this works on MacOS Chrome only, but not on Android or iOS Chrome
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
    <>
      <p>
        QR Seal can be installed on your device. Press the button below to
        install:
      </p>
      <button onClick={handleClick} disabled={!installable}>
        Install App
      </button>
    </>
  );
};

export default InstallPWA;
