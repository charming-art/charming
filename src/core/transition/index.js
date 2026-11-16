import {diff} from "./diff.js";

const defaults = {delay: 0, duration: 750, ease: "cubic-in-out"};

// The options of transitions, from the transition option of a flow: true for the defaults, or an
// object of defaults such as {duration: 500}; off if false or not given.
export function transitionOptions(transition) {
  if (!transition) return null;
  return {...defaults, ...(transition === true ? {} : transition)};
}

function schedule(f) {
  return typeof requestAnimationFrame === "function" ? requestAnimationFrame(f) : setTimeout(f, 16);
}

function unschedule(id) {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
  else clearTimeout(id);
}

// Animates from what the renderer shows to the primitives drawn by a render: matched primitives
// update, and the others enter, exit, split or merge. The first render after transitions are on is
// drawn as it is. A render during an animation starts from the primitives as they are shown then.
export function animate(state, renderer, next, options) {
  if (!renderer.erase) throw new Error("Transitions only support the SVG and Canvas renderers for now.");
  const start = Date.now();
  const prev = state.shown?.(start);
  state.stop?.();
  const items = prev ? diff(prev, next, options) : next.map((p) => ({end: 0, at: () => p}));
  const end = Math.max(0, ...items.map((item) => item.end));
  state.shown = (time) => items.map((item) => item.at(time - start)).filter((p) => p);
  let done;
  let id;
  state.promise = new Promise((resolve) => {
    done = resolve;
  });
  state.stop = () => {
    unschedule(id);
    done();
  };
  const frame = () => {
    const now = Date.now();
    draw(renderer, state.shown(now));
    if (now - start >= end) state.stop();
    else id = schedule(frame);
  };
  frame();
}

function draw(renderer, primitives) {
  renderer.erase();
  for (const {type, attrs, ops} of primitives) {
    renderer.save();
    for (const [op, ...args] of ops) renderer[op](...args);
    renderer[type](attrs);
    renderer.restore();
  }
  renderer.render?.();
}
