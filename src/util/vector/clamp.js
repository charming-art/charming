import {memberize} from "./memberize.js";
import {staticize} from "./staticize.js";

function clamp(out, a, m, m1) {
  const [min, max] = arguments.length === 3 ? [0, m] : [m, m1];
  const m0 = out.set(a).mag();
  if (m0 < min) out.mag(min);
  if (m0 > max) out.mag(max);
}

export const vec$clamp = memberize(clamp);

export const vecClamp = staticize(clamp);
