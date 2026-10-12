import {bboxOf, textOf} from "./textBBox.js";

// A function fill is called for each character with its column and row, and the size of the text.
function normalizeColor(color, width, height) {
  if (typeof color === "function") return (x, y) => color(x, y, width, height);
  return () => color;
}

export function terminal$text({x, y, text, fill, textAlign = "start", textBaseline = "top", fontFamily = "standard"}) {
  const matrix = textOf(text, fontFamily);
  const {
    x: startX,
    y: startY,
    width: textWidth,
    height: textHeight,
    lines,
  } = bboxOf(matrix, {
    x,
    y,
    textAlign,
    textBaseline,
  });
  fill = normalizeColor(fill, textWidth, textHeight);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      this.point({
        x: startX + j,
        y: startY + i,
        stroke: {ch, fg: fill(j, i)},
      });
    }
  }
}
