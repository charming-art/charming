import {ascending, greatest, groupSort, InternMap, InternSet, range, rollup, sum} from "d3-array";

// Like Plot, the series of a row is its z, else its fill, else its stroke. Its domain, if any,
// comes from the hint of that channel, such as the order of an earlier stack or unit transform.
export function seriesOf({value, hints = {}}) {
  const key = ["z", "fill", "stroke"].find((key) => key in value);
  return key === undefined ? {} : {key, Z: value[key], domain: hints[key]?.domain};
}

// The hints with the order of the series as the domain of its channel, so that later transforms,
// and the colors of cm.plane, follow it without repeating it. A fill or stroke without a hint is a
// constant color, such as "steelblue", which isn't scaled, so it isn't given one.
export function withSeriesOrder(hints, key, order) {
  if (key === undefined || (key !== "z" && !(key in hints))) return hints;
  return {...hints, [key]: {...hints[key], domain: order}};
}

// Compares rows by the order of their series in the domain, by default the order of first appearance.
export function seriesOrder(Z, domain = Array.from(new InternSet(Z))) {
  const index = new InternMap(domain.map((d, i) => [d, i]));
  return (i, j) => ascending(index.get(Z[i]), index.get(Z[j]));
}

// Like Plot, missing values, such as null or NaN, are ordered last either way.
function defined(d) {
  return d != null && d >= d;
}

function ascendingDefined(a, b) {
  return !defined(a) - !defined(b) || (a < b ? -1 : a > b ? 1 : 0);
}

function descendingDefined(a, b) {
  return !defined(a) - !defined(b) || (a < b ? 1 : a > b ? -1 : 0);
}

// The orders of Plot's stack transform (ISC license), for cm.stackX, cm.stackY, cm.unitX and
// cm.unitY: by value within each group, or a series order shared by all groups, by sum,
// appearance, inside-out or as given. A "-" prefix descends, and names are case-insensitive, as in
// Plot.
export function orderOf(order, V, O, Z, value) {
  if (order == null) return null;
  if (Array.isArray(order)) return orderSeries(ascendingDefined, Z, () => order);
  const raw = `${order}`;
  order = raw.toLowerCase();
  const descend = order.startsWith("-");
  const compare = descend ? descendingDefined : ascendingDefined;
  const I = range(V.length);
  const X = O ?? I;
  const appearance = () =>
    groupSort(
      I,
      (G) => X[greatest(G, (i) => V[i])],
      (i) => Z[i],
    );
  switch (descend ? order.slice(1) : order) {
    case "value":
      return (i, j) => compare(V[i], V[j]);
    case "z":
      return (i, j) => compare(Z[i], Z[j]);
    case "sum":
      return orderSeries(compare, Z, () =>
        groupSort(
          I,
          (G) => sum(G, (i) => V[i]),
          (i) => Z[i],
        ),
      );
    case "appearance":
      return orderSeries(compare, Z, appearance);
    case "inside-out":
      return orderSeries(compare, Z, () => {
        const sums = rollup(
          I,
          (G) => sum(G, (i) => V[i]),
          (i) => Z[i],
        );
        const Kp = [];
        const Kn = [];
        let s = 0;
        for (const k of appearance()) {
          if (s < 0) ((s += sums.get(k)), Kp.push(k));
          else ((s -= sums.get(k)), Kn.push(k));
        }
        return Kn.reverse().concat(Kp);
      });
  }
  // Like a field in Plot, any other name of a bound channel orders the rows by it, such as
  // {order: "fill"}; Plot's names, above, come first.
  const name = raw.replace(/^-/, "");
  if (Object.hasOwn(value, name)) {
    const C = value[name];
    return (i, j) => compare(C[i], C[j]);
  }
  return null;
}

// A series order shared by all groups, from a domain of the series.
function orderSeries(compare, Z, domain) {
  if (!Z) return null;
  const index = new InternMap(domain().map((d, i) => [d, i]));
  return (i, j) => compare(index.get(Z[i]), index.get(Z[j]));
}
