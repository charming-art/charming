import {max, min} from "d3-array";

function linear([d, d1], [r, r1] = [0, 1]) {
  return (x) => {
    const t = d === d1 ? 0.5 : (x - d) / (d1 - d);
    return r * (1 - t) + t * r1;
  };
}

function ordinal(domain, range) {
  const index = new Map(domain.map((d, i) => [d, i]));
  return (x) => range[index.get(x) % range.length];
}

export function point(domain, range) {
  const index = new Map(domain.map((d, i) => [d, i]));
  const map = linear([0, domain.length - 1], range);
  return (x) => map(index.get(x));
}

function discrete(scale, V) {
  if (scale === "ordinal") return true;
  if (scale === "linear") return false;
  if (scale) return typeof scale.ticks !== "function";
  const v = V.find((v) => v != null);
  return typeof v !== "number" && !(v instanceof Date);
}

function scaleOf({scale, domain, range}, V, ordinalOf) {
  const o = discrete(scale, V);
  if (domain === undefined) domain = o ? Array.from(new Set(V)) : [min(V), max(V)];
  if (typeof scale === "function") {
    const s = scale.copy().domain(domain);
    return range === undefined ? s : s.range(range);
  }
  return o ? ordinalOf(domain, range) : linear(domain, range);
}

function applyScale(value, options, ordinalOf) {
  return Object.fromEntries(
    Object.entries(value).map(([key, V]) => {
      const {[key]: descriptor} = options;
      if (!descriptor) return [key, V];
      return [key, V.map(scaleOf(descriptor, V, ordinalOf))];
    }),
  );
}

export function scale(_, data, options, ordinalOf = ordinal) {
  if (!data) throw new Error("No channels: call flow.transform(cm.bind, channels) before cm.scale.");
  const m = data.length;
  const newData = new Array(m);
  for (let j = 0; j < m; j++) {
    const context = data[j];
    newData[j] = {...context, value: applyScale(context.value, options, ordinalOf)};
  }
  return newData;
}
