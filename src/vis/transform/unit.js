import {group, InternMap, range, sum} from "d3-array";
import {seriesOf, seriesOrder, withSeriesOrder} from "./series.js";

// Turns the rows into one row per unit, such as the squares of a waffle. The rows are grouped by
// the other position, such as the band of x, and by series. The amount of a group is the sum of
// the channel, such as a count in y, else its number of rows; it gets round(|amount| / unit)
// units. Each unit takes the channels of the first row of its group, with the channel set to
// ±unit, the amount it stands for; its datum is the rows of its group.
// With order, the series are ordered as given, such as {order: ["Yes", "No"]}, which is recorded as
// their domain, so that colors follow it; else as an earlier transform recorded them.
function unit(data, {unit = 1, order} = {}, [key, key1, other], name) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  // Unlike cm.stackY's, the order is the series as given, not the name of an order.
  if (order !== undefined && !Array.isArray(order)) {
    throw new Error(`cm.${name} orders the series as an array, such as {order: ["a", "b"]}.`);
  }
  return data.map((context) => {
    const {value, group: rows} = context;
    const V = value[key];
    const O = value[other];
    const {key: series, Z, domain: hinted} = seriesOf(context);
    const domain = order ?? hinted;
    // The groups go by the other position, in order of first appearance, then by series. Only the
    // rows of the index are counted, if an earlier transform selected some.
    const I = context.I ? Array.from(context.I) : range(rows.length);
    const position = O && new InternMap();
    if (O) for (const i of I) if (!position.has(O[i])) position.set(O[i], position.size);
    const bySeries = Z && seriesOrder(Z, domain);
    I.sort((i, j) => (position ? position.get(O[i]) - position.get(O[j]) : 0) || (bySeries ? bySeries(i, j) : 0));
    // Grouped with one map per level, so that values are compared as values, not as strings.
    const groups = Array.from(
      group(
        I,
        (i) => O?.[i],
        (i) => Z?.[i],
      ).values(),
      (byZ) => [...byZ.values()],
    ).flat();
    const keys = Object.keys(value).filter((k) => k !== key && k !== key1);
    const newGroup = [];
    const newValue = Object.fromEntries(
      [...keys, key].map((k) => [k, Array.isArray(value[k]) || k === key ? [] : value[k]]),
    );
    for (const g of groups) {
      const amount = V ? sum(g, (i) => V[i]) : g.length;
      const n = Math.round(Math.abs(amount) / unit);
      const v = (amount < 0 ? -1 : 1) * unit;
      const datum = g.map((i) => rows[i]);
      for (let j = 0; j < n; j++) {
        newGroup.push(datum);
        for (const k of keys) if (Array.isArray(value[k])) newValue[k].push(value[k][g[0]]);
        newValue[key].push(v);
      }
    }
    const hints = order && Z ? withSeriesOrder(context.hints ?? {}, series, order) : context.hints;
    return {...context, I: range(newGroup.length), group: newGroup, value: newValue, ...(hints && {hints})};
  });
}

// One row per unit of y, such as the squares of a vertical waffle, from counts in y or rows.
export function unitY(flow, data, options) {
  return unit(data, options, ["y", "y1", "x"], "unitY");
}

// One row per unit of x, such as the squares of a horizontal waffle, from counts in x or rows.
export function unitX(flow, data, options) {
  return unit(data, options, ["x", "x1", "y"], "unitX");
}
