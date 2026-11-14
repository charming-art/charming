import * as cm from "../../../../src/index.js";

export function domSetFunctionAttributesWithNode() {
  return cm.SVG`<svg ${{
    width: (node) => node.clientWidth,
    height: (node) => node.clientHeight,
  }}/>`;
}
