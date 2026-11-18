import * as d3 from "d3";
import * as cm from "../../../src/index.js";

// G2's basic cell example (https://g2.antv.antgroup.com/en/examples/general/cell/cell-basic/):
// bands for both x and y, with groups named A to I.
export async function visCell() {
  const cells = await d3.csv("data/cells.csv", d3.autoType);
  const renderer = cm.svg();
  const root = cm.flow().renderer(renderer);
  root
    .data(cells)
    .transform(cm.encode, {x: "column", y: "row", fill: "group"})
    .transform(cm.spreadX)
    .transform(cm.spreadY)
    .transform(cm.plane, {height: 640})
    .add(cm.rect);
  root.render();
  return renderer.node();
}
