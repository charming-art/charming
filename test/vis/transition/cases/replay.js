// Draws the keyframes of a case with draw, plays them, and plays them again a second after they
// end, while the node is on the page, so that switching cases stops them.
export function replay(node, root, draw) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  draw();
  root.render();
  (async () => {
    await sleep(0);
    while (node.isConnected) {
      await root.finished();
      await sleep(1000);
      if (!node.isConnected) break;
      draw();
      root.render();
    }
  })();
  return node;
}
