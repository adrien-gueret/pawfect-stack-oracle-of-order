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

  console.log("Remove previous entry files...");
  fs.rmSync("./entry", { recursive: true, force: true });
  fs.rmSync(zipPathname, { force: true });

  console.log("Get project files content...");

  let indexHTML = fs.readFileSync("./index.html", "utf8");

  let styleCSS = fs.readFileSync("./style.css", "utf8");

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
    .replaceAll("./images/sprites.png", toBase64Url("./images/sprites.png"))
    .replaceAll("./images/logo.png", toBase64Url("./images/logo.png"))
    .replaceAll(
      "./images/logo-oracle.png",
      toBase64Url("./images/logo-oracle.png")
    );
  //.replaceAll("--primary-light", "--pl");

  const ids = [...indexHTML.matchAll(/id="([^"]*?)"/g)];

  ids.forEach((id, i) => {
    if (id[1].length > 4 && id[1] !== "title" && id[1]) {
      indexHTML = indexHTML.replaceAll(id[1], "_" + i);
    }
  });

  const minifiedHTML = await minify.html(indexHTML);
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

  fs.mkdirSync("./entry");

  fs.writeFileSync(
    "./entry/index.html",
    //minifiedHTML,
    `<script>${packedCode.firstLine + packedCode.secondLine}</script>`,
    { encoding: "utf8" }
  );

  console.log("Zip entry folder...");
  await zip("./entry", zipPathname, { compression: COMPRESSION_LEVEL.high });

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
