import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// The frequency of each letter in English, colored by letter, with a legend of its 26 letters on the
// right: the swatches, one per line, wrap into a second column past the height of the frame.
export const visLegendRightWrap = withSVG(async () => {
  const alphabet = await d3.csv("data/alphabet.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(alphabet)
        .transform(cm.encode, {x: "letter", y: "frequency", fill: "letter"})
        .transform(cm.spreadX)
        .transform(cm.plane, {marginRight: 80, fill: {legend: "right"}})
        .add(cm.rect);
    },
    {width: 640, height: 400},
  );
});
