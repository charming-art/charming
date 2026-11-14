import {degrees} from "./create.js";
import {transform} from "./transform.js";

export function svg$rotate(angle) {
  transform(this, `rotate(${degrees(angle)})`);
}
