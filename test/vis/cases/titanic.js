import * as d3 from "d3";

// The Titanic passengers of intuinno/unit's titanic3.csv, which G2's titanic.json and GoFish's
// unit charts use.
export function titanic() {
  return d3.csv("data/titanic3.csv", d3.autoType);
}
