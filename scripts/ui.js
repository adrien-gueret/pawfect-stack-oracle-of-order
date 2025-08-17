import { drawItem, getRandomWizardItem } from "./items/index.js";
import { checkApplyItemToBoard, startGame } from "./board/index.js";
import { convert1DIndexInto2DIndex, getRandom } from "./utils.js";
import { getCurrentBoard } from "./state.js";
import { dispatch } from "./store.js";

const soundsCheckbox = document.getElementById("soundsCheckbox");
const gameTable = document.getElementById("gameTable");
const wallsCanvas = document.getElementById("wallsCanvas");

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
  img.src = "./images/sprites.png";
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
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, wallsCanvas.width, wallsCanvas.height);
    ctx.restore();
  };
}

function addItemInPool() {
  const item = getRandomWizardItem();

  item.canvas = document.createElement("canvas");

  drawItem(item, 2);

  items.append(item.canvas);

  item.canvas.onmouseenter = () => {
    const prev = help.innerHTML;

    help.innerHTML = `<span><b>${item.name}</b>: ${item.desc} <i>(magic: <b>${
      item.value ?? 0
    }</b>)</i></span>`;

    item.canvas.onmouseleave = () => {
      help.innerHTML = prev;
    };

    item.canvas.onclick = async () => {
      item.canvas.onmouseleave = null;
      items.inert = true;
      const event = new CustomEvent("item:selected", { detail: item });
      window.dispatchEvent(event);

      await item.canvas.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-300px)" }],
        {
          duration: 333,
          easing: "ease-in",
        }
      ).finished;

      prepareItemToDrop(item);
    };
  };
}

export function initGameTable(levelIndex, initTuto) {
  const row = `<div></div>`;
  gameTable.innerHTML = row.repeat(100);

  renderWallsCanvas();

  const baseBoard = startGame(levelIndex);

  baseBoard.flat().forEach((val, index) => {
    if (val === -1) {
      const cell = gameTable.children[index];
      cell.className = `solid v${getRandom(3)}`;
    }
  });

  dispatch({
    type: "setGame",
    payload: baseBoard,
  });

  addItemInPool();
  addItemInPool();
  addItemInPool();

  initTuto?.();
}

function prepareItemToDrop(item) {
  drawItem(item, 3);
  const itemToDropCanvas = item.canvas;
  itemToDropCanvas.className = "draggedItem";
  item.canvas.style.left = "240px";
  item.canvas.style.top = "240px";
  walls.append(itemToDropCanvas);
  itemToDropCanvas.style.removeProperty("transform");

  let isAllowToDrop = false;

  gameTable.onmousemove = (e) => {
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

    const { row, column } = convert1DIndexInto2DIndex(cellIndex, 10);

    const ctx = itemToDropCanvas.getContext("2d");
    ctx.clearRect(0, 0, itemToDropCanvas.width, itemToDropCanvas.height);

    const overlaps = checkApplyItemToBoard(
      item,
      getCurrentBoard(),
      column,
      row
    );

    isAllowToDrop = overlaps.length === 0;

    if (isAllowToDrop) {
      gameTable.style.cursor = "grabbing";
    } else {
      gameTable.style.cursor = "not-allowed";
      overlaps.forEach(({ row, col }) => {
        ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
        ctx.fillRect(col * 48, row * 48, 48, 48);
      });
    }

    drawItem(item, 3, "rgba(255, 255, 255, 0.2)");
  };

  gameTable.onclick = (e) => {
    if (!isAllowToDrop) {
      return;
    }

    gameTable.onclick = null;
    gameTable.onmousemove = null;
    gameTable.style.cursor = "default";

    const cellIndex = Array.prototype.indexOf.call(
      e.target.parentNode.children,
      e.target
    );

    const { row, column } = convert1DIndexInto2DIndex(cellIndex, 10);

    let isOnFloor = false;
    let rowToCheck = row - 1;

    while (!isOnFloor) {
      rowToCheck++;
      const overlaps = checkApplyItemToBoard(
        item,
        getCurrentBoard(),
        column,
        rowToCheck
      );

      isOnFloor = overlaps.length > 0;
    }

    const delta = rowToCheck - row - 1;

    if (delta) {
      let currentFallingStep = 0;

      const animateDrop = () => {
        currentFallingStep++;

        itemToDropCanvas.style.transform = `translateY(${
          currentFallingStep * 48
        }px)`;

        if (currentFallingStep < delta) {
          setTimeout(animateDrop, 300);
        }
      };
      animateDrop();
    }

    drawItem(item, 3, "#331c1a");
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
  document.body.classList.add(process.env.GAME_TYPE);

  renderFavicon(faviconPixels);
}
