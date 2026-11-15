import {bind} from "../../core/transform/bind.js";
import {isColor} from "../color.js";

const field = (name) => (d) => d[name];

const colorKeys = ["fill", "stroke"];

// A channel can be a descriptor such as {value: "genre", type: "ordinal"}: the type, domain and
// range of its scale, and with scale, the name of a scale it shares, such as {value: "v2", scale: "y"}.
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
    // The scale of a channel is resolved later, by cm.plane. A field names the channel, which
    // labels its axis. A color is scaled only if it varies with the data, so a constant color
    // such as "red" stays as it is.
    const label = typeof value === "string" && typeof channel === "function" ? {label: value} : null;
    if (isDescriptor(option)) hints[key] = {...label, ...descriptor};
    else if (label) hints[key] = label;
    else if (colorKeys.includes(key) && (typeof channel === "function" || Array.isArray(channel))) hints[key] = {};
  }
  // The hints of the channels encoded again are replaced, and the others are kept.
  return bind(flow, data, channels).map((context) => {
    const kept = Object.entries(context.hints ?? {}).filter(([key]) => !(key in options));
    return {...context, hints: {...Object.fromEntries(kept), ...hints}};
  });
}
