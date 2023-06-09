import React from "react";
import logo from "./logo.svg";
import "./App.css";
import InstallPWA from "./install/InstallPWA";
import Sign from "./sign/Sign";
import EOAAccount from "./auth/components/EOAAccount";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* TODO: Figure out on a later step if we should leave this installation button */}
        <InstallPWA />
        <EOAAccount />
        <img src={logo} className="App-logo" alt="logo" />
        <Sign />
      </header>
    </div>
  );
}

export default App;
