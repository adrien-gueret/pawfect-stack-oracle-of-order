import { getKey } from "./save.js";
import initStore, { dispatch, getState } from "./store.js";

const defaultState = {
  muted: true,
  board: null,
  spentMagic: 0,
};

export function reducer(state = defaultState, { type, payload }) {
  switch (type) {
    case "setBoard":
      return {
        ...state,
        board: payload,
      };
    case "spendMagic":
      return {
        ...state,
        spentMagic: state.spentMagic + payload,
      };
    default:
      return state;
  }
}

export const getCurrentBoard = () => getState().board;

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

export function getMagic() {
  return (
    getItemUniqIds().reduce((acc, uniqId) => {
      const canvas = document.getElementById("i" + uniqId);
      return acc + (canvas?.gameItem?.value ?? 0);
    }, 0) - (getState().spentMagic ?? 0)
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
