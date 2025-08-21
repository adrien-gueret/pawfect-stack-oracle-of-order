import specificGame from "../specificGame/index.js";

const items = [
  {
    name: "Potion",
    desc: "A small object highly concentrated in magic, but fragile.",
    value: 3,
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
    name: "Carnivorous Plant",
    desc: "Oh? By watering the little plant, it grew and regained all its magic!",
    value: 6,
    base: false,
    shape: [
      [1, 1],
      [0, 1],
    ],
    x: 0,
    y: 112,
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
    desc: "Magical books that take up little space.",
    value: 2,
    shape: [[1]],
    x: 0,
    y: 144,
  },
  {
    name: "Grimalkin",
    shape: [[1]],
    base: false,
    isCat: true,
    x: 32,
    y: 176,
  },
];

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
  img.src = "./images/sprites.png";

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
        return [ w - 1 - col,  row ];
      } 
      if (rot === 180) {
        return [ h - 1 - row, w - 1 - col ];
      } 
      if (rot === 270) {
        return [ col, h - 1 - row ];
      }
      return [ row, col ];
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

          const [ srcRow, srcCol ] = getSourceCoords(row, col, rot);

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

function rotate(item, angle) {
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
  drawItem(item, 2);

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

export function getCat() {
  const cat = items.find((item) => item.isCat);
  cat.uniqId = ++lastUniqId;
  cat.desc = specificGame.catDesc;
  cat.canvas = document.createElement("canvas");
  cat.canvas.id = "i" + cat.uniqId;
  cat.canvas.style.zIndex = 1;
  cat.canvas.gameItem = cat;
  return cat;
}

function getRandomItem(fromItems) {
  const randomIndex = Math.floor(Math.random() * fromItems.length);
  return { uniqId: ++lastUniqId, ...fromItems[randomIndex] };
}

export function getRandomWizardItem() {
  return getRandomItem(
    items.filter((item) => !item.fromCat && item.base !== false)
  );
}

export function getRandomCatItem() {
  return {
    ...getRandomItem(items.filter((item) => item.fromCat)),
    desc: specificGame.catItemDesc,
  };
}

export default items;
