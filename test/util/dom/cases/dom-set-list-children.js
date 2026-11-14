import * as cm from "../../../../src/index.js";

export function domSetListChildren() {
  return cm.SVG`<svg ${{
    width: 100,
    height: 100,
  }}>
    ${[1, 2, 3].map((d) => cm.SVG`<circle ${{r: d}}/>`)}
  </svg>`;
}
