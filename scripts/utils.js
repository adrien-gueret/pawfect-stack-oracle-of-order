export function getRandom(x) {
  return Math.floor(Math.random() * (x + 1));
}

export function shuffleArray(array) {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i -= 1) {
    const j = getRandom(i);
    const temp = newArray[i];

    newArray[i] = newArray[j];
    newArray[j] = temp;
  }

  return newArray;
}

export function convert1DIndexInto2DIndex(index, nbrColumnsIn2DArray) {
  return {
    row: Math.floor(index / nbrColumnsIn2DArray),
    column: index % nbrColumnsIn2DArray,
  };
}
