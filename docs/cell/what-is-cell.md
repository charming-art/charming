# What is Cell?

```js eval
cm.cell((ctx) => ({
  mode: "double",
  width: 520,
  height: 520,
  setup() {
    for (let t = 0; t <= Math.PI * 2; t += Math.PI / 120) {
      const x = ctx.cols() / 2 + 12 * Math.cos(t) * Math.cos(t * 3);
      const y = ctx.rows() / 2 + 12 * Math.sin(t) * Math.cos(t * 3);
      ctx.stroke(cm.wide("🌟"));
      ctx.point(x, y);
    }
  },
}));
```
