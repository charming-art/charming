import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// One bar keyed A splits into eight bars whose group key is A, then they merge back into it.
export function transitionSplitMerge() {
  const renderer = cm.svg({width: 640, height: 300});
  const root = cm.flow({transition: {duration: 900}}).renderer(renderer);
  let split = false;
  const frame = () => {
    if (split) {
      root
        .data(Array.from({length: 8}, () => 40 + Math.random() * 220))
        .transform(cm.bind, {
          x: (d, i) => 20 + i * 76,
          y: (d) => 300 - d,
          width: () => 60,
          height: (d) => d,
          groupKey: () => "A",
        })
        .append(cm.rect, {fill: "steelblue"});
    } else {
      root.data([0]).append(cm.rect, {x: 120, y: 120, width: 400, height: 180, fill: "orange", key: "A"});
    }
    root.render();
  };
  frame();
  return loop(
    renderer.node(),
    async () => {
      split = !split;
      frame();
      await root.transition();
    },
    600,
  );
}
