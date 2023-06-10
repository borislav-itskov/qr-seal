import Schnorrkel from "@borislav.itskov/schnorrkel.js";

let schnorrkel: Schnorrkel|null;
export default function getSchnorrkelInstance() {
  if (!schnorrkel) {
    schnorrkel = new Schnorrkel();
  }
  return schnorrkel;
}