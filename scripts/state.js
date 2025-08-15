import { getKey } from "./save.js";
import initStore, { dispatch, getState } from "./store.js";

function initBoard() {
  return Array.from({ length: 10 }, () => Array(10).fill(0));
}

const defaultState = {
  muted: true,
  currentGame: {
    board: initBoard(),
  },
};

export function reducer(state = defaultState, { type, payload }) {
  switch (type) {
    // TODO: update state according to action type

    default:
      return state;
  }
}

export const areSoundMuted = () => getState().muted;

export const toggleMuteSounds = (isMuted) =>
  dispatch({
    type: "toggleMuteSounds",
    payload: { isMuted },
  });

export default function init() {
  initStore(reducer, getKey("state") || defaultState);
}
