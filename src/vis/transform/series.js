import {ascending, InternMap, InternSet} from "d3-array";

// Like Plot, the series of a row is its z, else its fill, else its stroke. Its domain, if any,
// comes from the hint of that channel, such as the order of an earlier stack or unit transform.
export function seriesOf({value, hints = {}}) {
  const key = ["z", "fill", "stroke"].find((key) => key in value);
  return key === undefined ? {} : {key, Z: value[key], domain: hints[key]?.domain};
}

// The hints with the order of the series as the domain of its channel, so that later transforms,
// and the colors of cm.plane, follow it without repeating it.
export function withSeriesOrder(hints, key, order) {
  return key === undefined ? hints : {...hints, [key]: {...hints[key], domain: order}};
}

// Compares rows by the order of their series in the domain, by default the order of first appearance.
export function seriesOrder(Z, domain = Array.from(new InternSet(Z))) {
  const index = new InternMap(domain.map((d, i) => [d, i]));
  return (i, j) => ascending(index.get(Z[i]), index.get(Z[j]));
}
