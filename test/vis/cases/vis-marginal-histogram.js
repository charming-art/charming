import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// GoFish's marginal histogram (https://gofish.graphics/js/examples/marginal-histogram-jointplot): a
// scatterplot of the penguins' culmens, with the histograms of length on top, binned every 2mm, and
// of depth on the right, binned every 1mm. The views are the cells of a 2 × 2 grid, rows then
// columns weighted 1:4 with flex; each view is a chart nested in every cell, with data only in its
// own. The views share the domains of their positions, the extents of the bins.
export const visMarginalHistogram = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  const domainOf = (field, interval) => {
    const [lo, hi] = d3.extent(penguins, (d) => d[field]);
    return [Math.floor(lo / interval) * interval, (Math.floor(hi / interval) + 1) * interval];
  };
  const domainX = domainOf("culmen_length_mm", 2);
  const domainY = domainOf("culmen_depth_mm", 1);
  const rows = [
    {
      row: "top",
      h: 1,
      cells: [
        {view: "top", col: "main", w: 4},
        {view: null, col: "side", w: 1},
      ],
    },
    {
      row: "main",
      h: 4,
      cells: [
        {view: "scatter", col: "main", w: 4},
        {view: "right", col: "side", w: 1},
      ],
    },
  ];
  const view = (name) => (cell) => (cell.view === name ? penguins : []);
  return renderFlow(
    (root) => {
      root
        .data(rows)
        .transform(cm.encode, {y: {value: "row", domain: ["top", "main"]}, h: "h"})
        .transform(cm.spreadY, {flex: "h", paddingInner: 0.05, paddingOuter: 0})
        .transform(cm.plane, {marginBottom: 30})
        .append(cm.g)
        .data((row) => row.cells)
        .transform(cm.encode, {x: {value: "col", domain: ["main", "side"]}, w: "w"})
        .transform(cm.spreadX, {flex: "w", paddingInner: 0.05, paddingOuter: 0})
        .transform(cm.plane)
        .call((cells) => {
          cells
            .append(cm.g)
            .data(view("scatter"))
            .transform(cm.encode, {x: "culmen_length_mm", y: "culmen_depth_mm"})
            .transform(cm.plane, {domainX, domainY})
            .add(cm.axis)
            .add(cm.circle, {r: 3, fill: "steelblue", fillOpacity: 0.6});
          cells
            .append(cm.g)
            .data(view("top"))
            .transform(cm.encode, {x: "culmen_length_mm"})
            .transform(cm.binX, {y: "count", interval: 2})
            .transform(cm.plane, {domainX})
            .add(cm.rect, {fill: "steelblue"});
          cells
            .append(cm.g)
            .data(view("right"))
            .transform(cm.encode, {y: "culmen_depth_mm"})
            .transform(cm.binY, {x: "count", interval: 1})
            .transform(cm.plane, {domainY})
            .add(cm.rect, {fill: "steelblue"});
        });
    },
    {width: 400, height: 400},
  );
});
