import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's simple line chart (https://observablehq.com/@observablehq/plot-simple-line-chart): the
// daily closing price of Apple stock.
export const visSimpleLine = withSVG(async () => {
  const aapl = await d3.csv("data/aapl.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(aapl)
        .transform(cm.encode, {x: "Date", y: "Close"})
        .transform(cm.plane, {y: {grid: true}})
        .add(cm.lineY);
    },
    {width: 640, height: 400},
  );
});
