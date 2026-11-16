// Calls step every wait milliseconds, after the previous step resolves, while the node is on the
// page, so that switching cases stops the animation.
export function loop(node, step, wait = 500) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  (async () => {
    await sleep(0);
    while (node.isConnected) {
      await sleep(wait);
      if (node.isConnected) await step();
    }
  })();
  return node;
}
