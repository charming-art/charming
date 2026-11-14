import {color} from "d3-color";

export function isColor(value) {
  value = `${value}`.toLowerCase().trim();
  return value === "none" || value === "currentcolor" || color(value) !== null;
}
