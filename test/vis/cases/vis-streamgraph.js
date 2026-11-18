import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's streamgraph of the unemployed by industry over time (Plot's industry-unemployment-stream
// test): the stacked areas of Plot's stacked area chart, with stackY's wiggle offset, which shifts
// each date's stack so that the layers flow, changing their slopes as little as it can.
export const visStreamgraph = withSVG(async () => {
  const data = await d3.csv("data/bls-industry-unemployment.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(data)
        .transform(cm.encode, {x: "date", y: "unemployed", fill: "industry"})
        .transform(cm.stackY, {offset: "wiggle"})
        .transform(cm.plane)
        .add(cm.areaY);
    },
    {width: 640, height: 400},
  );
});
