import { getEOAPublicKey } from "../services/eoa";

const EOAAccount = () => {
  const publicKey = getEOAPublicKey();

  return (
    <p style={{ fontSize: 16 }}>
      EAO account public address:{" "}
      <small style={{ fontSize: 14 }}>{publicKey}</small>
    </p>
  );
};

export default EOAAccount;
