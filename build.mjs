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
    circle at 50% 3%,
    #a0302d 0 15%,
    #b8453f 15% 22%,
    #d05a51 22% 30%,
    #e86f63 30% 38%,
    #ff8475 38% 45%,
    #ff9987 45% 52%,
    #ffae99 52% 59%,
    #ffc3ab 59% 66%,
    #ffd8bd 66% 73%,
    #ffedcf 73% 80%,
    #fff2e1 80% 87%,
    #fff7f3 87% 100%
  );
  background-color: #fff7f3;
}`
      : `[data-current-section="home"] main {
  background-image: radial-gradient(
    circle at 50% 3%,
    #205d61 0 15%,
    #2a6b6f 15% 22%,
    #34797d 22% 30%,
    #3e878b 30% 38%,
    #489599 38% 45%,
    #52a3a7 45% 52%,
    #5cb1b5 52% 59%,
    #66bfc3 59% 66%,
    #70cdd1 66% 73%,
    #7adbdf 73% 80%,
    #84e9ed 80% 87%,
    #8ef7fb 87% 100%
  );
  background-color: #8ef7fb;
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
    .replaceAll("./images/sprites.png", "./s.png")
    .replaceAll("./images/logo.png", toBase64Url("./images/logo.png"))
    .replaceAll(
      "./images/logo-order.png",
      toBase64Url(
        gameName === "order"
          ? "./images/logo-order.png"
          : "./images/logo-chaos.png"
      )
    );

  fs.copyFileSync("./images/sprites.png", `${entryPathname}/s.png`);

  //.replaceAll("--primary-light", "--pl");

  const ids = [...indexHTML.matchAll(/id="([^"]*?)"/g)];

  ids.forEach((id, i) => {
    if (id[1] && id[1].length >= 4) {
      indexHTML = indexHTML.replaceAll(id[1], "_" + i);
    }
  });

  const minifiedHTML = (await minify.html(indexHTML)).replaceAll(
    '<script>window.process={env:{GAME_TYPE:"order"}}</script>',
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
