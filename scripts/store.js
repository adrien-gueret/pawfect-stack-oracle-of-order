import { storeKey } from "./save.js";

let state = {};
let reducer;

export const getState = () => state;
export const setState = (newState) => {
  state = newState;
  storeKey("state", state);
};

export const dispatch = (type, payload) =>
  setState(reducer(state, type, payload));

export default function init(defaultReducer, defaultState) {
  reducer = defaultReducer;
  state = defaultState;
}
