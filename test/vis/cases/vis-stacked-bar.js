import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Stacked bars: spreadY and stackX, which sums the ages of each state, from the population by state and age of Plot's grouped bar chart example.
export const visStackedBar = withSVG(async () => {
  const data = await d3.csv("data/population-state-age.csv", d3.autoType);
  const ages = Array.from(new Set(data.map((d) => d.age)));
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {y: "state", x: "population", fill: "age"})
        .transform(cm.spreadY)
        .transform(cm.stackX, {order: ages})
        .transform(cm.plane)
        .add(cm.rect)
        .add(cm.axis, {x: {tickFormat: "s"}});
    },
    {width: 640, height: 400},
  );
});
