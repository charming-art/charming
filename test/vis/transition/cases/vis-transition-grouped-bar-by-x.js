import * as cm from "../../../../src/index.js";
import {intro} from "./intro.js";
import {sales} from "./vis-transition-grouped-bar.js";

// The grouped bar of visTransitionGroupedBar, year by year rather than fruit by fruit: with by: "x",
// cm.stackEnter groups the bars by their year, so 2001's three bars wipe up 100ms apart, then
// 2002's, 200ms later. The bars are still laid out side by side by fruit, as only the timing is
// grouped by x.
export function visTransitionGroupedBarByX() {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow({transition: true}).renderer(renderer);
  const draw = () => {
    root
      .data(sales)
      .transform(cm.encode, {x: "category", y: "value", fill: "position"})
      // Before the bands of x are split among the fruits, x is still the year.
      .transform(cm.stackEnter, {by: "x", step: 100, gap: 200, duration: 300})
      .transform(cm.spreadX)
      .transform(cm.stackX)
      .transform(cm.plane, {
        x: {label: "Year"},
        y: {label: "Sale"},
        fill: {domain: ["Apple", "Orange", "Banana"], range: ["#1f77b4", "#ff7f0e", "#ff0e0e"], legend: true},
      })
      .add(cm.rect, {appear: true, enter: {clipTop: 1}});
  };
  return intro(renderer.node(), root, draw);
}
