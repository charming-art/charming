import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// The penguin bubble chart with its two legends, the species and the masses, in a column right of
// the chart, with anchor "right": each legend's title is above it, and the right margin leaves room
// for them.
export const visPenguinBubbleLegendRight = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(penguins)
        .transform(cm.encode, {x: "culmen_length_mm", y: "culmen_depth_mm", r: "body_mass_g", fill: "species"})
        .transform(cm.plane, {marginRight: 130, scales: {r: {range: [0, 10]}}})
        .add(cm.axis, {grid: true})
        .add(cm.circle, {fillOpacity: 0.5, stroke: "white", strokeWidth: 0.5})
        .add(cm.legend, {anchor: "right"});
    },
    {width: 640, height: 480},
  );
});
