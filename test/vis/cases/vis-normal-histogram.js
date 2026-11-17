import * as d3 from "d3";
import * as cm from "../../../src/index.js";

// Plot's normal histogram (https://observablehq.com/@observablehq/plot-normal-histogram): 10,000
// samples of a normal distribution, from a seeded source so that the snapshot is stable.
export function visNormalHistogram() {
  const random = d3.randomNormal.source(d3.randomLcg(42))();
  const renderer = cm.svg();
  const root = cm.flow().renderer(renderer);
  root
    .data(Array.from({length: 10000}, random))
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.binX, {y: "count"})
    .transform(cm.plane)
    .add(cm.rect, cm.insetX(0.5));
  root.render();
  return renderer.node();
}
