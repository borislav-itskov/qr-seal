import Schnorrkel from "@borislav.itskov/schnorrkel.js";

let txnSchnorrkel: Schnorrkel|null;
export function getTxnSchnorrkelSigner() {
  if (!txnSchnorrkel) {
    txnSchnorrkel = new Schnorrkel();
  }
  return txnSchnorrkel;
}

let userOpSchnorrkel: Schnorrkel|null;
export function getUserOpSchnorrkelSigner() {
  if (!userOpSchnorrkel) {
    userOpSchnorrkel = new Schnorrkel();
  }
  return userOpSchnorrkel;
}