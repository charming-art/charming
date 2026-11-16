import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// A grid of cells whose colors change, interpolated in RGB.
export function transitionColors() {
  const renderer = cm.svg({width: 400, height: 400});
  const root = cm.flow({transition: {duration: 1000, ease: "linear"}}).renderer(renderer);
  const frame = () => {
    root
      .data(Array.from({length: 100}, (_, i) => i))
      .transform(cm.bind, {
        x: (i) => (i % 10) * 40,
        y: (i) => Math.floor(i / 10) * 40,
        width: () => 38,
        height: () => 38,
        fill: () => `hsl(${Math.random() * 360}, 70%, 55%)`,
      })
      .append(cm.rect);
    root.render();
  };
  frame();
  return loop(
    renderer.node(),
    async () => {
      frame();
      await root.transition();
    },
    200,
  );
}
