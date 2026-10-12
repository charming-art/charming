import {prepareWithSegments} from "@chenglou/pretext";
import {cssFont} from "../canvas/cssFont.js";

/**
 * Builds the CSS `font` string for Pretext measurement (same order as the `font` shorthand).
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
 */
export function prepare(
  text,
  {
    fontSize = 16,
    fontFamily = "Inter",
    fontStyle = "normal",
    fontVariant = "normal",
    fontWeight = "normal",
    ...rest
  } = {},
) {
  const font = cssFont({fontSize, fontFamily, fontStyle, fontVariant, fontWeight});
  const prepared = prepareWithSegments(text, font, rest);
  prepared.fontSize = fontSize;
  prepared.fontFamily = fontFamily;
  prepared.fontStyle = fontStyle;
  prepared.fontVariant = fontVariant;
  prepared.fontWeight = fontWeight;
  return prepared;
}
