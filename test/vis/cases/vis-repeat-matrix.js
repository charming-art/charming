import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// G2's repeat matrix (https://g2.antv.antgroup.com/en/examples/composition/repeat/matrix/): a
// scatterplot matrix of four penguin measurements. Each cell is a chart nested in a band of the
// grid, plotting its own pair of fields, so its scales are independent of the other cells.
export const visRepeatMatrix = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  const fields = ["culmen_length_mm", "culmen_depth_mm", "flipper_length_mm", "body_mass_g"];
  return renderFlow(
    (root) => {
      root
        .data(d3.cross(fields, fields))
        .transform(cm.encode, {x: {value: ([fx]) => fx, domain: fields}, y: {value: ([, fy]) => fy, domain: fields}})
        .transform(cm.spreadX)
        .transform(cm.spreadY)
        .transform(cm.plane, {marginLeft: 130, marginBottom: 60})
        .add(cm.axis, {x: {label: null, tickSize: 0, tickPadding: 24}, y: {label: null, tickSize: 0, tickPadding: 40}})
        .append(cm.group)
        .data(([fx, fy]) =>
          penguins
            .map((d) => ({x: d[fx], y: d[fy], species: d.species}))
            .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y)),
        )
        .transform(cm.encode, {x: "x", y: "y", fill: "species"})
        .transform(cm.plane, {resolve: {x: "independent", y: "independent"}})
        .add(cm.axis, {grid: true})
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor"})
        .add(cm.circle, {r: 1.5});
    },
    {width: 800, height: 800},
  );
});
