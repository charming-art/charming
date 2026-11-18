import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Columns of the unemployed by industry in January 2010, whose long names are rotated with the
// axis's tickRotate, like Plot's.
export const visTickRotateX = withSVG(async () => {
  const data = await d3.csv("data/bls-industry-unemployment.csv", d3.autoType);
  const january = data.filter((d) => +d.date === Date.UTC(2010, 0, 1));
  return renderFlow(
    (root) => {
      root
        .data(january)
        .transform(cm.encode, {x: "industry", y: "unemployed"})
        .transform(cm.spreadX)
        .transform(cm.plane, {x: {tickRotate: -45, label: null}, y: {grid: true}})
        .add(cm.rect);
    },
    {width: 640, height: 500},
  );
});
