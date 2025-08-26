import { id } from "./items/index.js";
import { getKey } from "./save.js";
import initStore, { dispatch, getState } from "./store.js";

const defaultState = {
  m: true,
  b: null,
  s: 0,
};

export function reducer(state = defaultState, { type, payload }) {
  switch (type) {
    case "initGame":
      return {
        ...state,
        b: payload,
        s: 0,
      };
    case "setBoard":
      return {
        ...state,
        b: payload,
      };
    case "spendMagic":
      return {
        ...state,
        s: state.s + payload,
      };
    default:
      return state;
  }
}

export const getCurrentBoard = () => getState().b;

function buildTempBoard(board) {
  const tempBoard = [];
  board.forEach((row, rowIndex) => {
    tempBoard[rowIndex] = [];
    row.forEach((itemId, colIndex) => {
      const canvas = document.getElementById("i" + itemId);
      const isBook = canvas ? id(canvas.gameItem) === 11 : false;
      tempBoard[rowIndex][colIndex] = isBook ? 1 : 0;
    });
  });
  return tempBoard;
}

function floodFillSize(tempBoard, sr, sc, visited) {
  const rows = tempBoard.length;
  const cols = rows ? tempBoard[0].length : 0;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  let stack = [[sr, sc]];
  visited[sr][sc] = true;
  let n = 0;

  while (stack.length) {
    const [cr, cc] = stack.pop();
    n++;
    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !visited[nr][nc] &&
        tempBoard[nr][nc] === 1
      ) {
        visited[nr][nc] = true;
        stack.push([nr, nc]);
      }
    }
  }

  return n;
}

export const getBooksMagic = () => {
  const board = getCurrentBoard();
  const tempBoard = buildTempBoard(board);

  let bookMagicScore = 0;

  const rows = tempBoard.length;
  const cols = rows ? tempBoard[0].length : 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (tempBoard[r][c] === 1 && !visited[r][c]) {
        const n = floodFillSize(tempBoard, r, c, visited);
        bookMagicScore += n * (n + 1);
      }
    }
  }

  return bookMagicScore;
};

export const getSpecificBookMagic = (itemUniqId) => {
  const board = getCurrentBoard();
  const tempBoard = buildTempBoard(board);

  let start = null;
  for (let r = 0; r < board.length && !start; r++) {
    for (let c = 0; c < (board[r] || []).length; c++) {
      if (board[r][c] === itemUniqId) {
        start = [r, c];
        break;
      }
    }
  }
  if (!start) return 0;

  const [sr, sc] = start;

  const rows = tempBoard.length;
  const cols = rows ? tempBoard[0].length : 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  const n = floodFillSize(tempBoard, sr, sc, visited);
  return n + 1;
};

export const getItemUniqIds = () => {
  const board = getCurrentBoard();
  const uniqIds = new Set();

  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell > 0) {
        uniqIds.add(cell);
      }
    });
  });

  return Array.from(uniqIds);
};

export const getTotalItems = () => {
  const allItemUniqIds = getItemUniqIds();
  return allItemUniqIds.filter((id) => {
    const canvas = document.getElementById("i" + id);
    return canvas && !canvas.gameItem?.isCat;
  }).length;
};

export const areSoundMuted = () => getState().m;

export const toggleMuteSounds = (isMuted) =>
  dispatch({
    type: "toggleMuteSounds",
    payload: { isMuted },
  });

export function getMagic() {
  return (
    getItemUniqIds().reduce((acc, uniqId) => {
      const canvas = document.getElementById("i" + uniqId);
      const isBook = id(canvas?.gameItem) === 11;

      return acc + (isBook ? 0 : canvas?.gameItem?.value ?? 0);
    }, 0) -
    (getState().s ?? 0) +
    getBooksMagic()
  );
}

export default function init() {
  initStore(reducer, getKey("state") || defaultState);
}

/*
DEBUG
getCurrentBoard().forEach((row, index) => {
          console.log(index, JSON.stringify(row));
        });

*/
