import { getItem, drawItem } from "./items/index.js";
import { checkApplyItemToBoard } from "./board/index.js";
import { convert1DIndexInto2DIndex, getRandom } from "./utils.js";

const soundsCheckbox = document.getElementById("soundsCheckbox");
const gameTable = document.getElementById("gameTable");
const wallsCanvas = document.getElementById("wallsCanvas");
const itemToDropCanvas = document.getElementById("itemToDropCanvas");

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

// TODO: temp for easy dev, should be removed
let BOARD_FROM_STATE = [];

function initGameTable(baseBoard) {
  const row = `<div></div>`;
  gameTable.innerHTML = row.repeat(100);

  baseBoard.flat().forEach((val, index) => {
    if (val === -1) {
      const cell = gameTable.children[index];
      cell.className = `solid v${getRandom(3)}`;
    }
  });

  BOARD_FROM_STATE = baseBoard;

  renderWallsCanvas();
}

function prepareItemToDrop(itemId) {
  const item = getItem(itemId);
  itemToDropCanvas.width = item.shape[0].length * 48;
  itemToDropCanvas.height = item.shape.length * 48;
  itemToDropCanvas.style.backgroundColor = "transparent";
  drawItem(itemToDropCanvas.getContext("2d"), item);

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

    const item = getItem(itemId);

    const ctx = itemToDropCanvas.getContext("2d");
    ctx.clearRect(0, 0, itemToDropCanvas.width, itemToDropCanvas.height);

    const overlaps = checkApplyItemToBoard(item, BOARD_FROM_STATE, column, row);

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

    drawItem(ctx, item, "rgba(255, 255, 255, 0.2)");
  };

  gameTable.onclick = (e) => {
    if (!isAllowToDrop) {
      console.log("nope");
      return;
    }

    gameTable.onclick = void 0;
    gameTable.onmousemove = void 0;
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
        BOARD_FROM_STATE,
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

    const ctx = itemToDropCanvas.getContext("2d");
    drawItem(ctx, item, "#331c1a");

    console.log("OK");
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

export async function runScenario(specificGameScenario) {
  const master = document.querySelector("#scenarioScene .scenarioMaster");
  const melusine = document.querySelector("#scenarioScene .scenarioMelusine");
  const cat = document.querySelector("#scenarioScene .scenarioCat");
  const dialog = document.querySelector("#scenarioScene + .scenarioDialog");

  await specificGameScenario(master, melusine, cat, dialog);
}

export default async function init(faviconPixels) {
  document.body.classList.add(process.env.GAME_TYPE);

  renderFavicon(faviconPixels);

  const debugBoard = Array.from({ length: 10 }, () => Array(10).fill(0));

  debugBoard[0][9] = -1;
  debugBoard[0][0] = -1;
  debugBoard[8][4] = -1;
  debugBoard[8][5] = -1;
  debugBoard[9][3] = -1;
  debugBoard[9][4] = -1;
  debugBoard[9][5] = -1;
  debugBoard[9][6] = -1;

  initGameTable(debugBoard);
  prepareItemToDrop(6);
}
