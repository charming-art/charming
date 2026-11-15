import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// D3's radial area chart (https://observablehq.com/@d3/radial-area-chart/2): the daily temperatures
// at San Francisco airport, 1999–2018, per day of the year. The records, minmin to maxmax, the mean
// range, min to max, and the mean, avg, share the radial y scale.
export const visRadialArea = withSVG(async () => {
  const raw = await d3.csv("data/sfo-temperature.csv", d3.autoType);
  const days = d3
    .groups(raw, ({DATE}) => Date.UTC(2000, DATE.getUTCMonth(), DATE.getUTCDate()))
    .sort(([a], [b]) => d3.ascending(a, b))
    .map(([date, v]) => ({
      date: new Date(date),
      avg: d3.mean(v, (d) => d.TAVG || NaN),
      min: d3.mean(v, (d) => d.TMIN || NaN),
      max: d3.mean(v, (d) => d.TMAX || NaN),
      minmin: d3.min(v, (d) => d.TMIN || NaN),
      maxmax: d3.max(v, (d) => d.TMAX || NaN),
    }));
  return renderFlow(
    (root) => {
      root
        .data(days)
        .transform(cm.encode, {
          x: "date",
          y: "max",
          y1: "min",
          maxmax: {value: "maxmax", scale: "y"},
          minmin: {value: "minmin", scale: "y"},
          avg: {value: "avg", scale: "y"},
        })
        .transform(cm.polar, {innerRadius: 928 / 5 / 454, margin: 10})
        .add(cm.areaRadial, {
          y: "maxmax",
          y1: "minmin",
          fill: "lightsteelblue",
          fillOpacity: 0.2,
          curve: "linear-closed",
        })
        .add(cm.areaRadial, {fill: "steelblue", fillOpacity: 0.2, curve: "linear-closed"})
        .add(cm.lineRadial, {y: "avg", stroke: "steelblue", curve: "linear-closed"})
        .add(cm.axis, {x: {grid: true, tickFormat: "%B"}, y: {tickFormat: (d) => `${d}°F`}});
    },
    {width: 928, height: 928},
  );
});
