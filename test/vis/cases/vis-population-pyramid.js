import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's population pyramid (https://observablehq.com/@observablehq/plot-population-pyramid): the
// population of Germany by age, sex and marital status, from the German Federal Institute for
// Population Research (BiB). Men go left as negative values, and stackX stacks each side per age.
export const visPopulationPyramid = withSVG(async () => {
  const population = await d3.csv("data/population-pyramid.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(population)
        .transform(cm.encode, {
          x: (d) => d.population * (d.sex === "M" ? -1 : 1),
          y: "age",
          z: (d) => `${d.sex},${d.category}`,
          fill: "category",
        })
        .transform(cm.stackX)
        .transform(cm.plane, {
          scales: {
            fill: {
              domain: ["ledig", "verheiratet", "geschieden", "verwitwet"],
              range: ["#69AEBE", "#F1757A", "#F2B678", "#989D9E"],
            },
          },
        })
        .add(cm.axis, {
          x: {label: "← men · population (thousands) · women →", tickFormat: Math.abs},
          y: {grid: true},
        })
        .add(cm.areaX);
    },
    {width: 500, height: 500},
  );
});
