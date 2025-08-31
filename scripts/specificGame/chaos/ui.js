import {
  drawItem,
  getRandomWizardItem,
  getRandomCatItem,
  getCat,
  id,
  rotateItemToRight,
  rotateItemToLeft,
  setZIndex,
} from "../../items/index.js";
import {
  checkApplyItemToBoard,
  applyItemToBoard,
  removeItemToBoard,
  getRandomCoordinatesOfEmptySpaceAboveFloor,
  growPlant,
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
      return growthPositions[0];
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

const actionCallbacks = {
  Rotarigus(action, cb) {
    shop.querySelectorAll("canvas").forEach((canvas) => {
      rotateItemToRight(canvas.gameItem);
    });
    increaseActionCost(action);
    cb();
  },
  Rotaleftus(action, cb) {
    shop.querySelectorAll("canvas").forEach((canvas) => {
      rotateItemToLeft(canvas.gameItem);
    });
    increaseActionCost(action);
    cb();
  },
  Hydravo(action, cb) {
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

        dispatch({
          type: "setBoard",
          payload: newBoard,
        });
      }

      cb();
    });
  },
  Ejectum(action, cb) {
    prepareSpellToCast(action, "r", async (spell) => {
      itemDisappears();

      await destroyItem(spell.gameItem);

      await applyGravity();
      cb();
    });
  },
};

const cat = initCatAnimation(
  getCat("That's me! Mia can't place items where I am.")
);

const addCatItem = () => {
  const item = getRandomCatItem();
  item.desc =
    "A gift from me to Mia. It's a bit bulky, but I'm sure she'll love it!";

  addItemInPool(item);
};

let trickCloneElement;
function followMouse({ clientX, clientY }) {
  trickCloneElement.style.transform = `translate(${clientX + 8}px, ${
    clientY + 8
  }px)`;
}

async function placeItem(item, row, col) {
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

  await applyGravity();

  item.justDrop = true;

  if (id(item) === 11) {
    Object.defineProperty(item, "value", {
      get() {
        return getSpecificBookMagic(item.uniqId);
      },
    });
  }

  dispatchEvent(
    new CustomEvent("item:dropped", {
      detail: item,
    })
  );
}

async function placeRandomWizardItem() {
  const item = getRandomWizardItem();
  attachCanvasToItem(item);
  const [row, col] = getBestPositionForItem(item);

  await placeItem(item, row, col);
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

    await placeItem(item, row, col);

    addItemInPool();

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

  placeRandomWizardItem();

  addItemInPool();
  addItemInPool();
  addItemInPool();

  actionsMenu.innerHTML = "";

  actionsMenu.append(document.createTextNode("Tricks"));
  getActions().forEach((action) => {
    const d = document.createElement("div");
    d.className = `${action.name.replaceAll(" ", "")} s`;
    actionsMenu.append(d);
    action.canvas = d;

    setInteractive(action, "", () => {
      actionCallbacks[action.name](action, () => {
        action.justDrop = true;
        dispatchEvent(new CustomEvent("spell:casted", { detail: action }));
      });
    });
  });

  startTuto(levelIndex);
}
