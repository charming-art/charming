// A position option read like .add reads it: a function of the row, an array of values by row, the
// name of a bound channel, a field of the datum of a row of an encoded flow, or a constant; without
// one, the bound channel of the position itself.
function positionOf(option, key) {
  if (option === undefined) return (d) => d[key];
  if (typeof option === "function") return option;
  if (Array.isArray(option)) return (d, i) => option[i];
  if (typeof option === "string") {
    return (d) => (Object.hasOwn(d, option) ? d[option] : Object.hasOwn(d, "datum") ? d.datum?.[option] : option);
  }
  return () => option;
}

// The inset of a side for a box of the given size: k pixels, or a percentage of the size, like CSS.
function amountOf(k) {
  if (typeof k === "string" && k.trim().endsWith("%")) {
    const p = parseFloat(k) / 100;
    return (size) => p * size;
  }
  return () => +k;
}

// The options of the pair of positions key and key1, such as x and x1, with each side moved toward
// the other by the inset. Positions given in the options are read first, so that the inset applies
// to them. Sides may be in either order; a box thinner than the inset collapses to its middle.
function insetPair(options, [key, key1], amount) {
  const get = positionOf(options[key], key);
  const get1 = positionOf(options[key1], key1);
  const ends = (d, i, data) => {
    const v = get(d, i, data);
    const v1 = get1(d, i, data);
    const size = Math.abs(v1 - v);
    const a = Math.sign(v1 - v) * Math.min(amount(size), size / 2);
    return [v + a, v1 - a];
  };
  return {[key]: (d, i, data) => ends(d, i, data)[0], [key1]: (d, i, data) => ends(d, i, data)[1]};
}

// Shrinks the box of a mark by k on each side, k pixels or a percentage of the box, such as the
// gaps between the cells of a heatmap with cm.rect, or the dots of a unit chart with cm.circle,
// which fits its box. It returns the options of .add with the positions x, x1, y and y1 inset: the
// positions in the options apply first, and the other options pass through. Like Plot's inset.
export function inset(k, options = {}) {
  const amount = amountOf(k);
  return {...options, ...insetPair(options, ["x", "x1"], amount), ...insetPair(options, ["y", "y1"], amount)};
}

// Shrinks the box of a mark by k on its left and right only, such as the bars of a histogram.
export function insetX(k, options = {}) {
  return {...options, ...insetPair(options, ["x", "x1"], amountOf(k))};
}

// Shrinks the box of a mark by k on its top and bottom only, such as the bars of a horizontal
// histogram.
export function insetY(k, options = {}) {
  return {...options, ...insetPair(options, ["y", "y1"], amountOf(k))};
}
