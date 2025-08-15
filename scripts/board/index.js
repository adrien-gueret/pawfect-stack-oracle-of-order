import { id } from "../items/index.js";

export function checkApplyItemToBoard(item, board, x, y) {
  const itemShape = item.shape;

  const overlaps = [];

  for (let i = 0; i < itemShape.length; i++) {
    for (let j = 0; j < itemShape[i].length; j++) {
      if (itemShape[i][j]) {
        if (
          y + i < 0 ||
          y + i >= board.length ||
          x + j < 0 ||
          x + j >= board[0].length ||
          board[y + i][x + j] !== 0
        ) {
          overlaps.push({
            row: i,
            col: j,
          });
        }
      }
    }
  }

  return overlaps;
}

export function applyItemToBoard(item, board, x, y) {
  const itemShape = item.shape;
  const itemId = id(item.name);

  const newBoard = board.map((row) => [...row]);
  for (let i = 0; i < itemShape.length; i++) {
    for (let j = 0; j < itemShape[i].length; j++) {
      if (itemShape[i][j]) {
        newBoard[y + i][x + j] = itemId;
      }
    }
  }
  return newBoard;
}
