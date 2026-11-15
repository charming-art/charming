import * as d3 from "d3";

// The Titanic passengers of intuinno/unit's titanic3.csv, which G2's titanic.json and GoFish's
// unit charts use.
export function titanic() {
  return d3.csv("data/titanic3.csv", d3.autoType);
}

// A dot centered in its cell of cm.pack, with a small gap: cm.circle centers itself in the box.
export const dot = {r: (d) => ((d.x1 - d.x) / 2) * 0.85};
