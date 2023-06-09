import React from "react";
import { utils } from "ethers";
import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";

// TODO: That's temporarily
const privateKey = utils.randomBytes(32);
const msg = "My friend Bobby is awesome!";

// Derive the public key
const publicKey = utils.arrayify(
  utils.computePublicKey(utils.computePublicKey(privateKey, false), true)
);

const Sign: React.FC = () => {
  const handleClick = () => {
    const { signature, finalPublicNonce } = Schnorrkel.sign(
      new Key(Buffer.from(privateKey)),
      msg
    );

    console.log("publicKey", publicKey);

    const isVerified = Schnorrkel.verify(
      signature,
      msg,
      finalPublicNonce,
      new Key(Buffer.from(publicKey))
    );
    console.log("Verified or not:", isVerified);
  };

  return <button onClick={handleClick}>Sign Message</button>;
};

export default Sign;
