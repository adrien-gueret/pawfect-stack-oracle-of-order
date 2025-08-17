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
];

let lastUniqId = 0;

export function drawItem(item, mult = 3, bg = null) {
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
    for (let row = 0; row < item.shape.length; row++) {
      for (let col = 0; col < item.shape[row].length; col++) {
        if (item.shape[row][col] === 1) {
          if (bg) {
            ctx.fillStyle = bg;
            ctx.fillRect(col * baseMult, row * baseMult, baseMult, baseMult);
          }
          ctx.drawImage(
            img,
            item.x + col * 16,
            item.y + row * 16,
            16,
            16,
            col * baseMult,
            row * baseMult,
            baseMult,
            baseMult
          );
        }
      }
    }
  };
}

export function id(n) {
  return items.findIndex((item) => item.name === n);
}

export function getItem(i) {
  const item = items[i];
  return {
    ...item,
    desc:
      !item.desc && item.fromCat
        ? "A gift from the cat... More cumbersome than useful..."
        : item.desc,
  };
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
  return getRandomItem(items.filter((item) => item.fromCat));
}

export default items;
