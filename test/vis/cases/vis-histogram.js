import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's stacked histogram (https://observablehq.com/@observablehq/plot-vertical-histogram): the
// weights of Olympic athletes, binned on x and counted per sex, stacked, with a rule at 0. Like
// Plot's rect, bars are inset by 0.5px on each side.
export const visHistogram = withSVG(async () => {
  const athletes = await d3.csv("data/athletes.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(athletes)
        .transform(cm.encode, {x: "weight", fill: "sex"})
        .transform(cm.binX, {y: "count"})
        .transform(cm.stackY)
        .transform(cm.plane)
        .add(cm.axis, {y: {grid: true}})
        .add(cm.rect, {x: (d) => d.x + 0.5, x1: (d) => d.x1 - 0.5})
        .add(cm.annotate(cm.link), {y: 0});
    },
    {width: 640, height: 400},
  );
});
