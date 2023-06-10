import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import * as serviceWorkerRegistration from "./config/service-worker-registration";
import { MultisigProvider } from "./auth/context/multisig";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { EOAProvider } from "./auth/context/eoa";

// TODO: Optimize those by importing only the weights we need
import '@fontsource-variable/roboto-slab';
import '@fontsource-variable/open-sans';
import { StepProvider } from "./auth/context/step";

const theme = extendTheme({
  fonts: {
    heading: `'Roboto Slab Variable', sans-serif`,
    body: `'Open Sans', sans-serif`,
  },
})

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <ChakraProvider theme={theme}>
    <StepProvider>
      <EOAProvider>
        <MultisigProvider>
          <App />
        </MultisigProvider>
      </EOAProvider>
    </StepProvider>
  </ChakraProvider>
  // </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
