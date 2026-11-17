import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// GoFish's polar ribbon chart (https://gofish.graphics/js/examples/polar-ribbon-chart): the ribbon
// chart of the seafood in polar coordinates, with arcs for the bars and radial areas that spiral
// between them. Like GoFish, a bar starts every sixth of a turn from 12 o'clock, and the radius is
// linear, so that the ribbons keep their thickness.
export const visPolarRibbonSeafood = withSVG(async () => {
  const seafood = await d3.csv("data/seafood.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(seafood)
        .transform(cm.encode, {x: "lake", y: "count", fill: "species"})
        .transform(cm.spreadX, {paddingInner: 0.9, paddingOuter: 0.45, align: 0})
        .transform(cm.stackY, {order: "value"})
        .transform(cm.polar, {innerRadius: 0.2, scales: {y: {type: "linear"}}})
        .add(cm.arc)
        .add(cm.areaRadial, {curve: "bump-x", fillOpacity: 0.8})
        .add(cm.axis, {x: {anchor: "outer"}});
    },
    {width: 640, height: 640},
  );
});
