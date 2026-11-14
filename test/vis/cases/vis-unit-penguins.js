import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// A unit chart (waffle) of raw data, one square per penguin: spreadX makes a band per island,
// spreadY with chunk puts the penguins of each island in rows of 10, and spreadX again places the
// penguins of each row side by side inside the band of their island.
export const visUnitPenguins = withSVG(async () => {
  const penguins = await d3.csv("data/penguins.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(penguins)
        .transform(cm.encode, {x: "island", fill: "species"})
        .transform(cm.spreadX)
        .transform(cm.spreadY, {chunk: 10})
        .transform(cm.spreadX)
        .transform(cm.plane)
        .add(cm.rect)
        .add(cm.axisX);
    },
    {width: 640, height: 400},
  );
});
