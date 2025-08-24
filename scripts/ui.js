import { drawItem, id, SPRITES_SRC } from "./items/index.js";
import {
  checkApplyItemToBoard,
  applyItemToBoard,
  removeItemToBoard,
  getLevel,
  getItemUniqIdBelowItem,
} from "./board/index.js";
import { getRandom } from "./utils.js";
import { getCurrentBoard, getItemUniqIds, getMagic } from "./state.js";
import { dispatch } from "./store.js";

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
  const img = new Image();
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

export function setInteractiveBg(item) {
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

export function setInteractive(item, valueLabel, onClick) {
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

export function destroyItem(item) {
  return new Promise((resolve) => {
    const canvas = item.canvas;

    item.x = 32;
    item.y = 112;

    item.deleted = true;

    drawItem(item, 3, null, true);
    canvas.inert = true;

    setTimeout(() => {
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

export const initCatAnimation = (c) => {
  let clock;

  setInteractive(c, "magic");
  setInteractiveBg(c);

  const animate = () => {
    clearTimeout(clock);
    c.x = c.x === 32 ? 48 : 32;
    c.y = c.run ? 192 : 176;

    drawItem(
      c,
      3,
      c.run ? null : c.hover ? "rgba(255, 255, 255, 0.2)" : "#331c1a"
    );

    clock = setTimeout(animate, c.run ? 333 : 1000);
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
    row.forEach((pixelValue, columnIndex) => {
      ctx.fillStyle = colors[pixelValue];
      ctx.fillRect(columnIndex + 2, rowIndex, 1, 1);
    });
  });

  favIcon.href = c.toDataURL();
}

export function speakTo(c1, c2) {
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

export function startGame(levelIndex, specificGameStart) {
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
      cell.className = `brick v${getRandom(3)}`;
    }
  });

  dispatch({
    type: "initGame",
    payload: baseBoard,
  });

  specificGameStart(levelIndex);
}
