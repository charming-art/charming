import {bind} from "../../core/transform/bind.js";
import {isColor} from "../color.js";
import {scaledKeys} from "./scales.js";

const field = (name) => (d) => d[name];

const colorKeys = ["fill", "stroke"];

// A channel can be a descriptor that names the scale it uses, such as {value: "v2", scale: "y"}.
// The options of scales, such as their domains, are given to cm.plane and cm.polar by name, and
// the orders of categories to the transforms that need them, such as cm.spreadX's domain.
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
    const {value, scale} = isDescriptor(option) ? option : {value: option};
    const descriptor = scale === undefined ? {} : {scale};
    const channel = (channels[key] = maybeChannel(key, value));
    // The scale of a channel is resolved later, by cm.plane. A field names the channel, which
    // labels its axis. A color, radius or opacity is scaled only if it varies with the data, so a
    // constant such as "red" or 3 stays as it is.
    const label = typeof value === "string" && typeof channel === "function" ? {label: value} : null;
    if (isDescriptor(option)) hints[key] = {...label, ...descriptor};
    else if (label) hints[key] = label;
    else if (scaledKeys.includes(key) && (typeof channel === "function" || Array.isArray(channel))) hints[key] = {};
  }
  // The hints of the channels encoded again are replaced, and the others are kept.
  return bind(flow, data, channels).map((context) => {
    const kept = Object.entries(context.hints ?? {}).filter(([key]) => !(key in options));
    return {...context, hints: {...Object.fromEntries(kept), ...hints}};
  });
}
