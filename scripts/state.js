import { getKey } from "./save.js";
import initStore, { dispatch, getState } from "./store.js";

const defaultState = {
  muted: true,
  currentBoard: null,
};

export function reducer(state = defaultState, { type, payload }) {
  switch (type) {
    case "setBoard":
      return {
        ...state,
        currentBoard: payload,
      };
    default:
      return state;
  }
}

export const getCurrentBoard = () => getState().currentBoard;

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

export const areSoundMuted = () => getState().muted;

export const toggleMuteSounds = (isMuted) =>
  dispatch({
    type: "toggleMuteSounds",
    payload: { isMuted },
  });

export default function init() {
  initStore(reducer, getKey("state") || defaultState);
}

/*
DEBUG
getCurrentBoard().forEach((row, index) => {
          console.log(index, JSON.stringify(row));
        });

*/
