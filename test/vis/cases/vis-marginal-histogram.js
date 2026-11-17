import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// GoFish's marginal histogram (https://gofish.graphics/js/examples/marginal-histogram-jointplot): a
// scatterplot of the penguins' culmens, with the histograms of length on top, binned every 2mm, and
// of depth on the right, binned every 1mm. The views are the cells of a 2 × 2 grid, rows then
// columns weighted 1:4 with flex. The views branch from the cells, each with data only in its own,
// and are planed together: they share the scales they name, length and depth, while each count
// keeps its own.
export const visMarginalHistogram = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  const length = {value: "culmen_length_mm", scale: "length"};
  const depth = {value: "culmen_depth_mm", scale: "depth"};
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
      const [scatter, top, right] = root
        .data(rows)
        .transform(cm.encode, {y: "row", h: "h"})
        .transform(cm.spreadY, {flex: "h", paddingInner: 0.05, paddingOuter: 0, domain: ["top", "main"]})
        .transform(cm.plane, {marginBottom: 30})
        .append(cm.g)
        .data((row) => row.cells)
        .transform(cm.encode, {x: "col", w: "w"})
        .transform(cm.spreadX, {flex: "w", paddingInner: 0.05, paddingOuter: 0, domain: ["main", "side"]})
        .transform(cm.plane)
        .append(cm.g)
        .branch(
          (flow) => flow.data(view("scatter")).transform(cm.encode, {x: length, y: depth}),
          (flow) =>
            flow.data(view("top")).transform(cm.encode, {x: length}).transform(cm.binX, {y: "count", interval: 2}),
          (flow) =>
            flow.data(view("right")).transform(cm.encode, {y: depth}).transform(cm.binY, {x: "count", interval: 1}),
        )
        .transform(cm.plane);
      scatter.add(cm.axis).add(cm.circle, {r: 3, fill: "steelblue", fillOpacity: 0.6});
      top.add(cm.rect, {fill: "steelblue"});
      right.add(cm.rect, {fill: "steelblue"});
    },
    {width: 400, height: 400},
  );
});
