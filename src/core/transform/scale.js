import {linear} from "../scale/linear.js";

function extentQ(array) {
  return [Math.min(...array), Math.max(...array)];
}

function extentO(array) {
  return Array.from(new Set(array));
}

function extent(scale, array) {
  return scale.ordinal ? extentO(array) : extentQ(array);
}

function applyScale(value, options) {
  return Object.fromEntries(
    Object.entries(value).map(([key, V]) => {
      const {[key]: descriptor} = options;
      if (!descriptor) return [key, V];
      const {range, scale = linear, domain = extent(scale, V), ...rest} = descriptor;
      const map = scale(domain, range, rest);
      const scaled = V.map(map);
      return [key, scaled];
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
