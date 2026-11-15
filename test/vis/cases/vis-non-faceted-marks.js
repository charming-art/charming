import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's non-faceted marks (https://observablehq.com/@observablehq/plot-non-faceted-marks): penguins
// faceted by sex and species, with all the penguins repeated in each cell as small gray dots. Each
// cell is a chart nested in a band of the grid; the gray dots are annotations with their own data.
export const visNonFacetedMarks = withSVG(async () => {
  // Like Plot, penguins without measurements aren't drawn.
  const penguins = (await d3.csv("data/penguins.csv", d3.autoType)).filter((d) => Number.isFinite(d.culmen_length_mm));
  const sexes = Array.from(new Set(penguins.map((d) => d.sex)));
  const species = Array.from(new Set(penguins.map((d) => d.species)));
  return renderFlow(
    (root) => {
      root
        .data(d3.cross(sexes, species))
        .transform(cm.encode, {x: ([sex]) => `${sex}`, y: ([, species]) => species})
        .transform(cm.spreadX)
        .transform(cm.spreadY)
        .transform(cm.plane, {marginLeft: 80, marginBottom: 50})
        .add(cm.axis, {x: {label: null, tickSize: 0, tickPadding: 24}, y: {label: null, tickSize: 0, tickPadding: 36}})
        .append(cm.group)
        .data(([sex, species]) => penguins.filter((d) => d.sex === sex && d.species === species))
        .transform(cm.encode, {x: "culmen_length_mm", y: "culmen_depth_mm"})
        .transform(cm.plane)
        .add(cm.axis, {grid: true})
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.annotate(cm.circle), {
          data: penguins,
          x: (d) => d.culmen_length_mm,
          y: (d) => d.culmen_depth_mm,
          fill: "#aaa",
          r: 1,
        })
        .add(cm.circle, {r: 2, fill: "none", stroke: "currentColor"});
    },
    {width: 640, height: 560},
  );
});
