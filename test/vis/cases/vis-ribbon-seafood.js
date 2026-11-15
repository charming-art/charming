import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// GoFish's ribbon chart (https://gofish.graphics/js/examples/ribbon-chart): narrow bars per lake,
// with the species sorted by count, and an area per species that is flat across the bars and
// curves between them.
export const visRibbonSeafood = withSVG(async () => {
  const seafood = await d3.csv("data/seafood.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(seafood)
        .transform(cm.encode, {x: "lake", y: "count", fill: "species"})
        .transform(cm.spreadX, {padding: 0.8})
        .transform(cm.stackY, {order: "value"})
        .transform(cm.plane)
        .add(cm.rect)
        .add(cm.areaY, {curve: "bump-x", fillOpacity: 0.8})
        .add(cm.axisX);
    },
    {width: 640, height: 400},
  );
});
