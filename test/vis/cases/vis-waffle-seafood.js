import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// GoFish's waffle chart (https://gofish.graphics/js/examples/waffle-chart.html): unitY turns each
// count into that many squares, and nested spreads put the squares of each lake in rows of 5.
export const visWaffleSeafood = withSVG(async () => {
  const seafood = await d3.csv("data/seafood.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(seafood)
        .transform(cm.encode, {x: "lake", y: "count", fill: "species"})
        .transform(cm.spreadX)
        .transform(cm.unitY)
        .transform(cm.spreadY, {chunk: 5})
        .transform(cm.spreadX)
        .transform(cm.plane)
        .add(cm.rect)
        .add(cm.axisX);
    },
    {width: 640, height: 400},
  );
});
