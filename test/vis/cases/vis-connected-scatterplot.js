import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Plot's connected scatterplot (https://observablehq.com/@observablehq/plot-connected-scatterplot),
// after Hannah Fairfield's: miles driven against the price of gas, one point a year, in order. Like
// d3's, every fifth year is labeled on the side of its point given by the data, over a white halo
// so that the labels read over the line.
export const visConnectedScatterplot = withSVG(async () => {
  const driving = await d3.csv("data/driving.csv", d3.autoType);
  const fifth = driving.filter((d) => d.year % 5 === 0);
  return renderFlow(
    (root) => {
      const [line, labels] = root
        .branch(
          (flow) => flow.data(driving).transform(cm.encode, {x: "miles", y: "gas"}),
          (flow) => flow.data(fifth).transform(cm.encode, {x: "miles", y: "gas", side: "side"}),
        )
        .transform(cm.plane, {
          x: {label: "Miles driven (per person-year)", grid: true},
          y: {label: "Cost of gasoline ($ per gallon)", grid: true},
        });
      line
        .add(cm.line, {stroke: "currentColor", strokeWidth: 2})
        .add(cm.circle, {r: 3, fill: "white", stroke: "currentColor", strokeWidth: 1.5});
      labels.add(cm.label, {text: "year", position: "side", padding: 6, halo: true, haloWidth: 4});
    },
    {width: 640, height: 480},
  );
});
