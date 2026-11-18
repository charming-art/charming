import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's penguins counted by species and island, as dots sized by their count: cm.group counts the
// penguins of each pair into r, which the r scale of cm.plane maps to radii by a square root, and
// each dot sits in the middle of its cell, between the bands of its species and island.
export const visPenguinSpeciesIsland = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(penguins)
        .transform(cm.encode, {x: "species", y: "island"})
        .transform(cm.group, {r: "count"})
        .transform(cm.spreadX, {padding: 0})
        .transform(cm.spreadY, {padding: 0})
        .transform(cm.plane, {r: {range: [0, 40]}, x: {grid: true}, y: {grid: true}})
        .add(cm.circle, {fill: "steelblue", fillOpacity: 0.8})
        .add(cm.label, {text: (d) => d.datum.length, fill: "white", fontWeight: "bold"});
    },
    {width: 480, height: 300},
  );
});
