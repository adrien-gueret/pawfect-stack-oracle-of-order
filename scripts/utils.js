export function convert1DIndexInto2DIndex(index, nbrColumnsIn2DArray) {
  return [Math.floor(index / nbrColumnsIn2DArray), index % nbrColumnsIn2DArray];
}
