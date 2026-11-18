// The primitives that shapes draw.
const primitives = ["point", "circle", "rect", "line", "triangle", "path", "polygon", "text", "arc", "clear"];

// The channels of the timing of a stage: delay, duration and ease, for updates, and enterDelay or
// exitDuration, for enters and exits.
const timings = ["delay", "duration", "ease"];

// A renderer that records what shapes draw rather than drawing it, for transitions: each primitive
// keeps its type, its attributes and the translations, rotations and clips it's drawn in. While a shape
// of the flow is drawn, between begin and end, its primitives also get their identity, their
// states as they enter and exit, and their timing, from the channels of their rows.
export function recorder() {
  const recorded = [];
  const stack = [];
  let ops = [];
  let node = null;
  let start = 0;
  const renderer = {
    recorded,
    save() {
      stack.push(ops);
      ops = ops.slice();
    },
    restore() {
      ops = stack.pop() ?? [];
    },
    translate(x, y) {
      ops.push(["translate", x, y]);
    },
    rotate(angle) {
      ops.push(["rotate", angle]);
    },
    // A clip is kept flat, so that its numbers interpolate: a rect, or a path at x and y.
    clip({x = 0, y = 0, width, height, d}) {
      ops.push(d === undefined ? ["clip", "rect", x, y, width, height] : ["clip", "path", x, y, d]);
    },
    begin(meta) {
      node = meta;
      start = recorded.length;
    },
    end() {
      // A shape that draws a primitive per row, such as a rect, gives each primitive its row; one
      // that draws a primitive per group, such as a line, gives it the first row of the group.
      const n = recorded.length - start;
      const perRow = n === node.I.length;
      for (let i = 0; i < n; i++) Object.assign(recorded[start + i], identify(node, perRow ? node.I[i] : null, i));
      node = null;
    },
  };
  for (const type of primitives) {
    renderer[type] = function (attrs) {
      recorded.push({type, attrs: {...attrs}, ops: ops.slice()});
    };
  }
  return renderer;
}

function identify({path, scope, I, value = {}, group}, row, n) {
  const r = row ?? I[0];
  const at = (key) => value[key]?.[r];
  const datum = row === null ? group : group[row];
  return {
    path,
    scope,
    position: `${row ?? `g${n}`}`,
    key: at("key"),
    groupKey: at("groupKey"),
    datum: datum !== null && typeof datum === "object" ? datum : undefined,
    appear: at("appear") === true || stateOf(value, "appear", r),
    enter: stateOf(value, "enter", r),
    exit: stateOf(value, "exit", r),
    timing: {
      update: timingOf(value, "", r),
      appear: timingOf(value, "appear", r),
      enter: timingOf(value, "enter", r),
      exit: timingOf(value, "exit", r),
    },
  };
}

// The attributes of a stage of a row, such as {y: 200} from the channel enterY.
function stateOf(value, stage, r) {
  const state = {};
  for (const key in value) {
    if (!key.startsWith(stage) || key.length === stage.length) continue;
    const name = key[stage.length].toLowerCase() + key.slice(stage.length + 1);
    if (!timings.includes(name)) state[name] = value[key]?.[r];
  }
  return state;
}

function timingOf(value, stage, r) {
  const timing = {};
  for (const name of timings) {
    const key = stage ? stage + name[0].toUpperCase() + name.slice(1) : name;
    if (key in value) timing[name] = value[key]?.[r];
  }
  return timing;
}
