// A step of a flow: what a builder records, such as the transform of flow.transform, to run once
// when it's needed. The steps of a flow's context are queued in the order they're built and run in
// that order, so that each sees the effects of the ones before it, as when flows ran as they were
// built, such as a renderer resized by cm.plane before a chart nested in it reads its size. While a
// step runs, or while the flow renders, the steps built then run right away, such as the flows that
// an axis builds as it draws. A step keeps what it runs, so that it may run again.
export function step(context, run) {
  const s = {context, run, state: "pending", value: undefined};
  if (context.depth > 0) runStep(s);
  else context.queue.push(s);
  return s;
}

// A step already run, with its value, such as the root of a flow.
export function done(value) {
  return {context: null, run: null, state: "done", value};
}

// The state of a flow whose rows are known as it's built, such as the root's.
export function concrete(groups) {
  return done({groups, values: null, branches: null});
}

// The value of a step: the steps queued before it run first, in order. An error is thrown again
// by the steps that depend on the one that threw it.
export function force(s) {
  const {context} = s;
  while (s.state === "pending") {
    if (!context.queue.length) throw new Error("A step of the flow was never queued.");
    runStep(context.queue.shift());
  }
  if (s.state === "running") throw new Error("A step of the flow depends on itself.");
  if (s.state === "failed") throw s.value;
  return s.value;
}

// Runs every step queued in a context, such as before a render.
export function flush(context) {
  while (context.queue.length) runStep(context.queue.shift());
}

function runStep(s) {
  const {context} = s;
  s.state = "running";
  context.depth++;
  try {
    s.value = s.run();
    s.state = "done";
  } catch (error) {
    s.value = error;
    s.state = "failed";
    throw error;
  } finally {
    context.depth--;
  }
}
