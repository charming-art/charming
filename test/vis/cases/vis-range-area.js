import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// G2's range spline area (https://g2.antv.antgroup.com/en/examples/general/area/range-spline-area/),
// without its line: an area from low to high and points at v2, which shares the y scale.
export const visRangeArea = withSVG(async () => {
  const rows = await d3.json("data/range-spline-area.json");
  const data = rows.map(([x, low, high, v2]) => ({x: +x, low, high, v2}));
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "x", y: "high", y1: "low", v2: {value: "v2", scale: "y"}})
        .transform(cm.plane)
        .add(cm.areaY, {curve: "natural", fill: "#64b5f6", fillOpacity: 0.65, stroke: "#64b5f6"})
        .add(cm.circle, {y: "v2", r: 2, fill: "currentColor"})
        .add(cm.axis, {y: {label: null}});
    },
    {width: 640, height: 400},
  );
});
