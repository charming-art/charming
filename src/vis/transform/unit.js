import {InternMap, range, sum} from "d3-array";
import {seriesOf, seriesOrder} from "./series.js";

// Turns the rows into one row per unit, such as the squares of a waffle. The rows are grouped by
// the other position, such as the band of x, and by series. The amount of a group is the sum of
// the channel, such as a count in y, else its number of rows; it gets round(|amount| / unit)
// units. Each unit takes the channels of the first row of its group, with the channel set to
// ±unit, the amount it stands for; its datum is the rows of its group.
function unit(data, {unit = 1} = {}, [key, key1, other], name) {
  if (!data) throw new Error(`No channels: call flow.transform(cm.encode, channels) before cm.${name}.`);
  return data.map((context) => {
    const {value, group: rows} = context;
    const V = value[key];
    const O = value[other];
    const {Z, domain} = seriesOf(context);
    // The groups go by the other position, in order of first appearance, then by series.
    const I = range(rows.length);
    const position = O && new InternMap(Array.from(new Set(O), (o, i) => [o, i]));
    const bySeries = Z && seriesOrder(Z, domain);
    I.sort((i, j) => (position ? position.get(O[i]) - position.get(O[j]) : 0) || (bySeries ? bySeries(i, j) : 0));
    const groups = new Map();
    for (const i of I) {
      const k = `${O?.[i]},${Z?.[i]}`;
      if (groups.has(k)) groups.get(k).push(i);
      else groups.set(k, [i]);
    }
    const keys = Object.keys(value).filter((k) => k !== key && k !== key1);
    const newGroup = [];
    const newValue = Object.fromEntries(
      [...keys, key].map((k) => [k, Array.isArray(value[k]) || k === key ? [] : value[k]]),
    );
    for (const g of groups.values()) {
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
    return {...context, I: range(newGroup.length), group: newGroup, value: newValue};
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
