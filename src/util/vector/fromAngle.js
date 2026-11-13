import {Vec} from "./vec.js";

export function vecFromAngle(angle) {
  return new Vec(Math.cos(angle), Math.sin(angle));
}
