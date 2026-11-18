// The widths of characters in hundredths of an em, measured at 10px system-ui, from Plot's
// defaultWidthMap (https://github.com/observablehq/plot, ISC License). Other characters are as wide
// as an e, and pictographs, such as emojis, 1.2em.
// prettier-ignore
const widths = {
  a: 56, b: 63, c: 57, d: 63, e: 58, f: 37, g: 62, h: 60, i: 26, j: 26, k: 55, l: 26, m: 88,
  n: 60, o: 60, p: 62, q: 62, r: 39, s: 54, t: 38, u: 60, v: 55, w: 79, x: 54, y: 55, z: 55,
  A: 69, B: 67, C: 73, D: 74, E: 61, F: 58, G: 76, H: 75, I: 28, J: 55, K: 67, L: 58, M: 89,
  N: 75, O: 78, P: 65, Q: 78, R: 67, S: 65, T: 65, U: 75, V: 69, W: 98, X: 69, Y: 67, Z: 67,
  0: 64, 1: 48, 2: 62, 3: 64, 4: 66, 5: 63, 6: 65, 7: 58, 8: 65, 9: 65,
  " ": 29, "!": 32, '"': 49, "'": 31, "(": 39, ")": 39, ",": 31, "-": 48, ".": 31, "/": 32,
  ":": 31, ";": 31, "?": 52, "\u2018": 31, "\u2019": 31, "\u201c": 47, "\u201d": 47, "\u2026": 82,
};

const pictographic = /\p{Extended_Pictographic}/u;

// The width of a text at a font size, estimated like Plot's from the widths of its characters, so
// that it's the same in every environment, such as for the margins of axes and the box of a text.
export function textWidth(value, fontSize) {
  let sum = 0;
  for (const c of `${value}`) sum += widths[c] ?? (pictographic.test(c) ? 120 : widths.e);
  return (sum * fontSize) / 100;
}
