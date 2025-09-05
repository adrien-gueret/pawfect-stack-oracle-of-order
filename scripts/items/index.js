/*
  0: NAME
  1: DESCRIPTION
  2: MAGIC VALUE
  3: SHAPE
  4: SPRITESHEET POSITION
  5: 0: Wizard Item, 1: Cat Item, 2: Cat itself
  6: UNIQ ID
  7: CANVAS
  8: ROTATION
  9: COORDINATES IN BOARD
*/

const items = [
  [
    "Potion",
    "A small object highly concentrated in magic, but fragile.",
    4,
    [[1]],
    [32, 0],
    0,
  ],
  [
    "Cauldron",
    "The classic tool in any wizard's kit.",
    6,
    [
      [1, 1],
      [1, 1],
    ],
    [16, 16],
    0,
  ],
  [
    "Candle",
    "A source of light and warmth, often used in magical rituals.",
    3,
    [[1], [1]],
    [48, 0],
    0,
  ],
  [
    "Dead Fish",
    "",
    0,
    [
      [1, 1],
      [1, 0],
    ],
    [0, 0],
    1,
  ],
  [
    "Hat",
    "An old hat still highly concentrated in magic.",
    5,
    [
      [0, 1],
      [1, 1],
    ],
    [32, 32],
    0,
  ],
  [
    "Broom",
    "Perfect for wizards on the move, this magic broom is very bulky.",
    7,
    [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    [32, 80],
    0,
  ],
  [
    "Dried Plant",
    "This thirsty plant needs water and has lost much of its magic.",
    1,
    [[1]],
    [0, 112],
    0,
  ],
  ["Dead Mouse", "", 0, [[1, 1]], [0, 48], 1],
  [
    "Magic Wand",
    "A very powerful magical tool... and bulky!",
    6,
    [[1, 1, 1, 1]],
    [0, 64],
    0,
  ],
  ["Ball of Wool", "", 0, [[1]], [32, 128], 1],
  [
    "Dead Snake",
    "",
    0,
    [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    [32, 128],
    1,
  ],
  [
    "Grimoires",
    "If they're put next to other grimoires, their magic increases.",
    2,
    [[1]],
    [0, 128],
    0,
  ],
  ["Grimalkin", "", 0, [[1]], [32, 176], 2],
];

export const SPRITES_SRC = "./images/sprites.png";

let lastUniqId = 0;

export function drawItem(
  item,
  mult = 3,
  bg = null,
  justFirstTile = false,
  overlaps = []
) {
  const baseMult = mult * 16;

  const canvas = item[7];
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = SPRITES_SRC;

  const itemWidth = item[3][0].length * baseMult;
  const itemHeight = item[3].length * baseMult;

  if (itemWidth !== canvas.width && itemHeight !== canvas.height) {
    canvas.width = itemWidth;
    canvas.height = itemHeight;
  }

  img.onload = () => {
    ctx.imageSmoothingEnabled = false;

    const rot = (item[8] ?? 0) % 360;
    const shape = item[3];
    const h = shape.length;
    const w = shape[0].length;

    function getSourceCoords(row, col, rot) {
      if (rot === 90) {
        return [w - 1 - col, row];
      }
      if (rot === 180) {
        return [h - 1 - row, w - 1 - col];
      }
      if (rot === 270) {
        return [col, h - 1 - row];
      }
      return [row, col];
    }
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (shape[row][col] === 1) {
          const destX = col * baseMult;
          const destY = row * baseMult;
          ctx.clearRect(destX, destY, baseMult, baseMult);

          if (
            overlaps.find(
              (overlapCoor) => overlapCoor[1] === col && overlapCoor[0] === row
            )
          ) {
            ctx.fillStyle = "#ff000099";
            ctx.fillRect(destX, destY, baseMult, baseMult);
          } else if (bg) {
            ctx.fillStyle = bg;
            ctx.fillRect(destX, destY, baseMult, baseMult);
          }

          const [srcRow, srcCol] = getSourceCoords(row, col, rot);

          ctx.save();

          ctx.translate(destX + baseMult / 2, destY + baseMult / 2);
          ctx.rotate((rot * Math.PI) / 180);

          ctx.drawImage(
            img,
            item[4][0] + (justFirstTile ? 0 : srcCol * 16),
            item[4][1] + (justFirstTile ? 0 : srcRow * 16),
            16,
            16,
            -baseMult / 2,
            -baseMult / 2,
            baseMult,
            baseMult
          );
          ctx.restore();
        }
      }
    }
  };
}

export function id(n) {
  return n && items.findIndex((item) => item[0] === n[0]);
}

export function setZIndex(item) {
  const area = item[3].reduce(
    (acc, row) => acc + row.reduce((rAcc, col) => rAcc + col, 0),
    0
  );
  item[7].style.zIndex = Math.max(1, 10 - area);
}

export function getCat(desc) {
  const cat = [...items.find((item) => item[5] === 2)];
  cat[6] = ++lastUniqId;
  cat[1] = desc;
  cat[7] = document.createElement("canvas");
  cat[7].id = "i" + cat[6];
  cat[7].className = "cat";
  cat[7].style.zIndex = 1;
  cat[7].gameItem = cat;
  setZIndex(cat);
  return cat;
}

function getRandomItem(fromItems) {
  const randomIndex = Math.floor(Math.random() * fromItems.length);

  const item = [...fromItems[randomIndex]];
  item[6] = ++lastUniqId;

  return item;
}

export function getRandomWizardItem() {
  return getRandomItem(items.filter((item) => item[5] === 0));
}

export function getRandomSpecialWizardItem() {
  return getRandomItem([
    items[0],
    items[0],
    items[0],
    items[6],
    items[6],
    items[11],
  ]);
}

export function getRandomCatItem() {
  return {
    ...getRandomItem(items.filter((item) => item[5] === 1)),
  };
}

export function getItemFromUniqId(uniqId) {
  const canvas = document.getElementById("i" + uniqId);
  return canvas?.gameItem;
}

export default items;
