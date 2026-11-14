import {color} from "d3-color";
import {bind} from "../../core/transform/bind.js";

const field = (name) => (d) => d[name];

function isColor(value) {
  value = `${value}`.toLowerCase().trim();
  return value === "none" || value === "currentcolor" || color(value) !== null;
}

// A string is a field name, except for a fill or stroke color, which is a constant.
function maybeChannel(key, value) {
  if (typeof value !== "string") return value;
  if ((key === "fill" || key === "stroke") && isColor(value)) return value;
  return field(value);
}

export function encode(flow, data, options = {}) {
  const channels = {};
  for (const key in options) channels[key] = maybeChannel(key, options[key]);
  return bind(flow, data, channels);
}
