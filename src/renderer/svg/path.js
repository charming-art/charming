import {append, degrees, paint} from "./create.js";

// Serializes path commands such as [["M", 0, 0], ["L", 10, 10]]. Arc rotations are
// in radians, as for Canvas, and SVG expects degrees and flags as 0 or 1.
function pathString(d) {
  return d
    .map(([c, ...args]) => {
      if (/^a$/i.test(c)) {
        args[2] = degrees(args[2]);
        args[3] = +args[3];
        args[4] = +args[4];
      }
      return c + args.join(",");
    })
    .join("");
}

export function svg$path({x = 0, y = 0, d, fill, stroke, strokeCap, strokeJoin, ...options}) {
  if (typeof d !== "string" && !Array.isArray(d)) return this;
  append(this, "path", {
    d: typeof d === "string" ? d : pathString(d),
    transform: x || y ? `translate(${x},${y})` : null,
    "stroke-linecap": strokeCap,
    "stroke-linejoin": strokeJoin,
    // Like Canvas, a path is only filled or stroked if a fill or stroke is given.
    ...paint({fill: fill || "none", stroke, ...options}),
  });
  return this;
}
