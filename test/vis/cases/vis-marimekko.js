import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's Marimekko chart (https://observablehq.com/@observablehq/plot-marimekko), without its labels:
// sales by market and segment. Each market's column is as wide as its total sales, with flex; within
// it, the segments stack to 100%, with offset "normalize".
export const visMarimekko = withSVG(async () => {
  const sales = await d3.csv("data/sales.csv", d3.autoType);
  const markets = Array.from(new Set(sales.map((d) => d.market)));
  return renderFlow(
    (root) => {
      root
        .data(sales)
        .transform(cm.encode, {
          x: "market",
          y: "value",
          fill: "segment",
          n: "value",
        })
        .transform(cm.spreadX, {flex: "n", padding: 0, domain: markets})
        .transform(cm.stackY, {offset: "normalize"})
        .transform(cm.plane, {marginTop: 10, x: {label: null}, y: {label: null, tickFormat: "%"}})
        .add(cm.rect, {fillOpacity: 0.5, stroke: "white"})
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"});
    },
    {width: 960, height: 640},
  );
});
