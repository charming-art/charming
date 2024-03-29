import { context2d } from "../context.js";
import { Backend } from "../backend/index.js";
import { measureText } from "../measure.js";

export const TERMINAL_CLASS = "charming-terminal";

function dimensionOf(count, pixel, unit) {
  if (count === undefined) return (pixel / unit) | 0;
  return count;
}

// Default options from: https://github.com/xtermjs/xterm.js/blob/ac0207bf2e8a923d0cff95cc383f6f3e36a2e923/src/common/services/OptionsService.ts#LL12C1-L12C1
export function terminal$init({
  width,
  height,
  cols: _cols,
  rows: _rows,
  mode = "single",
  fontFamily = "courier-new, courier, monospace",
  fontSize = 15,
  fontWeight = "normal",
} = {}) {
  const { width: tw, height: th } = measureText("W", {
    fontSize,
    fontFamily,
    fontWeight,
  });
  const cellWidth = mode === "double" ? tw * 2 : tw;
  const cellHeight = th;
  const cols = _cols ?? undefined;
  const rows = _rows ?? undefined;
  const computedCols = dimensionOf(cols, width, cellWidth);
  const computedRows = dimensionOf(rows, height, cellHeight);
  const computedWidth = computedCols * cellWidth;
  const computedHeight = computedRows * cellHeight;
  const context = context2d(computedWidth, computedHeight);
  const buffer = Array.from({ length: computedCols * computedRows }, () => null);
  context.canvas.classList.add(TERMINAL_CLASS);
  const backend = Backend.new(computedCols, computedRows);
  Object.assign(this._props, {
    mode,
    cellWidth,
    cellHeight,
    fontSize,
    fontFamily,
    fontWeight,
    width: computedCols,
    height: computedRows,
    pixelWidth: computedWidth,
    pixelHeight: computedHeight,
  });
  Object.assign(this, {
    _buffer: buffer,
    _context: context,
    _backend: backend,
  });
  this.clear({ fill: "#000" });
  return this;
}
