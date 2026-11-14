import * as cm from "../../../../src/index.js";

export function domSetFalsyChildren() {
  return cm.SVG`<svg><g/><text>hello</text></svg>`;
}
