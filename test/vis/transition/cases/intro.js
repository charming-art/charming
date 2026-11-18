// Draws a chart with draw, then hides and shows it again and again while the node is on the page,
// so that its intro plays on the first render with appear, and its marks enter after each hide.
export function intro(node, root, draw, wait = 1500) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  draw();
  root.render();
  (async () => {
    await sleep(0);
    while (node.isConnected) {
      await root.finished();
      await sleep(wait);
      if (!node.isConnected) break;
      root.render();
      await root.finished();
      await sleep(300);
      if (!node.isConnected) break;
      draw();
      root.render();
    }
  })();
  return node;
}
