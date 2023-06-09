import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Sign from "./sign/Sign";
import { createAndStoreEOAIfNeeded } from "./auth/services/eoa";
import EOAAccount from "./auth/components/EOAAccount";

// TODO: Init EOA account creation when page is loaded. Ideally, it should
// prompt the user to create EOA or something.
createAndStoreEOAIfNeeded();

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <EOAAccount />
        <Sign />
      </header>
    </div>
  );
}

export default App;
