import {continuous} from "./continuous.js";

function transform(x) {
  return x;
}

export function linear(domain, range, options) {
  return continuous(domain, range, {...options, transform});
}
