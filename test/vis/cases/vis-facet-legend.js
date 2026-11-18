import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's faceted scatterplot (https://observablehq.com/plot/features/facets): the culmens of
// penguins, one panel per island, colored by species. The panels are charts nested in the bands of
// the islands; the color is shared by them, so its legend is drawn once, over the panels.
export const visFacetLegend = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  const measured = penguins.filter((d) => Number.isFinite(d.culmen_length_mm) && Number.isFinite(d.culmen_depth_mm));
  return renderFlow(
    (root) => {
      root
        .data(d3.groups(measured, (d) => d.island))
        .transform(cm.encode, {x: ([island]) => island})
        .transform(cm.spreadX, {padding: 0.1})
        .transform(cm.plane, {x: {label: null, axis: "top", tickSize: 0}})
        .append(cm.g)
        .data(([, rows]) => rows)
        .transform(cm.encode, {x: "culmen_length_mm", y: "culmen_depth_mm", fill: "species"})
        .transform(cm.plane, {x: {axis: "bottom"}, y: {axis: "left"}, fill: {legend: true}})
        .add(cm.annotate(cm.rect), {fill: "none", stroke: "currentColor", strokeOpacity: 0.2})
        .add(cm.circle, {r: 2});
    },
    {width: 800, height: 360},
  );
});
