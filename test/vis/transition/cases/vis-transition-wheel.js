import * as d3 from "d3";
import * as cm from "../../../../src/index.js";
import {loop} from "../../../core/transition/cases/loop.js";

// The rose of visRose, in and out: its wedges enter with sweep 0, so each opens like a wheel from
// its start angle, and exit to it, closing back. The axes are drawn as they are.
export async function visTransitionWheel() {
  const data = await d3.csv("data/rose.csv", d3.autoType);
  const renderer = cm.svg({width: 640, height: 640});
  const root = cm.flow({transition: {duration: 1000}}).renderer(renderer);
  let shown = true;
  const frame = () => {
    if (shown) {
      root
        .data(data)
        .transform(cm.encode, {x: "name", y: "value", fill: "name"})
        .transform(cm.spreadX)
        .transform(cm.polar, {x: {axis: true}, y: {axis: true}})
        .add(cm.arc, {enter: {sweep: 0}, exit: {sweep: 0}});
    }
    root.render();
  };
  frame();
  return loop(
    renderer.node(),
    async () => {
      shown = !shown;
      frame();
      await root.finished();
    },
    800,
  );
}
