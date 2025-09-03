import {
  drawItem,
  getRandomWizardItem,
  getRandomCatItem,
  getCat,
  id,
  setZIndex,
} from "../../items/index.js";
import {
  checkApplyItemToBoard,
  applyItemToBoard,
  removeItemToBoard,
} from "../../board/index.js";
import {
  initCatAnimation,
  applyGravity,
  destroyItem,
  setInteractive,
  setInteractiveBg,
  checkEnd,
  endGame,
  isMagicGoalReached,
} from "../../ui.js";
import { convert1DIndexInto2DIndex, getRandom } from "../../utils.js";
import {
  getCurrentBoard,
  getMagic,
  getSpecificBookMagic,
  getItemUniqIds,
} from "../../state.js";
import { dispatch } from "../../store.js";

import getActions from "./actions.js";
import startTuto from "./tutos.js";
import { putItem, plantGrowth, itemDisappears, meow } from "../../sounds.js";

function checkPushableSates() {
  const itemUniqIds = getItemUniqIds();
  const currentBoard = getCurrentBoard();

  itemUniqIds.forEach((uniqId) => {
    const canvas = document.getElementById("i" + uniqId);
    if (!canvas || !canvas.gameItem) return;

    const item = canvas.gameItem;
    const { row, col } = canvas.coor;

    const tempBoard = removeItemToBoard(uniqId, currentBoard);

    canvas.classList.toggle(
      "not-to-left",
      checkApplyItemToBoard(item, tempBoard, col - 1, row).length !== 0
    );
    canvas.classList.toggle(
      "not-to-right",
      checkApplyItemToBoard(item, tempBoard, col + 1, row).length !== 0
    );
  });
}

const checkGravity = () => applyGravity().then(checkPushableSates);

function getBestPositionForItem(item) {
  const currentBoard = getCurrentBoard();

  const validPositions = [];
  for (let row = 0; row < currentBoard.length; row++) {
    for (let col = 0; col < currentBoard[row].length; col++) {
      const overlaps = checkApplyItemToBoard(item, currentBoard, col, row);
      if (overlaps.length === 0) {
        validPositions.push([row, col]);
      }
    }
  }

  if (validPositions.length === 0) {
    return false;
  }

  if (id(item) === 0) {
    const stablePositions = validPositions.filter(([row, col]) => {
      if (row === currentBoard.length - 1) return true;
      return currentBoard[row + 1][col] !== 0;
    });
    if (stablePositions.length > 0) {
      return stablePositions[0];
    }
  } else if (id(item) === 6) {
    const growthPositions = validPositions.filter(([row, col]) =>
      [
        [row - 1, col - 1],
        [row - 1, col],
        [row, col - 1],
        [row - 1, col],
        [row, col - 1],
      ].some(
        ([r, c]) =>
          r >= 0 &&
          c >= 0 &&
          r < currentBoard.length &&
          c < currentBoard[0].length &&
          currentBoard[r][c] === 0
      )
    );
    if (growthPositions.length > 0) {
      return growthPositions[getRandom(growthPositions.length - 1)];
    }
  }

  if (id(item) === 11) {
    const bookPositions = validPositions.map(([row, col]) => {
      let bookCount = 0;

      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (
            r >= 0 &&
            c >= 0 &&
            r < currentBoard.length &&
            c < currentBoard[0].length
          ) {
            const itemId = currentBoard[r][c];
            if (itemId !== 0) {
              const canvas = document.getElementById("i" + itemId);
              if (canvas && id(canvas.gameItem) === 11) {
                bookCount++;
              }
            }
          }
        }
      }
      return [row, col, bookCount];
    });

    bookPositions.sort((a, b) => b[2] - a[2]);
    if (bookPositions.length > 0) {
      return [bookPositions[0][0], bookPositions[0][1]];
    }
  }

  return validPositions[getRandom(validPositions.length - 1)];
}

function attachCanvasToItem(item) {
  item.canvas = document.createElement("canvas");
  item.canvas.className = "c" + id(item);
  item.canvas.id = "i" + item.uniqId;
  item.canvas.gameItem = item;
}

function addItemInPool() {
  const item = getRandomCatItem();

  item.desc =
    "A gift from me to Mia. It's a bit bulky, but I'm sure she'll love it!";

  attachCanvasToItem(item);

  drawItem(item, 2);

  shop.append(item.canvas);

  setInteractive(item, "magic", async () => {
    shop.inert = true;

    await item.canvas.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-300px)" }],
      {
        duration: 333,
        easing: "ease-in",
      }
    ).finished;

    prepareItemToDrop(item, () => {
      if (!checkEnd()) {
        addItemInPool();
      }
    });

    dispatchEvent(new CustomEvent("item:selected", { detail: item }));
  });
}

async function pushItem(canvas, direction = -1) {
  const item = canvas.gameItem;
  const { row, col } = canvas.coor;

  const newCol = col + direction;

  canvas.coor.col = newCol;
  canvas.style.left = `${(newCol + 1) * 48}px`;

  const currentBoard = getCurrentBoard();
  const boardWithoutItem = removeItemToBoard(item.uniqId, currentBoard);
  dispatch({
    type: "setBoard",
    payload: applyItemToBoard(item, boardWithoutItem, newCol, row),
  });

  putItem();

  await checkGravity();

  return true;
}

async function goBackItemToShop(item) {
  walls.classList.remove("dragging");
  gameTable.onclick = null;
  gameTable.onmousemove = null;
  gameTable.style.cursor = "default";
  actionsMenu.inert = false;
  item.s = false;

  await item.canvas.animate(
    [{ transform: "translateY(0)" }, { transform: "translateY(300px)" }],
    {
      duration: 333,
      easing: "ease-in",
    }
  ).finished;

  drawItem(item, 2);

  item.canvas.style.removeProperty("left");
  item.canvas.style.removeProperty("top");
  shop.append(item.canvas);
}

const actionCallbacks = [
  (action, cb) => {
    prepareItemToDrop(cat(), () => {
      cb();
      document.body.classList.remove("catRunning");
      shop.inert = false;
      catJustMoved = true;
    });
    shop.inert = true;
  },
  (action, cb) => {
    prepareTrick(action, "l", async (canvas) => {
      await pushItem(canvas);
      cb();
    });
  },
  (action, cb) => {
    prepareTrick(action, "r", async (canvas) => {
      await pushItem(canvas, 1);
      cb();
    });
  },
];

function cat() {
  if (cat.c) {
    return cat.c;
  }

  cat.c = initCatAnimation(
    getCat("That's me! Mia can't place items where I am.")
  );

  return cat.c;
}

let trickCloneElement;
function followMouse({ clientX, clientY }) {
  trickCloneElement.style.transform = `translate(${clientX + 8}px, ${
    clientY + 8
  }px)`;
}

async function placeItem(item, row, col, isWizard) {
  item.canvas.onclick = null;
  item.canvas.coor = { row, col };
  item.canvas.style.left = `${(col + 1) * 48}px`;
  item.canvas.style.top = `${(row + 1) * 48}px`;

  drawItem(item, 3, "#331c1a");

  walls.append(item.canvas);

  setZIndex(item);

  setInteractiveBg(item);

  dispatch({
    type: "setBoard",
    payload: applyItemToBoard(item, getCurrentBoard(), col, row),
  });

  putItem();

  await checkGravity();

  item.justDrop = !isWizard;

  if (id(item) === 11) {
    Object.defineProperty(item, "value", {
      get() {
        return getSpecificBookMagic(item.uniqId);
      },
    });
  }

  if (checkEnd()) {
    endGame(
      !isMagicGoalReached(),
      isMagicGoalReached()
        ? "Mia managed to reach her magic goal despite your efforts to stop her..."
        : "You prevented Mia from reaching the required magic concentration, well done!"
    );
    return true;
  }

  return false;
}

async function placeRandomWizardItem() {
  const item = getRandomWizardItem();
  attachCanvasToItem(item);
  const position = getBestPositionForItem(item);

  if (!position) {
    return placeRandomWizardItem();
  }

  setInteractive(item, "magic");

  await placeItem(item, position[0], position[1], true);
}

const hydravoOnCat = async () => {
  const catItem = cat();
  catItem.run = true;
  catItem.animate();
  catItem.canvas.inert = true;
  document.body.classList.add("catRunning");

  dispatch({
    type: "setBoard",
    payload: removeItemToBoard(catItem.uniqId, getCurrentBoard()),
  });

  meow();

  catItem.canvas
    .animate(
      [
        { transform: "translate(0, 0)" },
        { transform: "translate(450px, -100px)" },
      ],
      {
        duration: 1500,
        easing: "ease-in",
      }
    )
    .finished.then(() => {
      catItem.run = false;
      catItem.canvas.inert = false;
      catItem.canvas.remove();
    });

  await checkGravity();
};

async function ejectum() {
  const currentBoard = getCurrentBoard();
  const catItems = [];

  for (let row = 0; row < currentBoard.length; row++) {
    for (let col = 0; col < currentBoard[row].length; col++) {
      const itemId = currentBoard[row][col];
      if (itemId !== 0) {
        const canvas = document.getElementById("i" + itemId);
        if (canvas?.gameItem?.fromCat) {
          catItems.push(canvas.gameItem);
        }
      }
    }
  }

  if (catItems.length === 0) {
    return false;
  }

  const itemToRemove = catItems[getRandom(catItems.length - 1)];

  await destroyItem(itemToRemove);
  itemDisappears();
  await checkGravity();

  return true;
}

function growPlant(driedPlantCanvas, board) {
  const descStart = "By watering the dried plant, it";
  let fullPlant = {
    uniqId: driedPlantCanvas.gameItem.uniqId,
    name: "Carnivorous Plant",
    desc: descStart + " has fully grown and regained all its magic!",
    value: 9,
    canvas: document.createElement("canvas"),
    shape: [
      [1, 1],
      [0, 1],
    ],
    x: 0,
    y: 96,
  };

  let mediumPlant = {
    ...fullPlant,
    desc: descStart + " has grown a bit and regained some of its magic.",
    value: 6,
    canvas: document.createElement("canvas"),
    shape: [[1], [1]],
    x: 16,
    y: 96,
  };

  let smallPlant = {
    ...fullPlant,
    desc: descStart + " tried to grow but something blocked it...",
    value: 3,
    canvas: document.createElement("canvas"),
    shape: [[1]],
    x: 16,
    y: 112,
  };

  const boardWithoutDriedPlant = removeItemToBoard(
    driedPlantCanvas.gameItem.uniqId,
    board
  );

  driedPlantCanvas.dispatchEvent(new MouseEvent("mouseleave"));

  let newPlant;

  [
    [fullPlant, [-1, -1]],
    [mediumPlant, [-1, -0]],
    [smallPlant, [0, 0]],
  ].some(([currentPlant, [baseRowDelta, baseColumnDelta]]) => {
    currentPlant.canvas.coor = { ...driedPlantCanvas.coor };
    currentPlant.canvas.coor.row += baseRowDelta;
    currentPlant.canvas.coor.col += baseColumnDelta;

    const overlaps = checkApplyItemToBoard(
      currentPlant,
      boardWithoutDriedPlant,
      currentPlant.canvas.coor.col,
      currentPlant.canvas.coor.row
    );

    if (overlaps.length) {
      return false;
    }

    newPlant = currentPlant;

    return true;
  });

  const newBoard = applyItemToBoard(
    newPlant,
    boardWithoutDriedPlant,
    newPlant.canvas.coor.col,
    newPlant.canvas.coor.row
  );

  driedPlantCanvas.replaceWith(newPlant.canvas);
  newPlant.canvas.id = driedPlantCanvas.id;

  newPlant.canvas.style.left = `${(newPlant.canvas.coor.col + 1) * 48}px`;
  newPlant.canvas.style.top = `${(newPlant.canvas.coor.row + 1) * 48}px`;

  return [newBoard, newPlant];
}

const hydravoOnPlant = async () => {
  const currentBoard = getCurrentBoard();
  const driedPlants = [];

  for (let row = 0; row < currentBoard.length; row++) {
    for (let col = 0; col < currentBoard[row].length; col++) {
      const itemId = currentBoard[row][col];
      if (itemId > 0) {
        const canvas = document.getElementById("i" + itemId);
        if (canvas && id(canvas.gameItem) === 6) {
          driedPlants.push(canvas);
        }
      }
    }
  }

  if (driedPlants.length === 0) {
    return false;
  }

  const randomPlant = driedPlants[getRandom(driedPlants.length - 1)];

  const [newBoard, newPlant] = growPlant(randomPlant, currentBoard);
  plantGrowth();

  setInteractiveBg(newPlant);
  setInteractive(newPlant, "magic");
  setZIndex(newPlant);

  dispatch({
    type: "setBoard",
    payload: newBoard,
  });

  magicScore.innerHTML = getMagic();

  return true;
};

let catJustMoved = false;

async function nextWizardAction(forcedActionIndex) {
  const wizardActions = [
    placeRandomWizardItem,
    catJustMoved ? hydravoOnPlant : hydravoOnCat,
    ejectum,
    hydravoOnPlant,
    placeRandomWizardItem,
    placeRandomWizardItem,
  ];
  const wizardAction =
    wizardActions[forcedActionIndex ?? getRandom(wizardActions.length - 1)];

  const results = await wizardAction();

  catJustMoved = false;

  if (results === false) {
    return placeRandomWizardItem();
  }
}

function prepareTrick(trick, className, cast) {
  let hasBeenCast = false;

  function cancel() {
    document.body.classList.remove(className);
    document.body.removeEventListener("mousemove", followMouse);
    document.body.removeEventListener("click", run);
    trick.canvas.classList.remove("casting");
    trickCloneElement?.remove();
  }

  async function run(e) {
    if (!document.body.classList.contains(className) || hasBeenCast) {
      return;
    }

    hasBeenCast = true;

    const { tagName } = e.target;
    const gameItem = e.target.gameItem;
    const isOK = gameItem && tagName === "CANVAS";

    if (isOK) {
      const trickResult = await cast(e.target);

      if (trickResult !== false) {
        cancel();
        shop.inert = false;
        return;
      }
    }

    hasBeenCast = false;
  }

  if (document.body.classList.contains(className)) {
    cancel();
    shop.inert = false;
    return;
  }
  trickCloneElement = trick.canvas.cloneNode();
  const { left, top } = trick.canvas.getBoundingClientRect();
  walls.append(trickCloneElement);

  followMouse({ clientX: left, clientY: top });

  document.body.classList.add(className);
  document.body.addEventListener("mousemove", followMouse);
  document.body.addEventListener("click", run);
  trick.canvas.classList.add("casting");

  shop.inert = true;
}

function prepareItemToDrop(item, cb) {
  drawItem(item, 3);
  const itemToDropCanvas = item.canvas;
  item.canvas.style.left = "240px";
  item.canvas.style.top = "240px";
  item.canvas.style.zIndex = 100;
  walls.append(itemToDropCanvas);
  actionsMenu.inert = true;
  item.s = true;

  let isAllowToDrop = false;

  walls.classList.add("dragging");

  gameTable.onmousemove = (e) => {
    shop.inert = item.isCat;

    const cellIndex = Array.prototype.indexOf.call(
      e.target.parentNode.children,
      e.target
    );

    const gameRect = gameTable.getBoundingClientRect();
    const cellRect = e.target.getBoundingClientRect();

    const prevLeft = itemToDropCanvas.style.left;
    const prevTop = itemToDropCanvas.style.top;
    itemToDropCanvas.style.left = `${cellRect.left - gameRect.left + 48}px`;
    itemToDropCanvas.style.top = `${cellRect.top - gameRect.top + 48}px`;

    if (
      prevLeft === itemToDropCanvas.style.left &&
      prevTop === itemToDropCanvas.style.top
    ) {
      return;
    }

    const { row, col } = convert1DIndexInto2DIndex(cellIndex, 10);

    itemToDropCanvas.coor = { row, col };

    const ctx = itemToDropCanvas.getContext("2d");
    ctx.clearRect(0, 0, itemToDropCanvas.width, itemToDropCanvas.height);

    const overlaps = checkApplyItemToBoard(item, getCurrentBoard(), col, row);

    isAllowToDrop = overlaps.length === 0;

    if (isAllowToDrop) {
      gameTable.style.cursor = "grabbing";
    } else {
      gameTable.style.cursor = "not-allowed";
    }

    drawItem(item, 3, "#fff3", false, overlaps);
  };

  gameTable.onclick = async (e) => {
    if (!isAllowToDrop) {
      return;
    }

    shop.inert = true;

    walls.classList.remove("dragging");
    shop.onmouseenter = null;
    gameTable.onclick = null;
    gameTable.onmousemove = null;
    gameTable.style.cursor = "default";

    const cellIndex = Array.prototype.indexOf.call(
      e.target.parentNode.children,
      e.target
    );

    const { row, col } = convert1DIndexInto2DIndex(cellIndex, 10);

    item.s = false;

    const isEnd = await placeItem(item, row, col);

    cb?.();

    if (!isEnd) {
      shop.inert = false;
      actionsMenu.inert = false;

      const ce = new CustomEvent("item:dropped", { detail: item });
      dispatchEvent(ce);
      nextWizardAction(ce.ci);
    }
  };

  shop.onmouseenter = item.isCat
    ? null
    : () => {
        shop.onmouseenter = null;
        goBackItemToShop(item);
      };
}

export function startGame(levelIndex) {
  shop.inert = false;
  actionsMenu.inert = false;

  shop.innerHTML = "<span>Reserve</span>";

  placeRandomWizardItem();

  addItemInPool();
  addItemInPool();
  addItemInPool();

  actionsMenu.innerHTML = "";

  actionsMenu.append(document.createTextNode("Tricks"));
  getActions().forEach((action, index) => {
    const d = document.createElement("div");
    d.className = `${action[0].replaceAll(" ", "")} s`;
    actionsMenu.append(d);
    action.canvas = d;

    setInteractive(action, "", () => {
      actionCallbacks[index](action, () => {
        action.justDrop = true;
      });
    });
  });

  startTuto(levelIndex);
}
