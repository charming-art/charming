import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Plot's Seattle temperature heatmap (https://observablehq.com/@observablehq/plot-seattle-temperature-heatmap):
// the highest daily maximum of each day of the year, over four years, grouped on x and y. Like
// Plot's padding 0 and inset 0.5, the bands touch and the cells are inset by 0.5px.
export const visSeattleHeatmap = withSVG(async () => {
  const seattle = await d3.csv("data/seattle-weather.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(seattle)
        .transform(cm.encode, {
          x: (d) => d.date.getUTCDate(),
          y: (d) => d.date.getUTCMonth(),
          fill: "temp_max",
        })
        .transform(cm.group, {fill: "max"})
        .transform(cm.spreadX, {padding: 0})
        .transform(cm.spreadY, {padding: 0})
        .transform(cm.plane, {y: {tickFormat: (d) => months[d]}})
        .add(cm.rect, cm.inset(0.5));
    },
    {width: 640, height: 300},
  );
});
