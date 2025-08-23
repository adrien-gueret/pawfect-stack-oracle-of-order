import {
  drawItem,
  getRandomWizardItem,
  getRandomCatItem,
  getCat,
  id,
  rotateItemToRight,
  rotateItemToLeft,
  SPRITES_SRC,
  setZIndex,
} from "./items/index.js";
import {
  checkApplyItemToBoard,
  applyItemToBoard,
  removeItemToBoard,
  getLevel,
  getRandomCoordinatesOfEmptySpaceAboveFloor,
  getItemUniqIdBelowItem,
} from "./board/index.js";
import { convert1DIndexInto2DIndex, getRandom } from "./utils.js";
import { getCurrentBoard, getItemUniqIds, getMagic } from "./state.js";
import { dispatch } from "./store.js";

const soundsCheckbox = document.getElementById("soundsCheckbox");
const gameTable = document.getElementById("gameTable");

export function toggleSoundsCheckbox(isChecked) {
  soundsCheckbox.checked = isChecked;
}

export function onSoundsCheckboxChange(callback) {
  soundsCheckbox.onchange = callback;
}

function renderWallsCanvas() {
  wallsCanvas.width = 576;
  wallsCanvas.height = 576;

  const ctx = wallsCanvas.getContext("2d");
  const img = new window.Image();
  img.src = SPRITES_SRC;
  img.onload = () => {
    const sx = 0,
      sy = 80,
      sw = 32,
      sh = 32;
    const scale = 3;
    const dw = sw * scale,
      dh = sh * scale;

    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = dw;
    patternCanvas.height = dh;
    const pctx = patternCanvas.getContext("2d");
    pctx.imageSmoothingEnabled = false;
    pctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

    const pattern = ctx.createPattern(patternCanvas, "repeat");
    ctx.clearRect(0, 0, wallsCanvas.width, wallsCanvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, wallsCanvas.width, wallsCanvas.height);
  };
}

function setInteractiveBg(item) {
  item.canvas.addEventListener("mouseenter", () => {
    if (item.deleted) return;
    item.hover = true;
    drawItem(item, 3, "rgba(255, 255, 255, 0.2)");
  });

  item.canvas.addEventListener("mouseleave", () => {
    if (item.deleted) return;
    item.hover = false;
    drawItem(item, 3, "#331c1a");
  });
}

function setInteractive(item, valueLabel, onClick) {
  item.canvas.onmouseenter = () => {
    if (item.justDrop) {
      return;
    }
    const prev = help.innerHTML;

    help.innerHTML = `<span><b>${item.name}</b>: ${
      item.desc
    } <i>(${valueLabel}: <b>${item.value ?? 0}</b>)</i></span>`;

    item.canvas.onmouseleave = () => {
      if (item.justDrop) {
        delete item.justDrop;
        return;
      }

      help.innerHTML = prev;
    };
  };

  item.canvas.onclick = onClick;
}

function addItemInPool(forcedItem) {
  const item = forcedItem || getRandomWizardItem();

  item.canvas = document.createElement("canvas");
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

    window.dispatchEvent(new CustomEvent("item:selected", { detail: item }));
  });
}

async function goBackItemToShop(item) {
  walls.classList.remove("dragging");
  gameTable.onclick = null;
  gameTable.onmousemove = null;
  gameTable.style.cursor = "default";

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

function destroyItem(item) {
  return new Promise((resolve) => {
    const canvas = item.canvas;

    item.x = 32;
    item.y = 112;

    item.deleted = true;

    drawItem(item, 3, null, true);
    canvas.inert = true;

    window.setTimeout(() => {
      canvas.remove();
      dispatch({
        type: "setBoard",
        payload: removeItemToBoard(item.uniqId, getCurrentBoard()),
      });
      resolve();
    }, 333);
  });
}

async function applyGravity() {
  let atLeastOneItemHasMoved = false;

  do {
    const itemUniqIds = getItemUniqIds();

    atLeastOneItemHasMoved = false;
    await Promise.all(
      itemUniqIds.map(async (itemUniqId) => {
        const canvas = document.getElementById("i" + itemUniqId);
        const { row, col } = canvas.coor;
        const item = canvas.gameItem;

        let isOnFloor = false;
        let rowToCheck = row;

        let newBoard = removeItemToBoard(item.uniqId, getCurrentBoard());

        while (!isOnFloor) {
          rowToCheck++;
          isOnFloor =
            checkApplyItemToBoard(item, newBoard, col, rowToCheck).length > 0;
        }

        const delta = rowToCheck - row - 1;
        const hasCurrentItemMoved = delta > 0;
        atLeastOneItemHasMoved = atLeastOneItemHasMoved || hasCurrentItemMoved;

        const newRow = row + delta;
        canvas.coor = { col, row: newRow };

        dispatch({
          type: "setBoard",
          payload: applyItemToBoard(item, newBoard, col, newRow),
        });

        if (!delta) {
          return;
        }

        const itemUniqIdsBelowMovedItem = getItemUniqIdBelowItem(
          item.uniqId,
          getCurrentBoard()
        );

        await new Promise((resolve) => {
          let currentFallingStep = 0;

          const animateFall = () => {
            currentFallingStep++;

            canvas.style.top =
              Number(canvas.style.top.replace("px", "")) + 48 + "px";

            if (currentFallingStep < delta) {
              setTimeout(animateFall, 300);
            } else {
              if (id(item) === 0) {
                destroyItem(item).then(resolve);
              } else {
                resolve();
              }
            }
          };
          setTimeout(animateFall, 300);
        });

        if (hasCurrentItemMoved) {
          await Promise.all(
            itemUniqIdsBelowMovedItem.map((belowItemUniqId) => {
              const canvas = document.getElementById("i" + belowItemUniqId);
              const item = canvas.gameItem;

              return new Promise((resolve) => {
                if (id(item) === 0) {
                  destroyItem(item).then(resolve);
                } else {
                  resolve();
                }
              });
            })
          );
        }
      })
    );
  } while (atLeastOneItemHasMoved);

  itemScore.innerHTML = getItemUniqIds().length - 1; //-1 'cause we don't count the cat
  magicScore.innerHTML = getMagic();
}

const actionCallbacks = {
  Rotarigus() {
    shop.querySelectorAll("canvas").forEach((canvas) => {
      rotateItemToRight(canvas.gameItem);
    });
  },
  Rotaleftus() {
    shop.querySelectorAll("canvas").forEach((canvas) => {
      rotateItemToLeft(canvas.gameItem);
    });
  },
  Ejectum(action) {
    prepareSpellToCast(action);
  },
};

export function initGameTable(levelIndex, initTuto) {
  const row = `<div></div>`;
  gameTable.innerHTML = row.repeat(100);

  renderWallsCanvas();

  levelDisplayIndex.innerHTML = levelIndex + 1;

  const [baseBoard, items, magic] = getLevel(levelIndex);

  itemScore.innerHTML = 0;
  magicScore.innerHTML = 0;
  itemGoal.innerHTML = items;
  magicGoal.innerHTML = magic;

  baseBoard.flat().forEach((val, index) => {
    if (val === -1) {
      const cell = gameTable.children[index];
      cell.className = `solid v${getRandom(3)}`;
    }
  });

  dispatch({
    type: "setBoard",
    payload: baseBoard,
  });

  addItemInPool();
  addItemInPool();
  addItemInPool();

  let actionInit = false;
  initTuto?.(levelIndex, (label, actions) => {
    if (actionInit) {
      return;
    }
    actionInit = true;
    actionsMenu.append(document.createTextNode(label));
    actions.forEach((action) => {
      const d = document.createElement("div");
      d.style.setProperty("--c", `"${action.value}"`);
      d.className = action.name + " s";
      actionsMenu.append(d);
      action.canvas = d;

      setInteractive(action, "cost", () => {
        actionCallbacks[action.name](action);
      });
    });
  });
}

const cat = (() => {
  const c = getCat();

  setInteractive(c, "magic");
  setInteractiveBg(c);

  window.setInterval(() => {
    c.x = c.x === 32 ? 48 : 32;

    drawItem(c, 3, c.hover ? "rgba(255, 255, 255, 0.2)" : "#331c1a");
  }, 1000);

  return c;
})();

const addCatItem = () => {
  const item = getRandomCatItem();
  addItemInPool(item);
};

const moveCat = () => {
  walls.prepend(cat.canvas);

  dispatch({
    type: "setBoard",
    payload: removeItemToBoard(cat.uniqId, getCurrentBoard()),
  });

  const coordinates = getRandomCoordinatesOfEmptySpaceAboveFloor(
    getCurrentBoard()
  );

  if (!coordinates) {
    return;
  }

  cat.canvas.style.left = `${coordinates.col * 48 + 48}px`;
  cat.canvas.style.top = `${coordinates.row * 48 + 48}px`;
  cat.canvas.coor = coordinates;

  dispatch({
    type: "setBoard",
    payload: applyItemToBoard(
      cat,
      getCurrentBoard(),
      coordinates.col,
      coordinates.row
    ),
  });

  return applyGravity();
};

function prepareSpellToCast(spell) {
  const domElement = spell.canvas.cloneNode();
  const { left, top } = spell.canvas.getBoundingClientRect();
  walls.append(domElement);

  function followMouse({ clientX, clientY }) {
    domElement.style.transform = `translate(${clientX + 8}px, ${
      clientY + 8
    }px)`;
  }

  followMouse({ clientX: left, clientY: top });

  function cancel() {
    document.body.classList.remove("r");
    document.body.removeEventListener("mousemove", followMouse);
    document.body.removeEventListener("click", cast);
    domElement.remove();
  }

  async function cast(e) {
    const { classList, tagName, gameItem } = e.target;
    const isOK = gameItem && tagName === "CANVAS" && !classList.contains("cat");

    if (isOK) {
      cancel();

      await destroyItem(gameItem);
      await applyGravity();

      shop.inert = false;
      actionsMenu.inert = false;
    }
  }

  document.body.classList.add("r");
  document.body.addEventListener("mousemove", followMouse);
  document.body.addEventListener("click", cast);

  shop.inert = true;
  actionsMenu.inert = true;
}

function prepareItemToDrop(item) {
  drawItem(item, 3);
  const itemToDropCanvas = item.canvas;
  item.canvas.style.left = "240px";
  item.canvas.style.top = "240px";
  item.canvas.style.zIndex = 100;
  walls.append(itemToDropCanvas);

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

    await applyGravity();

    item.justDrop = true;

    const ce = new CustomEvent("item:dropped", {
      detail: item,
    });
    window.dispatchEvent(ce);

    let hasAddedItem = false;

    if (process.env.GAME_TYPE === "order") {
      if (!cat.canvas.parentNode) {
        await moveCat();
      } else {
        const catActions = [moveCat, addCatItem];
        const catAction = catActions[ce.ci ?? getRandom(catActions.length - 1)];
        await catAction();
        hasAddedItem = catAction === addCatItem;
      }

      if (!hasAddedItem) {
        addItemInPool();
      }
    }

    shop.inert = false;
  };

  shop.onmouseenter = () => {
    shop.onmouseenter = null;
    goBackItemToShop(item);
  };
}

function renderFavicon(pixels) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext("2d");

  const colors = ["transparent", "#331c1a", "#FEEBC9"];

  pixels.forEach((row, rowIndex) => {
    row.forEach((pixelValue, columnIndex) => {
      ctx.fillStyle = colors[pixelValue];
      ctx.fillRect(columnIndex + 2, rowIndex, 1, 1);
    });
  });

  favIcon.href = c.toDataURL();
}

function speakTo(c1, c2) {
  c1.classList.add("speaking");
  c1.classList.remove("stop");
  c2.classList.add("stop");
  c2.classList.remove("speaking");
}

export async function runScenario(specificGameScenario) {
  const master = document.querySelector("#scenarioScene .scenarioMaster");
  const melusine = document.querySelector("#scenarioScene .scenarioMelusine");
  const cat = document.querySelector("#scenarioScene .scenarioCat");
  const dialog = document.querySelector("#scenarioScene + .scenarioDialog");

  await specificGameScenario(master, melusine, cat, dialog, speakTo);
}

export default async function init(faviconPixels) {
  renderFavicon(faviconPixels);
}
