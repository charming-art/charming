import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// D3's radial stacked bar chart: stacked columns in polar coordinates, with the states inside the
// hole, from the population by state and age of Plot's grouped bar chart example.
export const visRadialStackedBar = withSVG(async () => {
  const data = await d3.csv("data/population-state-age.csv", d3.autoType);
  const ages = Array.from(new Set(data.map((d) => d.age)));
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "state", y: "population", fill: {value: "age", domain: ages}})
        .transform(cm.spreadX)
        .transform(cm.stackY)
        .transform(cm.polar, {innerRadius: 0.4})
        .add(cm.arc)
        .add(cm.axis, {y: {tickFormat: "s"}});
    },
    {width: 640, height: 640},
  );
});
