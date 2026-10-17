export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

// Returns the color [r, g, b, a] of the image at x and y, with the image
// scaled to cover width × height, like CSS object-fit: cover.
export function imageSampler(image, width, height) {
  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));
  const context = document.createElement("canvas").getContext("2d", {willReadFrequently: true});
  context.canvas.width = width;
  context.canvas.height = height;
  const k = Math.max(width / image.width, height / image.height);
  const w = image.width * k;
  const h = image.height * k;
  context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  const {data} = context.getImageData(0, 0, width, height);
  return (x, y) => {
    const i =
      (Math.min(height - 1, Math.max(0, Math.round(y))) * width + Math.min(width - 1, Math.max(0, Math.round(x)))) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3] / 255];
  };
}
