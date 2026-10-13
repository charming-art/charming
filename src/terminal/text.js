import {bboxOf, textOf} from "./textBBox.js";

// A function fill is called for each character with its column and row, and the size of the text.
function normalizeColor(color, width, height) {
  if (typeof color === "function") return (x, y) => color(x, y, width, height);
  return () => color;
}

function drawText(renderer, matrix, {x, y, fill, textAlign = "start", textBaseline = "top"}) {
  const {x: startX, y: startY, width, height, lines} = bboxOf(matrix, {x, y, textAlign, textBaseline});
  const fillOf = normalizeColor(fill, width, height);
  for (let i = 0; i < lines.length; i++) {
    const chars = Array.from(lines[i]);
    for (let j = 0; j < chars.length; j++) {
      renderer.point({x: startX + j, y: startY + i, stroke: {ch: chars[j], fg: fillOf(j, i)}});
    }
  }
}

export function terminal$text({text, ...options}) {
  drawText(this, textOf(text), options);
}

export function terminal$figlet({text, fontFamily, ...options}) {
  drawText(this, textOf(text, {figlet: true, fontFamily}), options);
}
