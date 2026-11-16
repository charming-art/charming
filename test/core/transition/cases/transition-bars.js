import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

const letters = "ABCDEFGHIJKL".split("");

// Bars keyed by letter: matched bars update, new ones rise from the bottom, removed ones sink.
export function bars(renderer) {
  const root = cm.flow({transition: {duration: 750}}).renderer(renderer);
  const frame = () => {
    const data = letters.filter(() => Math.random() > 0.3).map((id) => ({id, value: 20 + Math.random() * 260}));
    root
      .data(data)
      .transform(cm.bind, {
        x: (d, i) => 20 + i * 50,
        y: (d) => 300 - d.value,
        width: () => 40,
        height: (d) => d.value,
        key: (d) => d.id,
      })
      .append(cm.rect, {fill: "steelblue", enter: {y: 300, height: 0}, exit: {y: 300, height: 0}});
    root.render();
  };
  frame();
  return loop(
    renderer.node(),
    async () => {
      frame();
      await root.finished();
    },
    750,
  );
}

export function transitionBars() {
  return bars(cm.svg({width: 640, height: 300}));
}
