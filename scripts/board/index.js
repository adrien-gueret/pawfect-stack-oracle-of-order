import { rotate } from "../items/index.js";

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

export function growPlant(driedPlantCanvas, board) {
  const descStart = "By watering the dried plant, it";
  let fullPlant = {
    uniqId: driedPlantCanvas.gameItem.uniqId,
    name: "Carnivorous Plant",
    desc: descStart + " has fully grown and regained all its magic!",
    value: 9,
    canvas: document.createElement("canvas"),
    shape: [
      [1, 1],
      [0, 1],
    ],
    x: 0,
    y: 96,
  };

  let mediumPlant = {
    ...fullPlant,
    desc: descStart + " has grown a bit and regained some of its magic.",
    value: 6,
    canvas: document.createElement("canvas"),
    shape: [[1], [1]],
    x: 16,
    y: 96,
  };

  let smallPlant = {
    ...fullPlant,
    desc: descStart + " tried to grow but something blocked it...",
    value: 3,
    canvas: document.createElement("canvas"),
    shape: [[1]],
    x: 16,
    y: 112,
  };

  const boardWithoutDriedPlant = removeItemToBoard(
    driedPlantCanvas.gameItem.uniqId,
    board
  );

  driedPlantCanvas.dispatchEvent(new MouseEvent("mouseleave"));

  let newPlant;

  [
    [
      fullPlant,
      (() => {
        switch (driedPlantCanvas.gameItem.rot) {
          case 90:
            return [-1, 0];
          case 180:
            return [0, 0];
          case 270:
            return [0, -1];
          default:
            return [-1, -1];
        }
      })(),
    ],
    [
      mediumPlant,
      (() => {
        switch (driedPlantCanvas.gameItem.rot) {
          case 90:
          case 180:
            return [0, 0];
          case 270:
            return [0, -1];
          default:
            return [-1, -0];
        }
      })(),
    ],
    [smallPlant, [0, 0]],
  ].some(([currentPlant, [baseRowDelta, baseColumnDelta]]) => {
    const rotatedPlant = rotate(currentPlant, driedPlantCanvas.gameItem.rot, 3);
    rotatedPlant.canvas.gameItem = rotatedPlant;
    rotatedPlant.canvas.coor = { ...driedPlantCanvas.coor };
    rotatedPlant.canvas.coor.row += baseRowDelta;
    rotatedPlant.canvas.coor.col += baseColumnDelta;

    const overlaps = checkApplyItemToBoard(
      rotatedPlant,
      boardWithoutDriedPlant,
      rotatedPlant.canvas.coor.col,
      rotatedPlant.canvas.coor.row
    );

    if (overlaps.length) {
      return false;
    }

    newPlant = rotatedPlant;

    return true;
  });

  const newBoard = applyItemToBoard(
    newPlant,
    boardWithoutDriedPlant,
    newPlant.canvas.coor.col,
    newPlant.canvas.coor.row
  );

  driedPlantCanvas.replaceWith(newPlant.canvas);
  newPlant.canvas.id = driedPlantCanvas.id;

  newPlant.canvas.style.left = `${(newPlant.canvas.coor.col + 1) * 48}px`;
  newPlant.canvas.style.top = `${(newPlant.canvas.coor.row + 1) * 48}px`;

  return [newBoard, newPlant];
}

const newEmptyBoard = () => Array.from({ length: 10 }, () => Array(10).fill(0));

const levels = (() => {
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
