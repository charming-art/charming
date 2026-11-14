import {fit} from "../../core/transform/fit.js";

// Fits positions to the renderer like cm.fit, with y up and the default margins of a chart.
export function plane(
  flow,
  data,
  {
    reverseY = true,
    margin,
    marginTop = margin ?? 20,
    marginRight = margin ?? 20,
    marginBottom = margin ?? 30,
    marginLeft = margin ?? 40,
    ...options
  } = {},
) {
  return fit(flow, data, {reverseY, marginTop, marginRight, marginBottom, marginLeft, ...options});
}
