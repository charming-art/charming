import {attribute} from "./attribute.js";

export function encode(options) {
  return ({data = [0], ...rest}) => {
    debugger
    const columns = {};
    const I = Array.from({length: data.length}, (_, i) => i);
    for (const [key, value] of Object.entries(options)) {
      columns[key] = I.map((i) => attribute(value, i, data));
    }
    return {data, ...rest, ...columns, I};
  };
}
