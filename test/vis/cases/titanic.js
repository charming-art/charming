import * as d3 from "d3";

// The Titanic passengers of intuinno/unit's titanic3.csv, which G2's titanic.json and GoFish's
// unit charts use.
export function titanic() {
  return d3.csv("data/titanic3.csv", d3.autoType);
}

// The groups of the rows by a key, as [key, rows], with the number of rows as n for flex.
export function groups(rows, key, domain) {
  const groups = d3.groups(rows, key);
  return domain ? domain.map((k) => groups.find(([g]) => g === k)).filter(Boolean) : groups;
}

// A dot centered in its cell of cm.pack, with a small gap: cm.circle centers itself in the box.
export const dot = {r: (d) => ((d.x1 - d.x) / 2) * 0.85};
