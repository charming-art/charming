import {NULL_VALUE} from "./constant.js";
import {normalizeColor} from "../core/color.js";

function encodeColor(color) {
  if (color === NULL_VALUE || color === null) return NULL_VALUE;
  const [r, g, b] = normalizeColor(color);
  return b + (g << 8) + (r << 16);
}

// A cell holds up to two characters. A wide character, such as an emoji or a CJK
// character, fills two columns: the high bits of its code point mark it as wide.
function encodeChar(ch, wide) {
  if (wide) return [ch.codePointAt(0) + 0xf0000000, NULL_VALUE];
  return Array.from(ch)
    .slice(0, 2)
    .map((ch) => ch.codePointAt(0));
}

export function cfb(color) {
  const {ch = " ", fg = "#fff", bg = null, wide = false} = color;
  const [n, n1 = NULL_VALUE] = encodeChar(ch, wide);
  return [n, n1, encodeColor(fg), encodeColor(bg)];
}
