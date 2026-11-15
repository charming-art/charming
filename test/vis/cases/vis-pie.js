import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// A pie: a stacked bar along x in polar coordinates, from ECharts' pie example.
export const visPie = withSVG(async () => {
  const data = await d3.csv("data/access.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "value", fill: "name"})
        .transform(cm.stackX)
        .transform(cm.polar)
        .add(cm.arc, {stroke: "white"});
    },
    {width: 640, height: 640},
  );
});
