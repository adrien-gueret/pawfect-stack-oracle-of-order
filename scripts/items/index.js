const items = [
  {
    name: "Potion",
    shape: [[1]],
    x: 32,
    y: 0,
  },
  {
    name: "Cauldron",
    shape: [
      [1, 1],
      [1, 1],
    ],
    x: 16,
    y: 16,
  },
  {
    name: "Candle",
    shape: [[1], [1]],
    x: 48,
    y: 0,
  },
  {
    name: "temp",
    shape: [
      [1, 1],
      [1, 0],
    ],
    x: 0,
    y: 0,
  },
];

export function drawItem(ctx, item, bg) {
  const img = new Image();
  img.src = "./images/sprites.png";

  img.onload = () => {
    ctx.imageSmoothingEnabled = false;
    for (let row = 0; row < item.shape.length; row++) {
      for (let col = 0; col < item.shape[row].length; col++) {
        if (item.shape[row][col] === 1) {
          if (bg) {
            ctx.fillStyle = bg;
            ctx.fillRect(col * 48, row * 48, 48, 48);
          }
          ctx.drawImage(
            img,
            item.x + col * 16,
            item.y + row * 16,
            16,
            16,
            col * 48,
            row * 48,
            48,
            48
          );
        }
      }
    }
  };
}

export function id(n) {
  return items.findIndex((item) => item.name === n);
}

export function getItem(i) {
  return items[i];
}

export default items;
