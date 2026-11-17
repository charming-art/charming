import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's horizontal bar chart of letter frequencies, with each bar labeled with its frequency at
// its end: in white inside the bars that have room, and past the end of the others. Plot draws
// these with two text marks, one filtered to each kind of bar; one cm.label does it, with a
// position and a fill per row.
export const visLabeledBars = withSVG(async () => {
  const alphabet = await d3.csv("data/alphabet.csv", d3.autoType);
  const room = (d) => d.datum.frequency >= 0.02;
  return renderFlow(
    (root) => {
      root
        .data(alphabet)
        .transform(cm.encode, {x: "frequency", y: "letter"})
        .transform(cm.spreadY, {sort: "-x"})
        .transform(cm.plane, {marginLeft: 30, scales: {x: {label: "Frequency"}}})
        .add(cm.rect, {fill: "steelblue"})
        .add(cm.label, {
          text: (d) => d.datum.frequency,
          format: ".1%",
          position: (d) => (room(d) ? "inside-right" : "right"),
          fill: (d) => (room(d) ? "white" : "currentColor"),
        })
        .add(cm.axis, {x: {tickFormat: "%"}, y: {label: null}});
    },
    {width: 640, height: 560},
  );
});
