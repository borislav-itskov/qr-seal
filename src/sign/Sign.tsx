import React from "react";
import { utils } from "ethers";
import Schnorrkel, { Key } from "@borislav.itskov/schnorrkel.js";
import { getEOAPrivateKey, getEOAPublicKey } from "../auth/services/eoa";
import { Button } from "@chakra-ui/react";

// TODO: That's temporarily
const msg = "My friend Bobby is awesome!";

// Derive the public key

const Sign: React.FC = () => {
  const handleClick = () => {
    const publicKey = utils.arrayify(getEOAPublicKey());
    const privateKey = utils.arrayify(getEOAPrivateKey());

    const { signature, finalPublicNonce } = Schnorrkel.sign(
      new Key(Buffer.from(privateKey)),
      msg
    );

    const isVerified = Schnorrkel.verify(
      signature,
      msg,
      finalPublicNonce,
      new Key(Buffer.from(publicKey))
    );
    console.log("Verified or not:", isVerified);
  };

  return (
    <Button onClick={handleClick} colorScheme="green">
      Sign Message
    </Button>
  );
};

export default Sign;
