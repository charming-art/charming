import {drawPrimitive} from "../inset.js";
import {appear, diff} from "./diff.js";

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
// update, and the others enter, exit, split or merge. On the first render after transitions are
// on, the primitives with their own enter state or timing enter, and the others are drawn as they
// are. A render during an animation starts from the primitives as they are shown then.
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
  const items = prev ? diff(prev, next, options) : appear(next, options);
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
      drawPrimitive(renderer, type, attrs);
      continue;
    }
    renderer.save();
    for (const [op, ...args] of ops) {
      if (op === "clip") renderer.clip?.(clipOf(args));
      else renderer[op](...args);
    }
    drawPrimitive(renderer, type, attrs);
    renderer.restore();
  }
  renderer.render?.();
}

// The shape of a recorded clip.
function clipOf([type, x, y, a, b]) {
  return type === "rect" ? {x, y, width: a, height: b} : {x, y, d: a};
}

// The number of scenes played: in order, or back and forth if alternate, iterations times, where a
// turn doesn't repeat the scene it turns at. It may be infinite.
function lengthOf(n, {direction = "normal", iterations = 1}) {
  if (n <= 1) return n;
  return direction === "alternate" ? n + (iterations - 1) * (n - 1) : n * iterations;
}

// The scene played at step s, computed rather than listed, so that iterations can be infinite.
function sceneAt(s, n, {direction = "normal"}) {
  if (direction !== "alternate") return s % n;
  if (s < n) return s;
  const t = s - n;
  const turn = Math.floor(t / (n - 1));
  const i = t % (n - 1);
  return turn % 2 === 0 ? n - 2 - i : 1 + i;
}

// Stops a sequence of keyframes: the token goes first, so that the animation it stops doesn't play
// the next scene.
export function stopSequence(state) {
  state.token = null;
  state.sequence = null;
  if (state.stop) state.stop();
}

// Plays the scenes of keyframes in turn, each animated from the one before with the timing of its
// keyframe. A render during the sequence stops it. The sequence resolves once the last scene ends,
// or at once if playing fails, such as on a renderer that can't animate.
export function play(state, renderer, scenes, options) {
  const n = scenes.length;
  const length = lengthOf(n, options);
  const token = {};
  state.token = token;
  let done;
  state.sequence = new Promise((resolve) => {
    done = resolve;
  });
  // A scene that ends at once, such as one without duration, calls next while it's being played;
  // the loop then plays the following one, rather than nesting a call per scene.
  let s = 0;
  let playing = false;
  let again = false;
  const next = () => {
    s++;
    if (playing) again = true;
    else run();
  };
  const run = () => {
    do {
      again = false;
      if (state.token !== token || s >= length) {
        done();
        return;
      }
      const {primitives, timing} = scenes[sceneAt(s, n, options)];
      playing = true;
      state.playing = true;
      try {
        animate(state, renderer, primitives, {...options, ...timing}, next);
      } catch (error) {
        state.token = null;
        state.sequence = null;
        done();
        throw error;
      } finally {
        state.playing = false;
        playing = false;
      }
    } while (again);
  };
  run();
}
