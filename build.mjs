import fs from "fs";
import { execSync } from "child_process";
import { minify } from "minify";
import { Packer } from "roadroller";
import { zip, COMPRESSION_LEVEL } from "zip-a-folder";

(async () => {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const gameArg = args.find((arg) => arg.startsWith("--game="));
  const gameName = gameArg ? gameArg.split("=")[1] : null;

  if (gameName !== "chaos" && gameName !== "order") {
    console.error("Error: --game argument is invalid");
    process.exit(1);
  }

  console.log(`Building game: ${gameName}`);

  const zipPathname = `./entry-${gameName}.zip`;
  const entryPathname = `./entry-${gameName}`;

  console.log("Remove previous entry files...");
  fs.rmSync(entryPathname, { recursive: true, force: true });
  fs.mkdirSync(entryPathname);

  fs.rmSync(zipPathname, { force: true });

  console.log("Get project files content...");

  let indexHTML = fs.readFileSync("./index.html", "utf8");

  let styleCSS = fs.readFileSync("./style.css", "utf8");

  styleCSS +=
    gameName === "order"
      ? `[data-current-section="home"] main {
  background-image: radial-gradient(
    circle at 50% 50%,  
    #a0302d 0 60%,
    #e86f63 0 80%,
    #ffae99 0 90%,
    #fff7f3 0 100%);
}`
      : `[data-current-section="home"] main {
  background-image: radial-gradient(
    circle at 50% 50%,  
    #205d61 0 60%,
    #3e878b 0 80%,
    #66bfc3 0 90%,
    #8ef7fb 0 100%
  );
}`;

  let indexJS = fs
    .readFileSync("./index.js", "utf8")
    .replaceAll("const ", "let ")
    .replaceAll("undefined", "void 0");

  fs.unlinkSync("./index.js");

  console.log("Minify JS...");
  const minifiedJS = await minify.js(indexJS);

  console.log("Minify CSS...");
  const minifiedCSS = await minify.css(styleCSS);

  console.log("Minify HTML...");

  const toBase64Url = (fileName) =>
    `data:image/png;base64,${fs.readFileSync(fileName, {
      encoding: "base64",
    })}`;

  indexHTML = indexHTML
    .replace(
      '<script type="module" src="scripts/index.js"></script>',
      () => `<script>${minifiedJS}</script>`
    )
    .replace(
      '<link href="./style.css" rel="stylesheet" />',
      () => `<style>${minifiedCSS}</style>`
    )
    .replaceAll('"use strict";', "")
    .replaceAll("--target-x", "--tx")
    .replaceAll("--target-y", "--ty")
    .replaceAll("./images/sprites.png", "./s.png")
    .replaceAll("./images/logo.webp", toBase64Url("./images/logo.webp"))
    .replaceAll(
      "./images/logo-order.webp",
      toBase64Url(
        gameName === "order"
          ? "./images/logo-order.webp"
          : "./images/logo-chaos.webp"
      )
    );

  fs.copyFileSync("./images/sprites.png", `${entryPathname}/s.png`);

  const classNamesToMangle = [
    "skip",
    "walk",
    "brick",
    "logos",
    "tend",
    "iddlePause",
    "scenarioDialog",
    "scenarioMaster",
    "scenarioMelusine",
    "scenarioCat",
    "scenario",
    "actionDisabled",
    "noshop",
    "nocursor",
    "speaking",
    "shocked",
    "casting",
    "dragging",
  ];

  classNamesToMangle.forEach((className, i) => {
    const re = new RegExp(`\\b${className}\\b`, "g");
    indexHTML = indexHTML.replaceAll(re, "_" + i);
  });

  const eventNamesToMangle = ["item:selected", "item:dropped", "spell:casted"];

  eventNamesToMangle.forEach((eventName, i) => {
    const re = new RegExp(`\\b${eventName}\\b`, "g");
    indexHTML = indexHTML.replaceAll(re, "_" + i);
  });

  const reduxActionNamesToMangle = [
    "initGame",
    "setBoard",
    "spendMagic",
    "setFinishedLevelCount",
  ];

  reduxActionNamesToMangle.forEach((actionName, i) => {
    const re = new RegExp(`\\b${actionName}\\b`, "g");
    indexHTML = indexHTML.replaceAll(re, "_" + i);
  });

  eventNamesToMangle.forEach((eventName, i) => {
    const re = new RegExp(`\\b${eventName}\\b`, "g");
    indexHTML = indexHTML.replaceAll(re, "_" + i);
  });

  const propertiesToMangle = ["justDrop", "gameItem", "canvas"];

  propertiesToMangle.forEach((propName, i) => {
    const re = new RegExp(`(?<=\\.)${propName}\\b`, "g");
    indexHTML = indexHTML.replaceAll(re, "_" + i);
  });

  const ids = [...indexHTML.matchAll(/id="([^"]*?)"/g)];

  ids.forEach((id, i) => {
    if (id[1] && id[1].length >= 4) {
      indexHTML = indexHTML.replaceAll(id[1], "_" + i);
    }
  });

  const keyframesToMangle = [
    "spriteAnimation",
    "slideRight",
    "blinkArrow",
    "wubble",
    "glow",
  ];

  keyframesToMangle.forEach((kf, i) => {
    const re = new RegExp(`\\b${kf}\\b`, "g");
    indexHTML = indexHTML.replaceAll(re, "k" + i);
  });

  const minifiedHTML = (await minify.html(indexHTML))
    .replaceAll('<script>window.process={env:{GAME_TYPE:"order"}}</script>', "")
    .replaceAll(
      '<script>window.process={env:{GAME_TYPE:"chaos"}}</script>',
      ""
    );

  fs.writeFileSync(`${gameName}-min.html`, minifiedHTML, { encoding: "utf8" });

  console.log("Pack project...");
  const inputToPack = [
    {
      data: minifiedHTML,
      type: "text",
      action: "write",
    },
  ];

  const packer = new Packer(inputToPack);
  await packer.optimize();

  const packedCode = packer.makeDecoder();

  console.log("Write entry files...");

  fs.writeFileSync(
    `${entryPathname}/index.html`,
    `<script>${packedCode.firstLine + packedCode.secondLine}</script>`,
    { encoding: "utf8" }
  );

  console.log("Zip entry folder...");
  await zip(entryPathname, zipPathname, {
    compression: COMPRESSION_LEVEL.high,
  });

  console.log("Compress zip...");
  try {
    await execSync(`ect.exe -9 -zip ${zipPathname}`, { env: process.env });
  } catch (e) {
    console.warn(
      "⚠ Cannot compress zip, please be sure ect.exe is installed and available from global scope"
    );
  }

  console.log("Get entry size...");
  const { size } = fs.statSync(zipPathname);

  console.log("Entry size: " + size + " bytes");

  const JS13K_LIMIT_SIZE = 13312;

  const percent = Math.round(((size * 100) / JS13K_LIMIT_SIZE) * 100) / 100;
  const percentOfTotalBudget = "(" + percent + "% of total budget)";

  if (size > JS13K_LIMIT_SIZE) {
    console.error(
      "❌ File is " +
        (size - JS13K_LIMIT_SIZE) +
        "bytes too big! " +
        percentOfTotalBudget
    );
  } else {
    console.log(
      `✅ All good! ${JS13K_LIMIT_SIZE - size} bytes left. ` +
        percentOfTotalBudget
    );
  }

  console.log("");
  console.log("Entry generated");
})();
