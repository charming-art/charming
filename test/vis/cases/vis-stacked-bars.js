import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's stacked bars (https://observablehq.com/@observablehq/plot-stacked-bars), without the legend:
// penguins counted per island and species, grouped on x, then stacked.
export const visStackedBars = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(penguins)
        .transform(cm.encode, {x: "island", fill: "species"})
        .transform(cm.groupX, {y: "count"})
        .transform(cm.spreadX)
        .transform(cm.stackY)
        .transform(cm.plane)
        .add(cm.rect);
    },
    {width: 640, height: 400},
  );
});
