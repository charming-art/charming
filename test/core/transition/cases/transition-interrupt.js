import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// Bars that change every 300ms with transitions of 1000ms: each render starts from the bars as
// they're shown, so they turn smoothly without jumping.
export function transitionInterrupt() {
  const renderer = cm.svg({width: 640, height: 300});
  const root = cm.flow({transition: {duration: 1000}}).renderer(renderer);
  const frame = () => {
    root
      .data(Array.from({length: 12}, () => 20 + Math.random() * 260))
      .transform(cm.bind, {x: (d, i) => 20 + i * 50, y: (d) => 300 - d, width: () => 40, height: (d) => d})
      .append(cm.rect, {fill: "steelblue"});
    root.render();
  };
  frame();
  return loop(renderer.node(), frame, 300);
}
