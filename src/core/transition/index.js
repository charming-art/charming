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
// Once it ends, or is stopped by another, onend is called, such as to play the next keyframe.
export function animate(state, renderer, next, options, onend) {
  // A render that isn't a moment of keyframes stops their sequence.
  if (!state.playing) {
    state.sequence = null;
    state.token = null;
  }
  if (!renderer.erase) throw new Error("Transitions only support the SVG and Canvas renderers for now.");
  const start = Date.now();
  const prev = state.shown?.(start);
  state.stop?.();
  const items = prev ? diff(prev, next, options) : next.map((p) => ({end: 0, at: () => p}));
  // The end of the last item, in a loop rather than spread into Math.max, for large scenes.
  let end = 0;
  for (const item of items) if (item.end > end) end = item.end;
  state.shown = (time) => items.map((item) => item.at(time - start)).filter((p) => p);
  let done;
  let id;
  let stopped = false;
  state.promise = new Promise((resolve) => {
    done = resolve;
  });
  const stop = () => {
    if (stopped) return;
    stopped = true;
    unschedule(id);
    done();
    if (onend) onend();
  };
  state.stop = stop;
  const frame = () => {
    const now = Date.now();
    draw(renderer, state.shown(now));
    if (now - start >= end) stop();
    else id = schedule(frame);
  };
  frame();
}

function draw(renderer, primitives) {
  renderer.erase();
  for (const {type, attrs, ops} of primitives) {
    // A primitive drawn without translations or rotations isn't put in a group of its own.
    if (!ops.length) {
      renderer[type](attrs);
      continue;
    }
    renderer.save();
    for (const [op, ...args] of ops) renderer[op](...args);
    renderer[type](attrs);
    renderer.restore();
  }
  renderer.render?.();
}

// The order of the scenes of keyframes: in order, or back and forth if alternate, iterations times.
function orderOf(n, {direction = "normal", iterations = 1}) {
  const order = [];
  for (let i = 0; i < iterations; i++) {
    const forward = direction !== "alternate" || i % 2 === 0;
    for (let j = 0; j < n; j++) {
      const m = forward ? j : n - 1 - j;
      // Alternating, a turn doesn't repeat the scene it turns at.
      if (i > 0 && j === 0 && direction === "alternate") continue;
      order.push(m);
    }
  }
  return order;
}

// Plays the scenes of keyframes in turn, each animated from the one before with the timing of its
// keyframe. A render during the sequence stops it. The sequence resolves once the last scene ends.
export function play(state, renderer, scenes, options) {
  const order = orderOf(scenes.length, options);
  const token = {};
  state.token = token;
  let done;
  state.sequence = new Promise((resolve) => {
    done = resolve;
  });
  const step = (s) => {
    if (state.token !== token || s >= order.length) {
      done();
      return;
    }
    const {primitives, timing} = scenes[order[s]];
    state.playing = true;
    animate(state, renderer, primitives, {...options, ...timing}, () => step(s + 1));
    state.playing = false;
  };
  step(0);
}
