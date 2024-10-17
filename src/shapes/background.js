import {shape} from "./shape.js";

export const background = shape((renderer, I, value) => renderer.background(I, value));
