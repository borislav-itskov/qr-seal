import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Sign from "./sign/Sign";
import EOAAccount from "./auth/components/EOAAccount";

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
