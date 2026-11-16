import {easeOf, interpolateAttrs, interpolateOps} from "./interpolate.js";
import {boxOf, morph, morphable, pack, piece, sortByPosition} from "./morph.js";

// A mark fades in and out unless it gives its own states.
const fade = {fillOpacity: 0, strokeOpacity: 0};

// The items that animate from the primitives shown, prev, to the primitives drawn, next. A drawn
// primitive matches a shown one by its key, else by its datum, else by its position in the flow,
// within the same shape of the flow, and then updates; keyed primitives only match by key. One that doesn't match may split from a
// shown primitive whose key is its group key; a shown one that doesn't match may merge into a drawn
// primitive whose key is its group key. The others enter or exit.
export function diff(prev, next, options) {
  const m = prev.length;
  const n = next.length;
  const used = new Set();
  const byKey = new Map();
  const byDatum = new Map();
  const byPosition = new Map();
  const keyed = new Map();
  // Keys match within a shape drawn under the same parent rows (its path, with its scope), and
  // group keys within the same parent rows; the first of duplicate keys wins.
  for (let i = 0; i < m; i++) {
    const {path, scope, key, datum, position} = prev[i];
    if (key !== undefined) {
      if (!byKey.has(`${path}\0${key}`)) byKey.set(`${path}\0${key}`, i);
      if (!keyed.has(`${scope}\0${key}`)) keyed.set(`${scope}\0${key}`, i);
      continue;
    }
    // A keyed primitive only matches by its key.
    byPosition.set(`${path}\0${position}`, i);
    if (datum) {
      if (!byDatum.has(path)) byDatum.set(path, new Map());
      byDatum.get(path).set(datum, i);
    }
  }

  const take = (i) => {
    if (i === undefined || used.has(i)) return -1;
    used.add(i);
    return i;
  };
  const matches = new Array(n);
  for (let j = 0; j < n; j++) {
    const {path, key, datum, position} = next[j];
    let i = -1;
    if (key !== undefined) i = take(byKey.get(`${path}\0${key}`));
    else {
      if (datum) i = take(byDatum.get(path)?.get(datum));
      if (i < 0) i = take(byPosition.get(`${path}\0${position}`));
    }
    matches[j] = i;
  }

  // Group keys: a drawn primitive splits from the shown one keyed by its group key, and a shown one
  // merges into the drawn one keyed by its group key.
  const nextKeyed = new Map();
  for (let j = 0; j < n; j++) {
    const {scope, key} = next[j];
    if (matches[j] < 0 && key !== undefined && !nextKeyed.has(`${scope}\0${key}`)) nextKeyed.set(`${scope}\0${key}`, j);
  }
  // The shown primitives merging into each drawn one, and the drawn primitives splitting from each
  // shown one, so that each group shares the pieces of one box.
  const merges = new Map();
  const splitsOf = new Map();
  for (let i = 0; i < m; i++) {
    if (used.has(i)) continue;
    const {scope, groupKey} = prev[i];
    const j = groupKey !== undefined ? nextKeyed.get(`${scope}\0${groupKey}`) : undefined;
    if (j === undefined) continue;
    if (!merges.has(j)) merges.set(j, []);
    merges.get(j).push(prev[i]);
  }
  for (let j = 0; j < n; j++) {
    const {scope, groupKey} = next[j];
    if (matches[j] >= 0 || merges.has(j) || groupKey === undefined) continue;
    const k = keyed.get(`${scope}\0${groupKey}`);
    if (k === undefined || used.has(k)) continue;
    if (!splitsOf.has(k)) splitsOf.set(k, []);
    splitsOf.get(k).push(next[j]);
  }

  const items = [];
  // Shown primitives that don't match exit, unless they merge into a drawn one or split into some.
  for (let i = 0; i < m; i++) {
    if (used.has(i) || splitsOf.has(i)) continue;
    const p = prev[i];
    const {scope, groupKey} = p;
    if (groupKey !== undefined && merges.has(nextKeyed.get(`${scope}\0${groupKey}`))) continue;
    const exit = {...p.attrs, ...state(p.exit)};
    items.push(item(p, "until-end", p.attrs, exit, p.ops, p.ops, timing(p, "exit", options)));
  }
  // Merging primitives move with the timing of the primitive they merge into, from the new frame:
  // into a piece each of its box if they can morph, else into its attributes.
  for (const [j, sources] of merges) {
    const q = next[j];
    const t = timing(q, "update", options);
    if (morphable(q) && sources.every(morphable)) {
      const pieces = pack(boxOf(q), sources.length);
      const ordered = sortByPosition(sources);
      for (let k = 0; k < ordered.length; k++) {
        const p = ordered[k];
        items.push(shift(p, "until-end", p, piece(pieces[k], q), t));
      }
    } else {
      for (const p of sources) {
        items.push(item(p, "until-end", p.attrs, toward(p.attrs, q.attrs), p.ops, opsOf(p, q), t));
      }
    }
  }
  // Splitting primitives start from a piece each of the box of the primitive they split from, if
  // they can morph, else from its attributes.
  const splitFrom = new Map();
  const pieces = new Set();
  for (const [k, targets] of splitsOf) {
    const p = prev[k];
    if (morphable(p) && targets.every(morphable)) {
      const boxes = pack(boxOf(p), targets.length);
      const ordered = sortByPosition(targets);
      for (let i = 0; i < ordered.length; i++) {
        const from = piece(boxes[i], p);
        pieces.add(from);
        splitFrom.set(ordered[i], from);
      }
    } else {
      for (const q of targets) splitFrom.set(q, p);
    }
  }
  for (let j = 0; j < n; j++) {
    const q = next[j];
    const i = matches[j];
    const t = timing(q, "update", options);
    if (i >= 0) {
      const p = prev[i];
      // A primitive of another type morphs into the new one, if both can.
      if (p.type !== q.type && morphable(p) && morphable(q)) items.push(morph(q, "always", p, q, t));
      else items.push(item(q, "always", p.attrs, q.attrs, p.ops, q.ops, t));
    } else if (merges.has(j)) {
      items.push(item(q, "at-end", q.attrs, q.attrs, q.ops, q.ops, t));
    } else if (splitFrom.has(q)) {
      const p = splitFrom.get(q);
      if (pieces.has(p)) items.push(shift(q, "always", p, q, t));
      else items.push(item(q, "always", toward(q.attrs, p.attrs), q.attrs, opsOf(q, p), q.ops, t));
    } else {
      const enter = {...q.attrs, ...state(q.enter)};
      items.push(item(q, "always", enter, q.attrs, q.ops, q.ops, timing(q, "enter", options)));
    }
  }
  return items;
}

// A primitive moving from one shape to another: by its attributes if they have the same type and
// aren't transformed, anchored or turned, such as a rect into a piece of a bar, else by morphing on
// the screen.
function shift(source, show, from, to, t) {
  if (from.type === to.type && plain(from) && plain(to)) {
    return item(source, show, {...to.attrs, ...from.attrs}, to.attrs, [], [], t);
  }
  return morph(source, show, from, to, t);
}

// Whether a primitive is drawn where its attributes say: not in a group that's moved or turned, and
// not anchored at its center or turned itself.
function plain({ops, attrs}) {
  return !ops.length && !attrs.rotate && (attrs.anchor === undefined || attrs.anchor === "start");
}

// The attributes of a primitive with the values of another where it has them, such as the box of a
// bar that points split from.
function toward(attrs, other) {
  return Object.fromEntries(Object.entries(attrs).map(([key, v]) => [key, other[key] ?? v]));
}

function opsOf(a, b) {
  return a.ops.length === b.ops.length ? b.ops : a.ops;
}

// The attributes of a state, without the ones the row doesn't give, else a fade.
function state(attrs = {}) {
  const defined = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== undefined));
  return Object.keys(defined).length ? defined : fade;
}

// The timing of a stage of a primitive: its own, else its update timing, else the flow's.
function timing({timing = {}}, stage, options) {
  const own = timing[stage] ?? {};
  const update = timing.update ?? {};
  const pick = (name) => own[name] ?? update[name] ?? options[name];
  return {delay: pick("delay"), duration: pick("duration"), ease: easeOf(pick("ease"))};
}

// An animated primitive, shown always, until it ends (exits), or once it ends (merge targets).
function item(source, show, from, to, ops0, ops1, {delay, duration, ease}) {
  const attrs = interpolateAttrs(from, to);
  const ops = interpolateOps(ops0, ops1);
  const local = (elapsed) =>
    duration > 0 ? Math.max(0, Math.min(1, (elapsed - delay) / duration)) : +(elapsed >= delay);
  return {
    end: delay + duration,
    // The primitive at a time since the start, or null if it isn't shown, with its identity, so
    // that a render during the animation starts from it.
    at(elapsed) {
      const t = local(elapsed);
      if ((show === "until-end" && t >= 1) || (show === "at-end" && t < 1)) return null;
      const e = ease(t);
      return {...source, attrs: attrs(e), ops: ops(e)};
    },
  };
}
