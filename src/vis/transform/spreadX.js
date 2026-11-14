import {spread} from "./spread.js";

// Bands for the categories of x, such as the columns of a bar chart.
export function spreadX(flow, data, options) {
  return spread(data, options, ["x", "x1", "y", "y1"], "spreadX");
}
