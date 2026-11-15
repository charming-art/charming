import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's stacked area chart (https://observablehq.com/@observablehq/plot-stacked-area-chart): the
// unemployed by industry over time, stacked with stackY.
export const visStackedArea = withSVG(async () => {
  const data = await d3.csv("data/bls-industry-unemployment.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "date", y: "unemployed", fill: "industry"})
        .transform(cm.stackY)
        .transform(cm.plane)
        .add(cm.area)
        .add(cm.axis, {y: {grid: true}});
    },
    {width: 640, height: 400},
  );
});
