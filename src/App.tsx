import React from "react";
import logo from "./logo.svg";
import "./App.css";
import InstallPWA from "./install/InstallPWA";
import Sign from "./sign/Sign";
import EOAAccount from "./auth/components/EOAAccount";
import CreateMultisigByScanning from "./multisig/components/CreateMultisigByScanning";
import JoinMultisig from "./multisig/components/JoinMultisig";
import CreateTransaction from "./multisig/components/CreateTransaction";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* TODO: Figure out on a later step if we should leave this installation button */}
        <InstallPWA />
        <EOAAccount />
        <img src={logo} className="App-logo" alt="logo" />
        <Sign />
        <CreateMultisigByScanning />
        <JoinMultisig />
        <CreateTransaction />
      </header>
    </div>
  );
}

export default App;
