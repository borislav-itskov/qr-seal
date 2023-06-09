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
        {/* TODO: Beautify */}
        <InstallPWA />
        <EOAAccount />
        <img src={logo} className="App-logo" alt="logo" />
        <Sign />
      </header>
    </div>
  );
}

export default App;
