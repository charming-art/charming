import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's normalized stack (https://observablehq.com/@observablehq/plot-normalized-stack): the annual
// revenue of the US recording industry by format, as shares of each year with offset "normalize",
// ordered by group and reversed, with rules at 0 and 100%.
export const visNormalizedStack = withSVG(async () => {
  const riaa = await d3.csv("data/riaa-us-revenue.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(riaa)
        .transform(cm.encode, {x: "year", y: "revenue", z: "format", fill: "group"})
        .transform(cm.stackY, {offset: "normalize", order: "fill", reverse: true})
        .transform(cm.plane, {y: {tickFormat: "%", label: "↑ Annual revenue (%)"}})
        .add(cm.areaY)
        .add(cm.annotate(cm.link), {data: [0, 1], y: (d) => d, stroke: "currentColor"});
    },
    {width: 640, height: 400},
  );
});
