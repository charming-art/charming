import * as cm from "../../../../src/index.js";
import {intro} from "./intro.js";

// Canis's grouped bar (https://canisjs.github.io/canis-editor/index.html?exmp=groupedBar_1): the
// sales of three fruits in two years, the fruits one after another, 200ms apart, and their bars
// 100ms apart, each wiping up from the bottom for 300ms. cm.stackEnter groups the bars by their
// series, the fruits, by default; with by: "x", they'd go year by year.
export function visTransitionGroupedBar() {
  const data = [
    {category: "2001", position: "Apple", value: 260},
    {category: "2001", position: "Orange", value: 106},
    {category: "2001", position: "Banana", value: 105},
    {category: "2002", position: "Apple", value: 210},
    {category: "2002", position: "Orange", value: 145},
    {category: "2002", position: "Banana", value: 25},
  ];
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow({transition: true}).renderer(renderer);
  const draw = () => {
    root
      .data(data)
      .transform(cm.encode, {x: "category", y: "value", fill: "position"})
      .transform(cm.spreadX)
      .transform(cm.stackX)
      .transform(cm.stackEnter, {step: 100, gap: 200, duration: 300})
      .transform(cm.plane, {
        x: {label: "Year"},
        y: {label: "Sale"},
        fill: {domain: ["Apple", "Orange", "Banana"], range: ["#1f77b4", "#ff7f0e", "#ff0e0e"], legend: true},
      })
      .add(cm.rect, {appear: true, enter: {clipTop: 1}});
  };
  return intro(renderer.node(), root, draw);
}
