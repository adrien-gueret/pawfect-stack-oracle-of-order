import { getKey } from "./save.js";
import initStore, { dispatch, getState } from "./store.js";

const defaultState = {
  muted: true,
  currentBoard: null,
};

export function reducer(state = defaultState, { type, payload }) {
  switch (type) {
    case "setGame":
      return {
        ...state,
        currentBoard: payload,
      };
    default:
      return state;
  }
}

export const getCurrentBoard = () => getState().currentBoard;

export const areSoundMuted = () => getState().muted;

export const toggleMuteSounds = (isMuted) =>
  dispatch({
    type: "toggleMuteSounds",
    payload: { isMuted },
  });

export default function init() {
  initStore(reducer, getKey("state") || defaultState);
}
