import {continuous} from "./continuous.js";

function transform(x) {
  return Math.sign(x) * Math.sqrt(Math.abs(x));
}

export function sqrt(domain, range, options = {}) {
  return continuous(domain, range, {...options, transform});
}
