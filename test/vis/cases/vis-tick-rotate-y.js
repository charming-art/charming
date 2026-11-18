import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Bars of the penguins by species, whose names stand vertically, centered on their bars, with
// the axis's tickRotate of -90, reading bottom to top.
export const visTickRotateY = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  const counts = d3.rollups(
    penguins,
    (D) => D.length,
    (d) => d.species,
  );
  return renderFlow(
    (root) => {
      root
        .data(counts)
        .transform(cm.encode, {x: ([, n]) => n, y: ([species]) => species})
        .transform(cm.spreadY)
        .transform(cm.plane, {marginLeft: 30, y: {tickRotate: -90, label: null}, x: {grid: true}})
        .add(cm.rect);
    },
    {width: 640, height: 300},
  );
});
