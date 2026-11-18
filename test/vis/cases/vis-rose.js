import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// A rose (Nightingale) chart: a column chart in polar coordinates, from ECharts' example.
export const visRose = withSVG(async () => {
  const data = await d3.csv("data/rose.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "name", y: "value", fill: "name"})
        .transform(cm.spreadX)
        .transform(cm.polar, {x: {axis: true}})
        .add(cm.arc)
        // The rings and labels of the radius are drawn over the wedges, after them.
        .add(cm.axisY);
    },
    {width: 640, height: 640},
  );
});
