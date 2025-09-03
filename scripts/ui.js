import { drawItem, id, SPRITES_SRC } from "./items/index.js";
import {
  checkApplyItemToBoard,
  applyItemToBoard,
  removeItemToBoard,
  getLevel,
  getItemUniqIdBelowItem,
} from "./board/index.js";

import {
  getCurrentBoard,
  getItemUniqIds,
  getMagic,
  getTotalItems,
  areSoundMuted,
} from "./state.js";
import { dispatch } from "./store.js";
import { levelWin, levelLost, potionBroken, toggleSounds } from "./sounds.js";
import { goToSection } from "./sections.js";

function renderWallsCanvas() {
  [...walls.querySelectorAll("canvas")].forEach((c) => {
    if (c !== wallsCanvas) {
      c.remove();
    }
  });

  wallsCanvas.width = 576;
  wallsCanvas.height = 576;

  const ctx = wallsCanvas.getContext("2d");
  const img = new Image();
  img.src = SPRITES_SRC;
  img.onload = () => {
    const sx = 0,
      sy = 80,
      sw = 32,
      sh = 16;
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

export function setInteractiveBg(item) {
  item.canvas.addEventListener("mouseenter", () => {
    if (item.deleted) return;
    item.hover = true;
    drawItem(item, 3, "#fff3");
  });

  item.canvas.addEventListener("mouseleave", () => {
    if (item.deleted) return;
    item.hover = false;
    drawItem(item, 3, "#331c1a");
  });
}

export function setInteractive(item, valueLabel, onClick) {
  item.canvas.onmouseenter = () => {
    if (item.justDrop) {
      return;
    }
    const prev = helpContainer.innerHTML;
    const itemName = item.name || item[0];
    const itemDesc = item.desc || item[1];

    helpContainer.innerHTML = `<span><b>${itemName}</b>: ${itemDesc} ${
      valueLabel ? `<i>(${valueLabel}: <b>${item.value ?? 0}</b>)</i>` : ""
    }</span>`;

    item.canvas.onmouseleave = () => {
      if (item.justDrop) {
        delete item.justDrop;
        return;
      }

      helpContainer.innerHTML = prev;
    };
  };

  item.canvas.onclick = onClick;
}

export function destroyItem(item) {
  return new Promise((resolve) => {
    const canvas = item.canvas;

    item.x = 32;
    item.y = 112;

    item.deleted = true;

    drawItem(item, 3, null, true);
    canvas.inert = true;
    canvas.onmouseleave = null;

    setTimeout(() => {
      canvas.dispatchEvent(new MouseEvent("mouseleave"));
      canvas.remove();
      dispatch({
        type: "setBoard",
        payload: removeItemToBoard(item.uniqId, getCurrentBoard()),
      });
      resolve();
    }, 333);
  });
}

export async function applyGravity() {
  let atLeastOneItemHasMoved = false;

  do {
    const itemUniqIds = getItemUniqIds();

    atLeastOneItemHasMoved = false;
    await Promise.all(
      itemUniqIds.map(async (itemUniqId) => {
        const canvas = document.getElementById("i" + itemUniqId);
        const [row, col] = canvas.coor;
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
        canvas.coor = [newRow, col];

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
                potionBroken();
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
                  potionBroken();
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

  itemScore.innerHTML = getTotalItems();
  magicScore.innerHTML = getMagic();
}

export const initCatAnimation = (c) => {
  let clock;

  setInteractive(c);
  setInteractiveBg(c);

  const animate = () => {
    clearTimeout(clock);
    c.x = c.x === 32 ? 48 : 32;
    c.y = c.run ? 192 : 176;

    clock = setTimeout(animate, c.run ? 333 : 1000);

    if (c.s) {
      return;
    }

    drawItem(c, 3, c.run ? null : c.hover ? "#fff3" : "#331c1a");
  };

  animate();

  c.animate = animate;

  return c;
};

function renderFavicon(pixels) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext("2d");

  const colors = ["transparent", "#331c1a", "#FEEBC9"];

  pixels.forEach((row, rowIndex) => {
    row.split("").forEach((pixelValue, columnIndex) => {
      ctx.fillStyle = colors[pixelValue];
      ctx.fillRect(columnIndex + 2, rowIndex, 1, 1);
    });
  });

  favIcon.href = c.toDataURL();
}

export function speakTo(c1, c2) {
  c1.classList.add("speaking");
  c1.classList.remove("iddlePause");
  c2.classList.add("iddlePause");
  c2.classList.remove("speaking");
}

export async function runScenario(specificGameScenario, end) {
  if (end) {
    skipLink.remove();
  }

  await specificGameScenario(
    document.querySelector("#scenarioScene + .scenarioDialog"),
    speakTo,
    end
  );
}

let maxItems = 0;
let minMagic = 0;

export function checkEnd() {
  return getTotalItems() >= maxItems;
}

export function isMagicGoalReached() {
  return getMagic() >= minMagic;
}

let currentLevelIndex = null;
let currentSpecificGameStart = null;

export const endGame = (hasWon, description) => {
  endTitle.innerHTML = hasWon ? "Congratulations!" : "Oops...";
  endDescription.innerHTML = description;
  endButtonNext.innerHTML = hasWon ? "Next" : "Retry";

  const nextLevelIndex = currentLevelIndex + 1;

  if (hasWon) {
    dispatch({
      type: "setFinishedLevelCount",
      payload: nextLevelIndex,
    });
  }

  endButtonNext.onclick = () =>
    startGame(
      hasWon ? nextLevelIndex : currentLevelIndex,
      currentSpecificGameStart
    );

  gameEnd.classList.add("v");

  hasWon ? levelWin() : levelLost();
};

export function startGame(levelIndex, specificGameStart) {
  currentLevelIndex = levelIndex;
  currentSpecificGameStart = specificGameStart;

  gameEnd.classList.remove("v");

  const row = `<div></div>`;
  gameTable.innerHTML = row.repeat(100);

  renderWallsCanvas();

  levelDisplayIndex.innerHTML = levelIndex + 1;

  const [baseBoard, items, magic] = getLevel(levelIndex);

  if (!baseBoard) {
    goToSection("scenarioSection", { end: true });
    return;
  }

  itemScore.innerHTML = 0;
  magicScore.innerHTML = 0;
  itemGoal.innerHTML = items;
  magicGoal.innerHTML = magic;

  maxItems = items;
  minMagic = magic;

  baseBoard.flat().forEach((val, index) => {
    if (val === -1) {
      const cell = gameTable.children[index];
      cell.className = `brick v${Math.floor(Math.random() * 2)}`;
    }
  });

  dispatch({
    type: "initGame",
    payload: baseBoard,
  });

  specificGameStart(levelIndex);
}

function toggleSoundsCheckbox(isChecked) {
  soundsCheckbox.checked = isChecked;
}

export default function init(faviconPixels) {
  renderFavicon(faviconPixels);

  toggleSoundsCheckbox(!areSoundMuted());

  soundsCheckbox.onchange = (e) => {
    const isChecked = e.currentTarget.checked;
    toggleSounds(!isChecked);
    toggleSoundsCheckbox(isChecked);
  };

  resetSave.onclick = (e) => {
    if (confirm("Are you sure you want to reset the game save?")) {
      dispatch({
        type: "setFinishedLevelCount",
        payload: 0,
      });
    } else {
      e.preventDefault();
    }
  };
}
