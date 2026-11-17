import * as d3 from "d3";
import * as cm from "../../../../src/index.js";
import {replay} from "./replay.js";

// The steps of a bubble sort: the order after each comparison, and the pair compared.
function bubbleSort(values) {
  const order = values.slice();
  const steps = [{values: order.slice(), compared: []}];
  for (let i = 0; i < order.length - 1; i++) {
    for (let j = 0; j < order.length - 1 - i; j++) {
      if (order[j].value > order[j + 1].value) [order[j], order[j + 1]] = [order[j + 1], order[j]];
      steps.push({values: order.slice(), compared: [order[j].id, order[j + 1].id]});
    }
  }
  steps.push({values: order.slice(), compared: []});
  return steps;
}

// A bubble sort, one keyframe per comparison: the bars are keyed by id, so swapped bars trade
// places, and the pair compared is highlighted. Each step keeps the order of its rows with sort
// false, so the axis labels the bars by value and its labels slide with them.
export function visTransitionBubbleSort() {
  const renderer = cm.svg({width: 640, height: 320});
  const root = cm.flow({transition: {duration: 240}}).renderer(renderer);
  const draw = () => {
    const values = d3.shuffle(d3.range(16).map((id) => ({id, value: 10 + id * 6})));
    root
      .data(bubbleSort(values))
      .append(cm.keyframe)
      .data((step) => step.values.map((d) => ({...d, compared: step.compared.includes(d.id)})))
      .transform(cm.encode, {
        x: "value",
        y: "value",
        key: "id",
        fill: (d) => (d.compared ? "compared" : "value"),
      })
      .transform(cm.spreadX, {sort: false})
      .transform(cm.plane, {scales: {y: {domain: [0, 100]}, fill: {domain: ["value", "compared"]}}})
      .add(cm.axis)
      .add(cm.rect);
  };
  return replay(renderer.node(), root, draw);
}
