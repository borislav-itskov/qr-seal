import React from "react";
import { utils } from "ethers";
// TODO: Figure out why this import fails
// import Schnorrkel from "@borislav.itskov/schnorrkel.js";
const Schnorrkel = require("@borislav.itskov/schnorrkel.js");
const schnorrkel = new Schnorrkel();

// TODO: That's temporarily
const privateKey = utils.randomBytes(32);
const msg = "My friend Bobby is awesome!";

// Derive the public key
const publicKey = utils.arrayify(
  utils.computePublicKey(utils.computePublicKey(privateKey, false), true)
);

const Sign: React.FC = () => {
  const handleClick = () => {
    const { R, s } = schnorrkel.sign(msg, privateKey);

    console.log("publicKey", publicKey);

    const isVerified = schnorrkel.verify(s, msg, R, publicKey);
    console.log("Verified or not:", isVerified);
  };

  return <button onClick={handleClick}>Sign Message</button>;
};

export default Sign;
