import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's penguins, culmen length against depth, colored by flipper length and sized by body mass,
// with their legends on the right with legend: "right": a ramp standing up, low at the bottom, and
// circles from the smallest down, centered on one line, each labeled at its right.
export const visPenguinLegendsRight = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(penguins.filter((d) => d.flipper_length_mm !== null))
        .transform(cm.encode, {
          x: "culmen_length_mm",
          y: "culmen_depth_mm",
          fill: "flipper_length_mm",
          r: "body_mass_g",
        })
        .transform(cm.plane, {
          marginRight: 120,
          fill: {legend: "right"},
          r: {range: [0, 10], legend: "right"},
        })
        .add(cm.circle, {fillOpacity: 0.7, stroke: "white", strokeWidth: 0.5});
    },
    {width: 640, height: 400},
  );
});
