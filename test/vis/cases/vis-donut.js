import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// A donut with its angle axis outside, like GoFish's donut chart, from ECharts' pie example.
export const visDonut = withSVG(async () => {
  const data = await d3.csv("data/access.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "value", fill: "name"})
        .transform(cm.stackX)
        .transform(cm.polar, {innerRadius: 0.5})
        .add(cm.arc, {stroke: "white"})
        .add(cm.axisX, {anchor: "outer"});
    },
    {width: 640, height: 640},
  );
});
