import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// GoFish's scatter plot with pie glyphs (https://gofish.graphics/js/examples/scatter-plot-with-pie-glyphs):
// each lake at its location, drawn as a pie of its catch by species. The pies are charts nested in
// the rows of the scatter plot: one group per lake, whose data is that lake's catch.
export const visPieGlyphs = withSVG(async () => {
  const lakes = await d3.csv("data/seafood-locations.csv", d3.autoType);
  const seafood = await d3.csv("data/seafood.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(lakes)
        .transform(cm.encode, {x: "x", y: "y"})
        .transform(cm.plane, {margin: 40, marginLeft: 60}) // room for the pies
        .append(cm.g)
        .data((lake) => seafood.filter((d) => d.lake === lake.lake))
        .transform(cm.encode, {x: "count", fill: "species"})
        .transform(cm.stackX)
        .transform(cm.polar, {width: 40, height: 40, resolve: {x: "independent"}})
        .add(cm.arc, {stroke: "white"});
    },
    {width: 640, height: 400},
  );
});
