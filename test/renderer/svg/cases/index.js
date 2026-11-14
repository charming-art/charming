import * as shapes from "../../../core/shape/cases/index.js";
import {withSVG} from "../../../helpers.js";

// Each shape case, such as shapeCircleColors, rendered with cm.svg as svgCircleColors.
export const cases = Object.fromEntries(
  Object.entries(shapes).map(([name, render]) => [name.replace(/^shape/, "svg"), withSVG(render)]),
);
