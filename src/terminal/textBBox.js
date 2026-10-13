import figlet from "figlet";
const {textSync} = figlet;
import {fontOf} from "./font.js";

export function bboxOf(matrix, {x, y, textAlign, textBaseline}) {
  const lines = matrix.split("\n");
  const height = lines.length;
  const width = Math.max(...lines.map((l) => Array.from(l).length));
  const startX = textAlign === "end" ? x - width : textAlign === "center" ? x - width / 2 : x;
  const startY = textBaseline === "bottom" ? y - height : textBaseline === "middle" ? y - height / 2 : y;
  return {lines, x: startX, y: startY, width, height};
}

// Returns the lines of text to draw: the text itself, or its figlet banner.
export function textOf(text, {figlet = false, fontFamily = "standard"} = {}) {
  if (figlet) return textSync(text + "", {font: fontOf(fontFamily)});
  return text + "";
}

export function terminal$textBBox({
  text,
  figlet = false,
  fontFamily = "standard",
  textAlign = "start",
  textBaseline = "top",
  x = 0,
  y = 0,
} = {}) {
  const matrix = textOf(text, {figlet, fontFamily});
  const bbox = bboxOf(matrix, {textAlign, textBaseline, x, y});
  return {x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height};
}
