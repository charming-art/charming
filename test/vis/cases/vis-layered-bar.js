import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Layered bars: spreadY alone, so the ages overlap from 0, from the population by state and age of Plot's grouped bar chart example.
export const visLayeredBar = withSVG(async () => {
  const data = await d3.csv("data/population-state-age.csv", d3.autoType);
  const ages = Array.from(new Set(data.map((d) => d.age)));
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {y: "state", x: "population", fill: "age"})
        .transform(cm.spreadY)
        .transform(cm.plane, {scales: {fill: {domain: ages}}})
        .add(cm.rect, {fillOpacity: 0.6})
        .add(cm.axis, {x: {tickFormat: "s"}});
    },
    {width: 640, height: 400},
  );
});
