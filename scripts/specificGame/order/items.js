export function rotate(item, angle = 0, drawScale = 2) {
  const currentRotate = item.rot ?? 0;
  item.rot = (currentRotate + angle) % 360;

  let newShape = item.shape;
  const times = angle / 90;
  for (let t = 0; t < times; t++) {
    const numRows = newShape.length;
    const numCols = newShape[0].length;
    const rotated = [];
    for (let col = 0; col < numCols; col++) {
      const newRow = [];
      for (let row = numRows - 1; row >= 0; row--) {
        newRow.push(newShape[row][col]);
      }
      rotated.push(newRow);
    }
    newShape = rotated;
  }
  item.shape = newShape;

  item.canvas.width = item.canvas.width;
  drawItem(item, drawScale);

  return item;
}

export function rotateItemToRight(item) {
  return rotate(item, 90);
}

export function rotateItemToLeft(item) {
  return rotate(item, 270);
}
