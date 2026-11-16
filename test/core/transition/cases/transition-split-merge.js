import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// One bar keyed A splits into 24 points whose group key is A: the bar is cut into equal pieces, and
// each piece morphs into a point; then the points morph into the pieces and merge back into the bar.
export function transitionSplitMerge() {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow({transition: {duration: 1200}}).renderer(renderer);
  const points = Array.from({length: 24}, () => [40 + Math.random() * 560, 40 + Math.random() * 320]);
  let split = false;
  const frame = () => {
    if (split) {
      root
        .data(points)
        .transform(cm.bind, {x: ([x]) => x, y: ([, y]) => y, r: () => 8, groupKey: () => "A"})
        .append(cm.circle, {fill: "steelblue"});
    } else {
      root.data([0]).append(cm.rect, {x: 220, y: 100, width: 200, height: 260, fill: "orange", key: "A"});
    }
    root.render();
  };
  frame();
  return loop(
    renderer.node(),
    async () => {
      split = !split;
      frame();
      await root.finished();
    },
    600,
  );
}
