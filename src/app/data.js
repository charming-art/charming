import { Data } from "../data/index.js";

export function app$data(data) {
  const newData = new Data(data, this);
  this._data.push(newData);
  return newData;
}
