import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// GoFish's polar ribbon chart (https://gofish.graphics/js/examples/polar-ribbon-chart): the ribbon
// chart of the seafood in polar coordinates, with arcs for the bars and radial areas that spiral
// between them.
export const visPolarRibbonSeafood = withSVG(async () => {
  const seafood = await d3.csv("data/seafood.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(seafood)
        .transform(cm.encode, {x: "lake", y: "count", fill: "species"})
        .transform(cm.spreadX, {padding: 0.9})
        .transform(cm.stackY, {order: "value"})
        .transform(cm.polar, {innerRadius: 0.2})
        .add(cm.axisY)
        .add(cm.arc)
        .add(cm.areaRadial, {curve: "bump-x", fillOpacity: 0.8});
    },
    {width: 640, height: 640},
  );
});
