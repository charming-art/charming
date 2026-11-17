import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's multiple line chart (https://observablehq.com/@observablehq/plot-multiple-line-chart):
// unemployment by metro division, one line per division, grouped by z.
export const visMultipleLine = withSVG(async () => {
  const bls = await d3.csv("data/bls-metro-unemployment.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(bls)
        .transform(cm.encode, {x: "date", y: "unemployment", z: "division"})
        .transform(cm.plane, {y: {grid: true, label: "Unemployment (%)"}})
        .add(cm.lineY);
    },
    {width: 640, height: 400},
  );
});
