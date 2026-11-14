function linear([d, d1], [r, r1] = [0, 1], interpolate = (t) => r * (1 - t) + t * r1) {
  return (x) => interpolate(d === d1 ? 0.5 : (x - d) / (d1 - d));
}

function ordinal(domain, range) {
  const index = new Map(domain.map((d, i) => [d, i]));
  return (x) => range[index.get(x) % range.length];
}

function discrete(scale, V) {
  if (scale === "ordinal") return true;
  if (scale === "linear") return false;
  if (scale) return typeof scale.ticks !== "function";
  return typeof V.find((v) => v != null) !== "number";
}

function scaleOf({scale, domain, range, interpolate}, V) {
  const o = discrete(scale, V);
  if (domain === undefined) domain = o ? Array.from(new Set(V)) : [Math.min(...V), Math.max(...V)];
  if (typeof scale === "function") {
    const s = scale.copy().domain(domain);
    return range === undefined ? s : s.range(range);
  }
  return o ? ordinal(domain, range) : linear(domain, range, interpolate);
}

function applyScale(value, options) {
  return Object.fromEntries(
    Object.entries(value).map(([key, V]) => {
      const {[key]: descriptor} = options;
      if (!descriptor) return [key, V];
      return [key, V.map(scaleOf(descriptor, V))];
    }),
  );
}

export function scale(_, data, options) {
  if (!data) throw new Error("No channels: call flow.transform(cm.bind, channels) before cm.scale.");
  const m = data.length;
  const newData = new Array(m);
  for (let j = 0; j < m; j++) {
    const context = data[j];
    newData[j] = {...context, value: applyScale(context.value, options)};
  }
  return newData;
}
