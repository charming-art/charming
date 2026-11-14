import * as cm from "../../../../src/index.js";

export function domInterpolateChildren() {
  return cm.SVG`<svg>
    ${["hello", null, false, 1, {text: "world"}]}
  </svg>`;
}
