import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's state population change (https://observablehq.com/@observablehq/plot-state-population-change):
// the change in population of each state from 2010 to 2019, as a share, in bars that grow left or
// right of 0, colored by sign, under a centered title. Plot labels the states with two y axes at 0
// and the changes with two text marks, one for each sign; two cm.labels do it, with positions per
// row: the names along 0 on the side away from their bars, and the changes past their ends.
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
          marginLeft: 50,
          scales: {
            x: {label: "← decrease · Change in population, 2010–2019 (%) · increase →"},
            fill: {type: "ordinal", range: [d3.schemePiYG[3][0], d3.schemePiYG[3][2]]},
          },
        })
        // Like Plot's percent option, the ticks are in percentage points.
        .add(cm.axisX, {anchor: "top", labelAnchor: "center", tickFormat: (d) => d3.format("+.0f")(d * 100)})
        .add(cm.rect)
        .add(cm.label, {
          text: (d) => d.datum.State,
          position: (d) => (change(d.datum) >= 0 ? "left" : "right"),
          padding: 9,
        })
        .add(cm.label, {
          text: (d) => change(d.datum),
          format: "+.1%",
          position: (d) => (change(d.datum) >= 0 ? "right" : "left"),
        })
        .add(cm.annotate(cm.link), {x: 0});
    },
    {width: 640, height: 800},
  );
});
