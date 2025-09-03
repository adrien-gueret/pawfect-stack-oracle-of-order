import { drawItem } from "../../items/index.js";

export function rotate(item, angle = 0, drawScale = 2) {
  const currentRotate = item.rot ?? 0;
  item.rot = (currentRotate + angle) % 360;

  let newShape = item.shape;

  for (let t = 0; t < angle / 90; t++) {
    const rotated = [];
    for (let col = 0; col < newShape[0].length; col++) {
      const newRow = [];
      for (let row = newShape.length - 1; row >= 0; row--) {
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
