import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// D3's radial stacked bar chart (https://observablehq.com/@d3/radial-stacked-bar-chart/2): the
// population of every state by age, sorted by total.
export const visRadialStackedBarD3 = withSVG(async () => {
  const wide = await d3.csv("data/us-population-state-age.csv", d3.autoType);
  const ages = wide.columns.slice(1);
  const data = wide.flatMap((d) => ages.map((age) => ({state: d.name, age, population: d[age]})));
  const states = d3.groupSort(
    data,
    (D) => -d3.sum(D, (d) => d.population),
    (d) => d.state,
  );
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {
          x: {value: "state", domain: states},
          y: "population",
          fill: {value: "age", domain: ages, range: d3.schemeSpectral[ages.length]},
        })
        .transform(cm.spreadX)
        .transform(cm.stackY)
        .transform(cm.polar, {innerRadius: 180 / 454, margin: 10})
        .add(cm.arc)
        .add(cm.axis, {y: {ticks: 5, tickFormat: "s"}});
    },
    {width: 928, height: 928},
  );
});
