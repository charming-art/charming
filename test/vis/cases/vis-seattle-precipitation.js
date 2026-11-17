import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Like Plot's Seattle temperature heatmap, but of precipitation: the mean daily precipitation of
// each day of the year, over four years, as the opacity of one blue. The opacity scale maps the
// means from 0 to [0, 1], so that dry days fade out.
export const visSeattlePrecipitation = withSVG(async () => {
  const seattle = await d3.csv("data/seattle-weather.csv", d3.autoType);
  return renderFlow(
    (root) => {
      root
        .data(seattle)
        .transform(cm.encode, {
          x: (d) => d.date.getUTCDate(),
          y: (d) => d.date.getUTCMonth(),
          fillOpacity: "precipitation",
        })
        .transform(cm.group, {fillOpacity: "mean"})
        .transform(cm.spreadX, {padding: 0})
        .transform(cm.spreadY, {padding: 0})
        .transform(cm.plane, {y: {tickFormat: (d) => months[d]}})
        .add(cm.rect, cm.inset(0.5, {fill: "steelblue"}));
    },
    {width: 640, height: 300},
  );
});
