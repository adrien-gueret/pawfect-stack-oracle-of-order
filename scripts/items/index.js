const items = [
  {
    name: "Potion",
    desc: "A small object highly concentrated in magic, but fragile.",
    value: 4,
    shape: [[1]],
    x: 32,
    y: 0,
  },
  {
    name: "Cauldron",
    desc: "The classic tool in any wizard's kit.",
    value: 6,
    shape: [
      [1, 1],
      [1, 1],
    ],
    x: 16,
    y: 16,
  },
  {
    name: "Candle",
    desc: "Low in magic concentration, this candle takes up little space.",
    value: 3,
    shape: [[1], [1]],
    x: 48,
    y: 0,
  },
  {
    name: "Dead Fish",
    fromCat: true,
    shape: [
      [1, 1],
      [1, 0],
    ],
    x: 0,
    y: 0,
  },
  {
    name: "Hat",
    desc: "An old hat still highly concentrated in magic.",
    value: 5,
    shape: [
      [0, 1],
      [1, 1],
    ],
    x: 32,
    y: 32,
  },
  {
    name: "Broom",
    desc: "Perfect for wizards on the move, this magic broom is very bulky.",
    value: 7,
    shape: [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    x: 32,
    y: 80,
  },
  {
    name: "Dried Plant",
    desc: "This thirsty plant has lost much of its magic.",
    value: 1,
    shape: [[1]],
    x: 0,
    y: 128,
  },
  {
    name: "Dead Mouse",
    fromCat: true,
    shape: [[1, 1]],
    x: 0,
    y: 48,
  },
  {
    name: "Magic Wand",
    desc: "A very powerful magical tool... and bulky!",
    value: 6,
    shape: [[1, 1, 1, 1]],
    x: 0,
    y: 64,
  },
  {
    name: "Ball of Wool",
    fromCat: true,
    shape: [[1]],
    x: 32,
    y: 128,
  },
  {
    name: "Dead Snake",
    fromCat: true,
    shape: [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    x: 32,
    y: 128,
  },
  {
    name: "Grimoires",
    desc: "If you put them next to other grimoires, their magic increases.",
    value: 2,
    shape: [[1]],
    x: 0,
    y: 144,
  },
  {
    name: "Grimalkin",
    shape: [[1]],
    isCat: true,
    x: 32,
    y: 176,
  },
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
  const { canvas } = item;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = SPRITES_SRC;

  const baseMult = mult * 16;

  const itemWidth = item.shape[0].length * baseMult;
  const itemHeight = item.shape.length * baseMult;

  if (itemWidth !== canvas.width && itemHeight !== canvas.height) {
    canvas.width = itemWidth;
    canvas.height = itemHeight;
  }

  img.onload = () => {
    ctx.imageSmoothingEnabled = false;

    const rot = (item.rot ?? 0) % 360;
    const shape = item.shape;
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
              (overlapCoor) =>
                overlapCoor.col === col && overlapCoor.row === row
            )
          ) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
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
            item.x + (justFirstTile ? 0 : srcCol * 16),
            item.y + (justFirstTile ? 0 : srcRow * 16),
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

export function rotate(item, angle = 0, drawScale = 2) {
  const currentRotate = item.rot ?? 0;
  item.rot = (currentRotate + angle) % 360;

  let newShape = item.shape;
  const times = angle / 90;
  for (let t = 0; t < times; t++) {
    const numRows = newShape.length;
    const numCols = newShape[0].length;
    const rotated = [];
    for (let col = 0; col < numCols; col++) {
      const newRow = [];
      for (let row = numRows - 1; row >= 0; row--) {
        newRow.push(newShape[row][col]);
      }
      rotated.push(newRow);
    }
    newShape = rotated;
  }
  item.shape = newShape;

  item.canvas.width = item.canvas.width;
  drawItem(item, drawScale);

  return item;
}

export function rotateItemToRight(item) {
  return rotate(item, 90);
}

export function rotateItemToLeft(item) {
  return rotate(item, 270);
}

export function id(n) {
  return items.findIndex((item) => item.name === n.name);
}

export function setZIndex(item) {
  const area = item.shape.reduce(
    (acc, row) => acc + row.reduce((rAcc, col) => rAcc + col, 0),
    0
  );
  item.canvas.style.zIndex = Math.max(1, 10 - area);
}

export function getCat(desc) {
  const cat = items.find((item) => item.isCat);
  cat.uniqId = ++lastUniqId;
  cat.desc = desc;
  cat.canvas = document.createElement("canvas");
  cat.canvas.id = "i" + cat.uniqId;
  cat.canvas.className = "cat";
  cat.canvas.style.zIndex = 1;
  cat.canvas.gameItem = cat;
  setZIndex(cat);
  return cat;
}

function getRandomItem(fromItems) {
  const randomIndex = Math.floor(Math.random() * fromItems.length);
  return { uniqId: ++lastUniqId, ...fromItems[randomIndex] };
}

export function getRandomWizardItem() {
  return getRandomItem(items.filter((item) => !item.fromCat && !item.isCat));
}

export function getRandomCatItem() {
  return {
    ...getRandomItem(items.filter((item) => item.fromCat)),
  };
}

export default items;
