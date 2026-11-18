import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// A polar waffle: GoFish's seafood waffle in polar coordinates. unitY turns each count into that
// many cells, and stackY stacks them outward in rows of 10 within the angle of each lake. The
// radius is radial, so that every cell has the same area.
export const visPolarWaffle = withSVG(async () => {
  const seafood = await d3.csv("data/seafood.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(seafood)
        .transform(cm.encode, {x: "lake", y: "count", fill: "species"})
        .transform(cm.spreadX)
        .transform(cm.unitY)
        .transform(cm.stackY, {chunk: 10})
        .transform(cm.polar, {innerRadius: 0.2, x: {axis: "outer"}, y: {axis: true}})
        .add(cm.arc);
    },
    {width: 640, height: 640},
  );
});
