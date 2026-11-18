import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's stacked waffles (https://observablehq.com/@observablehq/plot-stacked-waffles): athletes
// per 10 kg of weight, women up and men down, one square per 10 athletes. unitY sums the signed
// counts of each bin and sex into squares, and stackY with chunk stacks them in rows of 5, which keeps the cells about square here.
export const visStackedWaffles = withSVG(async () => {
  const athletes = await d3.csv("data/athletes.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(athletes)
        .transform(cm.encode, {
          x: (d) => Math.floor(d.weight / 10) * 10,
          y: (d) => (d.sex === "female" ? 1 : -1),
          fill: "sex",
        })
        .transform(cm.spreadX)
        .transform(cm.unitY, {unit: 10})
        .transform(cm.stackY, {chunk: 5})
        .transform(cm.plane)
        .add(cm.rect);
    },
    {width: 640, height: 400},
  );
});
