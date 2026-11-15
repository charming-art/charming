import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's ribbon chart (https://observablehq.com/@observablehq/plot-ribbon-chart): the stacked area
// of the unemployed by industry, with each stack sorted by value, so that the bands swap places.
export const visRibbonArea = withSVG(async () => {
  const data = await d3.csv("data/bls-industry-unemployment.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "date", y: "unemployed", fill: "industry"})
        .transform(cm.stackY, {order: "value"})
        .transform(cm.plane)
        .add(cm.areaY)
        .add(cm.axis, {y: {grid: true}});
    },
    {width: 640, height: 400},
  );
});
