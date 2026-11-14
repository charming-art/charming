import {spread} from "./spread.js";

// Bands for the categories of y, such as the bars of a horizontal bar chart.
export function spreadY(flow, data, options) {
  return spread(data, options, ["y", "y1", "x", "x1"], "spreadY");
}
