// A genji transform for examples, used as ```js eval t=example.
//
// An example is written as a standalone script: it appends its nodes with
// document.body.append and animates with requestAnimationFrame, setInterval or
// setTimeout. The transform runs it and returns the appended nodes, and stops
// its frames and timers when the block reruns or the page is left, so the code
// shown is the code that runs. Other cleanup, such as stopping sounds, goes in
// invalidation.then(callback), as in Observable.
//
// The script is passed to the browser as a string, so it can use any syntax,
// and genji only sees the names that may refer to other blocks, such as inputs.
// The builtins width, now and dark are left out, so an example with its own
// width doesn't rerun when the window resizes.

const reserved = new Set(
  (
    "break case catch class const continue debugger default delete do else enum export extends false finally for " +
    "function if import in instanceof let new null return static super switch this throw true try typeof var void " +
    "while with yield await async of get set arguments eval undefined NaN Infinity " +
    "value width now dark unsubscribe invalidation document requestAnimationFrame cancelAnimationFrame setInterval setTimeout"
  ).split(" "),
);

export function example(code) {
  const names = [...new Set(code.match(/(?<![\w$.])[A-Za-z_$][\w$]*/g))].filter((d) => !reserved.has(d));
  const inputs = names
    .map((d) => `  if (typeof ${d} !== "undefined" && window.${d} !== ${d}) __names.push("${d}"), __values.push(${d});`)
    .join("\n");
  const body = code.replace(/document\.body\.append\(/g, "__display(") + "\n//# sourceURL=example.js";
  return `(() => {
  const __names = [];
  const __values = [];
${inputs}
  const __nodes = [];
  const __frames = new Set();
  const __timers = new Set();
  let __disposed = false;
  let __root = null;
  const __alive = () => {
    if (__disposed) return false;
    if (__root && __root.__mounted && !__root.isConnected) (__disposed = true), __invalidate();
    if (__root && __root.isConnected) __root.__mounted = true;
    return !__disposed;
  };
  const __display = (...nodes) => __nodes.push(...nodes);
  let __invalidate;
  const __invalidation = new Promise((resolve) => (__invalidate = resolve));
  const __requestAnimationFrame = (callback) => {
    const id = window.requestAnimationFrame((time) => {
      __frames.delete(id);
      if (__alive()) callback(time);
    });
    __frames.add(id);
    return id;
  };
  const __cancelAnimationFrame = (id) => {
    __frames.delete(id);
    window.cancelAnimationFrame(id);
  };
  const __setInterval = (callback, delay) => {
    const id = window.setInterval(() => {
      if (__alive()) callback();
      else window.clearInterval(id);
    }, delay);
    __timers.add(id);
    return id;
  };
  const __setTimeout = (callback, delay) => {
    const id = window.setTimeout(() => {
      __timers.delete(id);
      if (__alive()) callback();
    }, delay);
    __timers.add(id);
    return id;
  };
  unsubscribe(() => {
    __disposed = true;
    for (const id of __frames) window.cancelAnimationFrame(id);
    for (const id of __timers) window.clearTimeout(id), window.clearInterval(id);
    __invalidate();
  });
  new Function(
    "__display",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "setInterval",
    "setTimeout",
    "invalidation",
    ...__names,
    ${JSON.stringify(body)}
  )(__display, __requestAnimationFrame, __cancelAnimationFrame, __setInterval, __setTimeout, __invalidation, ...__values);
  if (__nodes.length === 1 && __nodes[0] instanceof Node) __root = __nodes[0];
  else {
    __root = document.createElement("div");
    __root.append(...__nodes);
  }
  return __root;
})()`;
}
