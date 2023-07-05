import Schnorrkel from "@borislav.itskov/schnorrkel.js";

let schnorrkel: Schnorrkel|null;
export function getSchnorrkelInstance() {
  if (!schnorrkel) {
    schnorrkel = new Schnorrkel();
  }
  return schnorrkel;
}