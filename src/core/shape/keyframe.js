import {define} from "./define.js";

// A moment of an animation: like cm.g, each row holds what's appended to it, but the rows of
// sibling keyframes are drawn one after another, in time, rather than all at once. Its options
// duration, delay and ease time the transition into each moment.
export const keyframe = define(() => {});

keyframe.keyframe = true;
