import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's state population change (https://observablehq.com/@observablehq/plot-state-population-change):
// the change in population of each state from 2010 to 2019, as a share, in bars that grow left or
// right of 0, colored by sign. Plot labels the states with two y axes at 0, one filtered to each
// sign; one cm.label does it, with a position per row: left of a growing state's bar, and right
// of a shrinking one's, so the names sit along 0 on the side away from their bars.
export const visStatePopulationChange = withSVG(async () => {
  const statepop = await d3.csv("data/us-state-population-2010-2019.csv", d3.autoType);
  const change = (d) => (d[2019] - d[2010]) / d[2010];
  return renderFlow(
    (root) => {
      root
        .data(statepop)
        .transform(cm.encode, {y: "State", x: change, fill: (d) => Math.sign(change(d))})
        .transform(cm.spreadY, {sort: "x"})
        .transform(cm.plane, {
          marginTop: 30,
          marginLeft: 20,
          scales: {
            x: {label: "← decrease · Change in population, 2010–2019 (%) · increase →"},
            fill: {type: "ordinal", range: [d3.schemePiYG[3][0], d3.schemePiYG[3][2]]},
          },
        })
        .add(cm.axisX, {anchor: "top", grid: true, tickFormat: "+%"})
        .add(cm.rect)
        .add(cm.label, {
          text: (d) => d.datum.State,
          position: (d) => (change(d.datum) >= 0 ? "left" : "right"),
          padding: 3,
        })
        .add(cm.annotate(cm.link), {x: 0});
    },
    {width: 640, height: 800},
  );
});
