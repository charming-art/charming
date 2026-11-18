import * as d3 from "d3";
import * as cm from "../../../../src/index.js";
import {intro} from "./intro.js";

// Canis's Nightingale chart (https://canisjs.github.io/canis-editor/index.html?exmp=nightingale_1):
// the causes of mortality over a year, stacked by month, the types one after another and their
// wedges 200ms apart, each opening like a wheel from its start angle for 600ms.
export async function visTransitionNightingale() {
  const data = await d3.csv("data/nightingale.csv", d3.autoType);
  const renderer = cm.svg({width: 640, height: 640});
  const root = cm.flow({transition: true}).renderer(renderer);
  const draw = () => {
    root
      .data(data)
      .transform(cm.encode, {x: "Month", y: "Death", fill: "Type"})
      .transform(cm.spreadX, {sort: false})
      .transform(cm.stackY)
      .transform(cm.stackEnter, {step: 200, duration: 600})
      .transform(cm.polar, {
        x: {axis: true},
        fill: {
          domain: ["Disease", "Wounds", "Other"],
          range: ["rgb(251, 106, 74)", "rgb(107, 174, 214)", "rgb(150, 150, 150)"],
          legend: true,
        },
      })
      .add(cm.arc, {stroke: "white", appear: true, enter: {sweep: 0}});
  };
  return intro(renderer.node(), root, draw);
}
