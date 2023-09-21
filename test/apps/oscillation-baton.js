import * as cm from "./_cm.js";

export function oscillationBaton() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  app
    .frame(() => app.shape(cm.background, { fill: cm.rgb(255) }))
    .frame(() => {
      const group = app.shape(cm.group, {
        x: app.width() / 2,
        y: app.height() / 2,
        rotate: app.frameCount() / 50,
      });
      group.shape(cm.link, { x: -80, y: 0, x1: 80, y1: 0 });
      group.shape(cm.circle, { x: -80, y: 0, r: 5 });
      group.shape(cm.circle, { x: 80, y: 0, r: 5 });
    });

  return app.start();
}
