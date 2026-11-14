import {transform} from "./transform.js";

export function svg$translate(x, y) {
  transform(this, `translate(${x},${y})`);
}
