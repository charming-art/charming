import * as cm from "../../../../src/index.js";

export function domSetAttributes() {
  return cm.SVG`<svg ${{
    width: 100,
    height: 200,
  }}/>`;
}
