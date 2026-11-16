import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// A bubble sort, one comparison a step. The bars are the same objects in every step, so they're
// matched by datum, with no key, and swap places.
export function transitionBubbleSort() {
  const renderer = cm.svg({width: 640, height: 300});
  const root = cm.flow({transition: {duration: 300}}).renderer(renderer);
  const values = Array.from({length: 20}, (_, i) => ({value: 20 + i * 13}));
  let i = 0;
  let j = 0;
  const shuffle = () => values.sort(() => Math.random() - 0.5);
  const frame = () => {
    root
      .data(values.slice())
      .transform(cm.bind, {
        x: (d, i) => 20 + i * 30,
        y: (d) => 300 - d.value,
        width: () => 24,
        height: (d) => d.value,
        fill: (d, i) => (i === j || i === j + 1 ? "orange" : "steelblue"),
      })
      .append(cm.rect);
    root.render();
  };
  const step = () => {
    if (values[j].value > values[j + 1].value) [values[j], values[j + 1]] = [values[j + 1], values[j]];
    j++;
    if (j < values.length - 1 - i) return;
    j = 0;
    i++;
    if (i < values.length - 1) return;
    i = 0;
    shuffle();
  };
  shuffle();
  frame();
  return loop(
    renderer.node(),
    async () => {
      step();
      frame();
      await root.transition();
    },
    50,
  );
}
