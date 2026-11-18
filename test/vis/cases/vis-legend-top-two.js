import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// The frequency of each letter in English, colored by letter and shaded by frequency, with both
// legends at the top: the 26 swatches wrap to fill the width, so the ramp of the opacities, which
// doesn't fit beside them, starts a new row under them.
export const visLegendTopTwo = withSVG(async () => {
  const alphabet = await d3.csv("data/alphabet.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(alphabet)
        .transform(cm.encode, {x: "letter", y: "frequency", fill: "letter", fillOpacity: "frequency"})
        .transform(cm.spreadX)
        .transform(cm.plane, {fill: {legend: true}, fillOpacity: {legend: true, range: [0.3, 1]}})
        .add(cm.rect);
    },
    {width: 640, height: 400},
  );
});
