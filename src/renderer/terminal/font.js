import figlet from "figlet";
import standard from "figlet/importable-fonts/Standard.js";
import ghost from "figlet/importable-fonts/Ghost.js";

const fonts = {standard, ghost};
const parsed = new Set();

// Returns the name of a figlet font, parsing a built-in font the first time it is used.
export function fontOf(name) {
  if (!parsed.has(name) && name in fonts) {
    figlet.parseFont(name, fonts[name]);
    parsed.add(name);
  }
  return name;
}
