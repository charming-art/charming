import * as d3 from "d3";
import * as cm from "../../../../src/index.js";
import {replay} from "./replay.js";

// d3's bar chart race (https://observablehq.com/@d3/bar-chart-race), without its in-between
// keyframes: the top 12 brands by value, one keyframe per year. Each year sorts its bands by value
// with spreadY's sort, and the bars are keyed by name, so they slide to their new ranks, brands
// entering or leaving the top 12 slide in and out from below the frame, which clips them, and the
// value labels tick between years.
// The x axis rescales each year, as x is resolved per keyframe.
export async function visTransitionBarChartRace() {
  const brands = await d3.csv("data/category-brands.csv", d3.autoType);
  const n = 12;
  const years = d3.groups(brands, (d) => d.date.getUTCFullYear());
  const renderer = cm.svg({width: 640, height: 480});
  const root = cm.flow({transition: {duration: 1000, ease: "linear"}}).renderer(renderer);
  // The labels of a bar: dark and sans-serif, like the axis, rather than the bar's color, and in
  // the middle of its band, sliding in and out from below with it.
  const label = {
    y: (d) => (d.y + d.y1) / 2,
    fill: "#333",
    fontSize: 12,
    fontFamily: "system-ui, sans-serif",
    textBaseline: "middle",
    enter: {y: 500},
    exit: {y: 500},
  };
  const draw = () => {
    const keyframes = root.data(years).append(cm.keyframe);
    keyframes.append(cm.text, {
      x: 620,
      y: 465,
      text: ([year]) => year,
      textAlign: "end",
      fontSize: 48,
      fontWeight: "bold",
      fill: "#ccc",
    });
    keyframes
      .data(([, rows]) => d3.sort(rows, (d) => -d.value).slice(0, n))
      .transform(cm.encode, {x: "value", y: "name", fill: "category", key: "name"})
      .transform(cm.spreadY, {padding: 0.1, sort: "-x"})
      // The right margin leaves room for the value labels past the longest bar. The marks are
      // clipped to the frame, so bars and labels sliding in and out from below are hidden outside it.
      .transform(cm.plane, {
        marginTop: 30,
        marginLeft: 10,
        marginRight: 70,
        clip: true,
        resolve: {x: "independent"},
      })
      .add(cm.axisX, {anchor: "top", grid: true, label: null})
      // Like d3's, bars entering or leaving the top 12 slide in and out from below the chart.
      .add(cm.rect, {fillOpacity: 0.7, enter: {y: 500}, exit: {y: 500}})
      .add(cm.text, {...label, x: (d) => d.x - 6, text: (d) => d.datum.name, textAlign: "end", fontWeight: "bold"})
      .add(cm.text, {...label, x: (d) => d.x + 6, text: (d) => d.datum.value, format: d3.format(",d")});
  };
  return replay(renderer.node(), root, draw);
}
