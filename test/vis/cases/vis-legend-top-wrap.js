import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// The unemployed by industry over time, stacked, with a legend of its 14 industries at the top: the
// swatches wrap to new rows past the width of the chart, and the top margin holds them all.
export const visLegendTopWrap = withSVG(async () => {
  const data = await d3.csv("data/bls-industry-unemployment.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "date", y: "unemployed", fill: "industry"})
        .transform(cm.stackY)
        .transform(cm.plane, {y: {grid: true}, fill: {legend: true}})
        .add(cm.areaY);
    },
    {width: 640, height: 400},
  );
});
