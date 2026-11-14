import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Stacked columns: spreadX and stackY, which sums the ages of each state, from the population by state and age of Plot's grouped bar chart example.
export const visStackedColumn = withSVG(async () => {
  const data = await d3.csv("data/population-state-age.csv", d3.autoType);
  const ages = Array.from(new Set(data.map((d) => d.age)));
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "state", y: "population", fill: {value: "age", domain: ages}})
        .transform(cm.spreadX)
        .transform(cm.stackY)
        .transform(cm.plane)
        .add(cm.rect)
        .add(cm.axis, {y: {tickFormat: "s"}});
    },
    {width: 640, height: 400},
  );
});
