function px(n) {
  return typeof n === "number" ? `${n}px` : n;
}

export function cssFont({
  fontStyle = "normal",
  fontVariant = "normal",
  fontWeight = "normal",
  fontSize = 10,
  fontFamily = "sans-serif",
} = {}) {
  return `${fontStyle} ${fontVariant} ${fontWeight} ${px(fontSize)} ${fontFamily}`.replace(/\s+/g, " ").trim();
}
