import * as d3 from "d3";
import * as cm from "../../../src/index.js";
import {renderFlow, withSVG} from "../../helpers.js";

// Vega-Lite's dual-axis chart (https://vega.github.io/vega-lite/examples/layer_dual_axis.html):
// Seattle's monthly mean temperatures, as a band from the low to the high, and its monthly mean
// precipitation, as a line. The weather branches into the two layers, which are planed together:
// x is shared, and each layer has its own y, a scale of its own name, with its label and its axis
// on either side.
export const visDualAxis = withSVG(async () => {
  const seattle = await d3.csv("data/seattle-weather.csv", d3.autoType);
  const month = (d) => new Date(Date.UTC(2000, d.date.getUTCMonth()));
  return renderFlow(
    (root) => {
      const [temperature, precipitation] = root
        .data(seattle)
        .branch(
          (flow) =>
            flow
              .transform(cm.encode, {x: month, y: {value: "temp_max", scale: "temperature"}, y1: "temp_min"})
              .transform(cm.groupX, {y: "mean", y1: "mean"}),
          (flow) =>
            flow
              .transform(cm.encode, {x: month, y: {value: "precipitation", scale: "precipitation"}})
              .transform(cm.groupX, {y: "mean"}),
        )
        .transform(cm.plane, {
          x: {label: null, tickFormat: d3.utcFormat("%b")},
          temperature: {label: "Avg. Temperature (°C)"},
          precipitation: {label: "Precipitation (inches)", axis: "right"},
        });
      temperature.add(cm.areaY, {fill: "#85C5A6", fillOpacity: 0.3});
      precipitation.add(cm.lineY, {stroke: "#85A9C5", strokeWidth: 2, curve: "monotone-x"});
    },
    {width: 640, height: 400},
  );
});
