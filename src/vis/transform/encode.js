import {bind} from "../../core/transform/bind.js";
import {isColor} from "../color.js";

const field = (name) => (d) => d[name];

const colorKeys = ["fill", "stroke"];

// A channel can be a descriptor such as {value: "genre", scale: "ordinal"}.
function isDescriptor(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && "value" in value;
}

// A string is a field name, except for a fill or stroke color, which is a constant.
function maybeChannel(key, value) {
  if (typeof value !== "string") return value;
  if (colorKeys.includes(key) && isColor(value)) return value;
  return field(value);
}

export function encode(flow, data, options = {}) {
  const channels = {};
  const hints = {};
  for (const key in options) {
    const option = options[key];
    const {value, ...descriptor} = isDescriptor(option) ? option : {value: option};
    const channel = (channels[key] = maybeChannel(key, value));
    // The scale of a channel is resolved later, by cm.plane. A color is scaled only if it
    // varies with the data, so a constant color such as "red" stays as it is.
    if (isDescriptor(option)) hints[key] = descriptor;
    else if (colorKeys.includes(key) && (typeof channel === "function" || Array.isArray(channel))) hints[key] = {};
  }
  return bind(flow, data, channels).map((context) => ({...context, hints: {...context.hints, ...hints}}));
}
