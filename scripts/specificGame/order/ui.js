import {
  drawItem,
  getRandomWizardItem,
  getRandomCatItem,
  getCat,
  id,
  setZIndex,
} from "../../items/index.js";
import { rotate, rotateItemToRight, rotateItemToLeft } from "./items.js";
import {
  checkApplyItemToBoard,
  applyItemToBoard,
  removeItemToBoard,
  getRandomCoordinatesOfEmptySpaceAboveFloor,
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
} from "../../state.js";
import { dispatch } from "../../store.js";

import getActions from "./actions.js";
import startTuto from "./tutos.js";
import { putItem, plantGrowth, itemDisappears, meow } from "../../sounds.js";

function addItemInPool(forcedItem) {
  const item = forcedItem || getRandomWizardItem();

  item.canvas = document.createElement("canvas");
  item.canvas.className = "c" + id(item);
  item.canvas.id = "i" + item.uniqId;
  item.canvas.gameItem = item;

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

    prepareItemToDrop(item);

    dispatchEvent(new CustomEvent("item:selected", { detail: item }));
  });
}

async function goBackItemToShop(item) {
  walls.classList.remove("dragging");
  gameTable.onclick = null;
  gameTable.onmousemove = null;
  gameTable.style.cursor = "default";
  actionsMenu.inert = false;

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

function updateActionsState() {
  const magic = getMagic();

  actionsMenu.querySelectorAll("div").forEach((actionDiv) => {
    const cost = +actionDiv.dataset.cost;
    actionDiv.classList.toggle("actionDisabled", magic < cost);
  });
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
    [
      fullPlant,
      (() => {
        switch (driedPlantCanvas.gameItem.rot) {
          case 90:
            return [-1, 0];
          case 180:
            return [0, 0];
          case 270:
            return [0, -1];
          default:
            return [-1, -1];
        }
      })(),
    ],
    [
      mediumPlant,
      (() => {
        switch (driedPlantCanvas.gameItem.rot) {
          case 90:
          case 180:
            return [0, 0];
          case 270:
            return [0, -1];
          default:
            return [-1, -0];
        }
      })(),
    ],
    [smallPlant, [0, 0]],
  ].some(([currentPlant, [baseRowDelta, baseColumnDelta]]) => {
    const rotatedPlant = rotate(currentPlant, driedPlantCanvas.gameItem.rot, 3);
    rotatedPlant.canvas.gameItem = rotatedPlant;
    rotatedPlant.canvas.coor = { ...driedPlantCanvas.coor };
    rotatedPlant.canvas.coor.row += baseRowDelta;
    rotatedPlant.canvas.coor.col += baseColumnDelta;

    const overlaps = checkApplyItemToBoard(
      rotatedPlant,
      boardWithoutDriedPlant,
      rotatedPlant.canvas.coor.col,
      rotatedPlant.canvas.coor.row
    );

    if (overlaps.length) {
      return false;
    }

    newPlant = rotatedPlant;

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

const actionCallbacks = [
  (action, cb) => {
    shop.querySelectorAll("canvas").forEach((canvas) => {
      rotateItemToRight(canvas.gameItem);
    });
    increaseActionCost(action);
    updateActionsState();
    cb();
  },
  (action, cb) => {
    shop.querySelectorAll("canvas").forEach((canvas) => {
      rotateItemToLeft(canvas.gameItem);
    });
    increaseActionCost(action);
    updateActionsState();
    cb();
  },
  (action, cb) => {
    prepareSpellToCast(action, "h", async (domSpellTarget) => {
      if (domSpellTarget.gameItem.isCat) {
        await catRun();
      } else {
        const [newBoard, newPlant] = growPlant(
          domSpellTarget,
          getCurrentBoard()
        );

        plantGrowth();

        setInteractiveBg(newPlant);
        setInteractive(newPlant, "magic");
        setZIndex(newPlant);

        dispatch({
          type: "setBoard",
          payload: newBoard,
        });
      }

      cb();
    });
  },
  (action, cb) => {
    prepareSpellToCast(action, "r", async (spell) => {
      itemDisappears();

      await destroyItem(spell.gameItem);

      await applyGravity();
      cb();
    });
  },
];

const increaseActionCost = (action) => {
  dispatch({
    type: "spendMagic",
    payload: action.value++,
  });
  action.canvas.dataset.cost = Math.min(action.value, 5);
  magicScore.innerHTML = getMagic();
};

function cat() {
  if (cat.c) {
    return cat.c;
  }

  cat.c = initCatAnimation(
    getCat(
      "The master's cat. He's cute, but he's getting in our way a bit here..."
    )
  );

  return cat.c;
}

const addCatItem = () => {
  const item = getRandomCatItem();
  item.desc = "A gift from the cat. It's useless...";

  meow();

  addItemInPool(item);
};

let catRunSince = 0;
const catRun = async () => {
  catRunSince = 1;
  const catItem = cat();
  catItem.run = true;
  catItem.animate();
  catItem.canvas.inert = true;

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
      catItem.canvas.remove();
    });

  await applyGravity();
};

const moveCat = () => {
  const catItem = cat();
  catItem.run = false;
  catRunSince = 0;
  walls.prepend(catItem.canvas);
  catItem.canvas.inert = false;

  const coordinates = getRandomCoordinatesOfEmptySpaceAboveFloor(
    removeItemToBoard(catItem.uniqId, getCurrentBoard())
  );

  if (!coordinates) {
    return;
  }

  catItem.canvas.style.left = `${coordinates.col * 48 + 48}px`;
  catItem.canvas.style.top = `${coordinates.row * 48 + 48}px`;
  catItem.canvas.coor = coordinates;

  meow();

  dispatch({
    type: "setBoard",
    payload: applyItemToBoard(
      catItem,
      removeItemToBoard(catItem.uniqId, getCurrentBoard()),
      coordinates.col,
      coordinates.row
    ),
  });

  return applyGravity();
};

let spellCloneElement;
function followMouse({ clientX, clientY }) {
  spellCloneElement.style.transform = `translate(${clientX + 8}px, ${
    clientY + 8
  }px)`;
}

function prepareSpellToCast(spell, className, cast) {
  let hasBeenCast = false;

  function cancel() {
    document.body.classList.remove(className);
    document.body.removeEventListener("mousemove", followMouse);
    document.body.removeEventListener("click", run);
    spell.canvas.classList.remove("casting");
    spellCloneElement?.remove();
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
      const spellResult = await cast(e.target);

      if (spellResult !== false) {
        cancel();
        increaseActionCost(spell);
        updateActionsState();

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
  spellCloneElement = spell.canvas.cloneNode();
  const { left, top } = spell.canvas.getBoundingClientRect();
  walls.append(spellCloneElement);

  followMouse({ clientX: left, clientY: top });

  document.body.classList.add(className);
  document.body.addEventListener("mousemove", followMouse);
  document.body.addEventListener("click", run);
  spell.canvas.classList.add("casting");

  shop.inert = true;
}

function prepareItemToDrop(item) {
  drawItem(item, 3);
  const itemToDropCanvas = item.canvas;
  item.canvas.style.left = "240px";
  item.canvas.style.top = "240px";
  item.canvas.style.zIndex = 100;
  walls.append(itemToDropCanvas);
  actionsMenu.inert = true;

  let isAllowToDrop = false;

  walls.classList.add("dragging");

  gameTable.onmousemove = (e) => {
    shop.inert = false;

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

    drawItem(item, 3, "rgba(255, 255, 255, 0.2)", false, overlaps);
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

    drawItem(item, 3, "#331c1a");

    item.canvas.onclick = null;
    setZIndex(item);

    setInteractiveBg(item);

    dispatch({
      type: "setBoard",
      payload: applyItemToBoard(item, getCurrentBoard(), col, row),
    });

    putItem();

    await applyGravity();

    updateActionsState();

    item.justDrop = true;

    if (id(item) === 11) {
      Object.defineProperty(item, "value", {
        get() {
          return getSpecificBookMagic(item.uniqId);
        },
      });
    }

    const ce = new CustomEvent("item:dropped", {
      detail: item,
    });
    dispatchEvent(ce);

    let hasAddedItem = false;

    if (catRunSince === 0 || catRunSince >= 3) {
      if (!cat().canvas.parentNode) {
        await moveCat();
      } else {
        const catActions = [moveCat, addCatItem];
        const catAction = catActions[ce.ci ?? getRandom(catActions.length - 1)];
        await catAction();
        hasAddedItem = catAction === addCatItem;
      }
    } else {
      catRunSince++;
    }

    if (!hasAddedItem) {
      addItemInPool();
    }

    if (checkEnd()) {
      endGame(isMagicGoalReached());
    } else {
      shop.inert = false;
      actionsMenu.inert = false;
    }
  };

  shop.onmouseenter = () => {
    shop.onmouseenter = null;
    goBackItemToShop(item);
  };
}

export function startGame(levelIndex) {
  shop.inert = false;
  actionsMenu.inert = false;

  shop.innerHTML = "<span>Reserve</span>";

  addItemInPool();
  addItemInPool();
  addItemInPool();

  actionsMenu.innerHTML = "";

  actionsMenu.append(document.createTextNode("Spells"));
  getActions().forEach((action, index) => {
    const d = document.createElement("div");
    d.dataset.cost = 0;
    action.value = 0;
    d.className = `${action.name} s`;
    actionsMenu.append(d);
    action.canvas = d;

    setInteractive(action, "cost", () => {
      actionCallbacks[index](action, () => {
        action.justDrop = true;
        dispatchEvent(new CustomEvent("spell:casted", { detail: action }));
      });
    });
  });

  startTuto(levelIndex);
}
