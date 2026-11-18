import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// A radial stacked area: Plot's stacked area chart of the unemployed by industry in polar
// coordinates, with time as the angle, and the axes over the areas.
export const visRadialStackedArea = withSVG(async () => {
  const data = await d3.csv("data/bls-industry-unemployment.csv", d3.autoType);
  // A tick per year; 2010 would meet 2000 where the turn closes.
  const years = d3.utcYears(new Date("2000-01-01"), new Date("2010-01-01"));
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "date", y: "unemployed", fill: "industry"})
        .transform(cm.stackY)
        .transform(cm.polar, {innerRadius: 0.3, y: {type: "linear"}})
        .add(cm.areaRadial)
        .add(cm.axis, {x: {anchor: "outer", ticks: years}, y: {tickFormat: "s"}});
    },
    {width: 640, height: 640},
  );
});
