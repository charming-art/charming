import * as cm from "../../../../src/index.js";

export function domInterpolateNodeChildren() {
  return cm.SVG`<svg>
    <g ${{data: [1, 2, 3]}}>
      ${cm.SVG`<circle ${{r: 10}}/>`}
    </g>
  </svg>`;
}
