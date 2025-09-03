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

export function getRandomCoordinatesOfEmptySpaceAboveFloor(board) {
  const emptySpaces = [];
  for (let col = 0; col < board[0].length; col++) {
    for (let row = 0; row < board.length; row++) {
      const hasSomethingBelow =
        board[row + 1] === void 0 || board[row + 1][col] !== 0;
      if (board[row][col] === 0 && hasSomethingBelow) {
        emptySpaces.push({ col, row });
      }
    }
  }
  if (emptySpaces.length === 0) return null;
  return emptySpaces[Math.floor(Math.random() * emptySpaces.length)];
}

export function applyItemToBoard(item, board, x, y) {
  const itemShape = item.shape;

  const newBoard = board.map((row) => [...row]);
  for (let i = 0; i < itemShape.length; i++) {
    for (let j = 0; j < itemShape[i].length; j++) {
      if (itemShape[i][j]) {
        newBoard[y + i][x + j] = item.uniqId;
      }
    }
  }
  return newBoard;
}

export function removeItemToBoard(itemUniqId, board) {
  const newBoard = board.map((row) => [...row]);
  for (let i = 0; i < newBoard.length; i++) {
    for (let j = 0; j < newBoard[i].length; j++) {
      if (newBoard[i][j] === itemUniqId) {
        newBoard[i][j] = 0;
      }
    }
  }
  return newBoard;
}

export function getItemUniqIdBelowItem(itemUniqId, board) {
  const result = new Set();
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === itemUniqId) {
        for (let belowRow = row + 1; belowRow < board.length; belowRow++) {
          const belowItem = board[belowRow][col];

          if (belowItem === itemUniqId) {
            continue;
          }

          if (!belowItem || belowItem < 1) {
            break;
          }

          result.add(belowItem);

          break;
        }
      }
    }
  }
  return Array.from(result);
}

const levels = (() => {
  const newEmptyBoard = () =>
    Array.from({ length: 10 }, () => Array(10).fill(0));

  const firstLevel = newEmptyBoard();
  firstLevel[0][9] = -1;
  firstLevel[0][0] = -1;
  firstLevel[8][4] = -1;
  firstLevel[8][5] = -1;
  firstLevel[9][3] = -1;
  firstLevel[9][4] = -1;
  firstLevel[9][5] = -1;
  firstLevel[9][6] = -1;

  const secondLevel = newEmptyBoard();
  secondLevel[0][4] = -1;
  secondLevel[0][5] = -1;
  secondLevel[1][4] = -1;
  secondLevel[1][5] = -1;
  secondLevel[2][4] = -1;
  secondLevel[2][5] = -1;
  secondLevel[4][0] = -1;
  secondLevel[4][9] = -1;
  secondLevel[5][0] = -1;
  secondLevel[5][9] = -1;
  secondLevel[7][4] = -1;
  secondLevel[7][5] = -1;
  secondLevel[8][4] = -1;
  secondLevel[8][5] = -1;
  secondLevel[9][4] = -1;
  secondLevel[9][5] = -1;

  const thirdLevel = newEmptyBoard();
  thirdLevel[0][9] = -1;
  thirdLevel[0][0] = -1;
  thirdLevel[2][1] = -1;
  thirdLevel[2][2] = -1;
  thirdLevel[2][7] = -1;
  thirdLevel[2][8] = -1;
  thirdLevel[4][4] = -1;
  thirdLevel[4][5] = -1;
  thirdLevel[5][4] = -1;
  thirdLevel[5][5] = -1;
  thirdLevel[7][1] = -1;
  thirdLevel[7][2] = -1;
  thirdLevel[7][7] = -1;
  thirdLevel[7][8] = -1;
  thirdLevel[9][9] = -1;
  thirdLevel[9][0] = -1;

  return [firstLevel, secondLevel, thirdLevel];
})();

const itemGoals = [15, 18, 20];

const magicGoals = [40, 60, 70];

export const getLevel = (levelIndex = 0) => {
  return [levels[levelIndex], itemGoals[levelIndex], magicGoals[levelIndex]];
};
