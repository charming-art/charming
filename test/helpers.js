import assert from "node:assert";
import * as cm from "../src/index.js";

export function renderPretext({
  texts,
  lines,
  width = 400,
  height = 400,
  fontSize = 16,
  fontFamily = "Inter",
  fontStyle = "normal",
  fontVariant = "normal",
  fontWeight = "normal",
  path,
}) {
  return cm.svg`<svg ${{
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    overflow: "visible",
  }}>
    <path ${{
      d: path,
      fill: "none",
      stroke: "black",
      stroke_width: 1,
    }}/>
    <line ${{
      data: lines,
      x1: (line) => line[0][0],
      y1: (line) => line[0][1],
      x2: (line) => line[1][0],
      y2: (line) => line[1][1],
      stroke: "black",
      stroke_width: 1,
    }}/>
    <text ${{
      data: texts,
      text_anchor: "middle",
      dominant_baseline: "central",
      font_size: `${fontSize}px`,
      font_family: fontFamily,
      font_style: fontStyle,
      font_variant: fontVariant,
      font_weight: fontWeight,
      transform: (text) => `translate(${text.x}, ${text.y}) rotate(${text.angle})`,
      textContent: (text) => text.text,
    }}/>
  </svg>`;
}

export function renderFlow(draw, {width = 200, height = 200} = {}) {
  const renderer = cm.canvas({width, height, dpi: 1});
  const root = cm.flow().renderer(renderer);
  draw(root, width, height);
  root.render();
  return renderer.node();
}

// A composite shape that records the evaluated channel values it receives at render time.
export function probe() {
  const calls = [];
  const shape = (flow, value) => calls.push(value);
  return [shape, calls];
}

export function assertInDelta(actual, expected, delta = 1e-6) {
  assert.ok(Math.abs(actual - expected) < delta, `${actual} should be within ${delta} of ${expected}`);
}
