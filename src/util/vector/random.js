import {memberize} from "./memberize.js";
import {staticize} from "./staticize.js";
import {vecFromAngle} from "./fromAngle.js";

function random(out) {
  out.set(vecFromAngle(Math.random() * 2 * Math.PI));
}

export const vec$random = memberize(random);

export const vecRandom = staticize(random);
