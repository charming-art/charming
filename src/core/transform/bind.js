import {valueOf} from "../flow/append.js";

export function bind(flow, data, options) {
  const groups = flow._groups;
  const m = groups.length;
  const newData = new Array(m);
  for (let j = 0; j < m; j++) {
    const group = groups[j];
    const value = valueOf(group, options);
    newData[j] = data ? {...data[j], value: {...data[j].value, ...value}} : {I: group.map((_, i) => i), value, group};
  }
  return newData;
}
