import * as cm from "../../../../src/index.js";

export function domFragmentRoot() {
  return cm.SVG`<circle ${{
    data: [1, 2, 3],
    cx: (d) => d * 20,
    cy: 50,
    r: 10,
  }}/>`;
}
