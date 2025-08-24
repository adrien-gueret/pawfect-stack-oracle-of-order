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
      return acc + (canvas?.gameItem?.value ?? 0);
    }, 0) - (getState().s ?? 0)
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
