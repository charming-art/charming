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

// Options whose strings are literal, the style of a shape rather than its data, such as the
// alignment or the font of a text, the curve of a line or the position of a label, and options
// whose values are functions themselves, such as a format or an easing.
const literals = new Set([
  "anchor",
  "contrast",
  "curve",
  "d",
  "ease",
  "fontFamily",
  "fontStyle",
  "fontWeight",
  "format",
  "paintOrder",
  "position",
  "strokeCap",
  "strokeJoin",
  "textAlign",
  "textBaseline",
  "transformOrigin",
]);

// The stages of transitions, whose states are options of their own, such as enter: {fill: "red"}.
const stages = new Set(["appear", "enter", "exit"]);

// Whether a string option names a field of the data, like a channel of cm.encode: an option of a
// channel, such as text or x, rather than of style, and other than a color for fill or stroke.
export function isField(key, value) {
  if (typeof value !== "string" || literals.has(key)) return false;
  return !(colorKeys.includes(key) && isColor(value));
}

// The options of the shapes added to an encoded flow, with the strings of their channels as
// accessors of the fields of the datum, like cm.encode, unless they name a bound channel, which
// the shape reads, such as {y: "v2"}; also in the states of transitions, such as enter: {text:
// "name"}.
function fieldOptions(options, channels = {}) {
  const resolve = (key, value) =>
    isField(key, value) && !Object.hasOwn(channels, value) ? (d) => d.datum?.[value] : value;
  const resolved = {};
  for (const [key, value] of Object.entries(options)) {
    const state = stages.has(key) && value !== null && typeof value === "object" && !Array.isArray(value);
    resolved[key] = state
      ? Object.fromEntries(Object.entries(value).map(([name, v]) => [name, resolve(name, v)]))
      : resolve(key, value);
  }
  return resolved;
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
  // The hints of the channels encoded again are replaced, and the others are kept. The shapes added
  // to an encoded flow read the strings of their channels as fields, like cm.encode.
  return bind(flow, data, channels).map((context) => {
    const kept = Object.entries(context.hints ?? {}).filter(([key]) => !(key in options));
    return {...context, hints: {...Object.fromEntries(kept), ...hints}, resolve: fieldOptions};
  });
}
