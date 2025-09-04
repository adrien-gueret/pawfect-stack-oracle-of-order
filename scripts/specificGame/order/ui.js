import {
  drawItem,
  getRandomWizardItem,
  getRandomCatItem,
  getCat,
  id,
  setZIndex,
} from "../../items/index.js";
import { rotate } from "./items.js";
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
import { convert1DIndexInto2DIndex } from "../../utils.js";
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

  item[7] = document.createElement("canvas");
  item[7].className = "c" + id(item);
  item[7].id = "i" + item[6];
  item[7].gameItem = item;

  drawItem(item, 2);

  shop.append(item[7]);

  setInteractive(item, "magic", async () => {
    shop.inert = true;

    await item[7].animate(
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

  await item[7].animate(
    [{ transform: "translateY(0)" }, { transform: "translateY(300px)" }],
    {
      duration: 333,
      easing: "ease-in",
    }
  ).finished;

  drawItem(item, 2);

  item[7].style.removeProperty("left");
  item[7].style.removeProperty("top");
  shop.append(item[7]);
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
  const fullPlant = [
    "Carnivorous Plant",
    descStart + " has fully grown and regained all its magic!",
    9,
    [
      [1, 1],
      [0, 1],
    ],
    [0, 96],
    0,
    driedPlantCanvas.gameItem[6],
    document.createElement("canvas"),
  ];

  const mediumPlant = [
    "Carnivorous Plant",
    descStart + " has grown a bit and regained some of its magic.",
    6,
    [[1], [1]],
    [16, 96],
    0,
    driedPlantCanvas.gameItem[6],
    document.createElement("canvas"),
  ];

  const smallPlant = [
    "Carnivorous Plant",
    descStart + " tried to grow but something blocked it...",
    3,
    [[1]],
    [16, 112],
    0,
    driedPlantCanvas.gameItem[6],
    document.createElement("canvas"),
  ];

  const boardWithoutDriedPlant = removeItemToBoard(
    driedPlantCanvas.gameItem[6],
    board
  );

  driedPlantCanvas.dispatchEvent(new MouseEvent("mouseleave"));

  let newPlant;

  [
    [
      fullPlant,
      (() => {
        switch (driedPlantCanvas.gameItem[8]) {
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
        switch (driedPlantCanvas.gameItem[8]) {
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
    const rotatedPlant = rotate(currentPlant, driedPlantCanvas.gameItem[8], 3);
    rotatedPlant[7].gameItem = rotatedPlant;
    rotatedPlant[7].coor = [...driedPlantCanvas.coor];
    rotatedPlant[7].coor[0] += baseRowDelta;
    rotatedPlant[7].coor[1] += baseColumnDelta;

    const overlaps = checkApplyItemToBoard(
      rotatedPlant,
      boardWithoutDriedPlant,
      rotatedPlant[7].coor[1],
      rotatedPlant[7].coor[0]
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
    newPlant[7].coor[1],
    newPlant[7].coor[0]
  );

  driedPlantCanvas.replaceWith(newPlant[7]);
  newPlant[7].id = driedPlantCanvas.id;

  newPlant[7].style.left = `${(newPlant[7].coor[1] + 1) * 48}px`;
  newPlant[7].style.top = `${(newPlant[7].coor[0] + 1) * 48}px`;

  return [newBoard, newPlant];
}

const actionCallbacks = [
  (action, cb) => {
    shop.querySelectorAll("canvas").forEach((canvas) => {
      rotate(canvas.gameItem, 90);
    });
    increaseActionCost(action);
    updateActionsState();
    cb();
  },
  (action, cb) => {
    shop.querySelectorAll("canvas").forEach((canvas) => {
      rotate(canvas.gameItem, 270);
    });
    increaseActionCost(action);
    updateActionsState();
    cb();
  },
  (action, cb) => {
    prepareSpellToCast(action, "h", async (domSpellTarget) => {
      if (domSpellTarget.gameItem[5] === 2) {
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

        dispatch("setBoard", newBoard);
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
  action[2] = action[2] ?? 0;
  dispatch("spendMagic", action[2]++);
  action[7].dataset.cost = Math.min(action[2], 5);
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
  item[1] = "A gift from the cat. It's useless...";

  meow();

  addItemInPool(item);
};

let catRunSince = 0;
const catRun = async () => {
  catRunSince = 1;
  const catItem = cat();
  catItem.run = true;
  catItem.animate();
  catItem[7].inert = true;

  dispatch("setBoard", removeItemToBoard(catItem[6], getCurrentBoard()));

  meow();

  catItem[7]
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
      catItem[7].remove();
    });

  await applyGravity();
};

const moveCat = () => {
  const catItem = cat();
  catItem.run = false;
  catRunSince = 0;
  walls.prepend(catItem[7]);
  catItem[7].inert = false;

  const coordinates = getRandomCoordinatesOfEmptySpaceAboveFloor(
    removeItemToBoard(catItem[6], getCurrentBoard())
  );

  if (!coordinates) {
    return;
  }

  catItem[7].style.left = `${coordinates[1] * 48 + 48}px`;
  catItem[7].style.top = `${coordinates[0] * 48 + 48}px`;
  catItem[7].coor = [...coordinates];

  meow();

  dispatch(
    "setBoard",
    applyItemToBoard(
      catItem,
      removeItemToBoard(catItem[6], getCurrentBoard()),
      coordinates[1],
      coordinates[0]
    )
  );

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
    spell[7].classList.remove("casting");
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
  spellCloneElement = spell[7].cloneNode();
  const { left, top } = spell[7].getBoundingClientRect();
  walls.append(spellCloneElement);

  followMouse({ clientX: left, clientY: top });

  document.body.classList.add(className);
  document.body.addEventListener("mousemove", followMouse);
  document.body.addEventListener("click", run);
  spell[7].classList.add("casting");

  shop.inert = true;
}

function prepareItemToDrop(item) {
  drawItem(item, 3);
  const itemToDropCanvas = item[7];
  itemToDropCanvas.style.left = "240px";
  itemToDropCanvas.style.top = "240px";
  itemToDropCanvas.style.zIndex = 100;
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

    const [row, col] = convert1DIndexInto2DIndex(cellIndex, 10);

    itemToDropCanvas.coor = [row, col];

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

    const [row, col] = convert1DIndexInto2DIndex(cellIndex, 10);

    drawItem(item, 3, "#331c1a");

    item[7].onclick = null;
    setZIndex(item);

    setInteractiveBg(item);

    dispatch("setBoard", applyItemToBoard(item, getCurrentBoard(), col, row));

    putItem();

    await applyGravity();

    updateActionsState();

    item.justDrop = true;

    if (id(item) === 11) {
      Object.defineProperty(item, "2", {
        get() {
          return getSpecificBookMagic(item[6]);
        },
      });
    }

    const ce = new CustomEvent("item:dropped", {
      detail: item,
    });
    dispatchEvent(ce);

    let hasAddedItem = false;

    if (catRunSince === 0 || catRunSince >= 3) {
      if (!cat()[7].parentNode) {
        await moveCat();
      } else {
        const catActions = [moveCat, addCatItem];
        const catAction =
          catActions[ce.ci ?? Math.floor(Math.random() * catActions.length)];
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
      endGame(
        isMagicGoalReached(),
        isMagicGoalReached()
          ? "The cellar is tidy and has enough magic concentration!"
          : "The maximum number of items has been reached, but the magic concentration is not sufficient..."
      );
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
    action[2] = 0;
    d.className = `${action[0]} s`;
    actionsMenu.append(d);
    action[7] = d;

    setInteractive(action, "cost", () => {
      actionCallbacks[index](action, () => {
        action.justDrop = true;
        dispatchEvent(new CustomEvent("spell:casted", { detail: action }));
      });
    });
  });

  startTuto(levelIndex);
}
