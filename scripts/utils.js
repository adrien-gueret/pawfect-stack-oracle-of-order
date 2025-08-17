export function getRandom(x) {
  return Math.floor(Math.random() * (x + 1));
}

export function convert1DIndexInto2DIndex(index, nbrColumnsIn2DArray) {
  return {
    row: Math.floor(index / nbrColumnsIn2DArray),
    col: index % nbrColumnsIn2DArray,
  };
}
