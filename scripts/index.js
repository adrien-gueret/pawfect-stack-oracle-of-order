import initSections, { goToSection } from "./sections.js";
import initUI, { startGame, runScenario } from "./ui.js";

import initState from "./state.js";
import playMainMusic from "./sounds.js";

import specificGame from "./specificGame/index.js";

(() => {
  initState();

  initUI(specificGame.favicon);

  let isSoundInit = false;
  initSections(async ({ currentSection, nextSection, vars }) => {
    if (!isSoundInit && currentSection === "home" && nextSection !== "home") {
      isSoundInit = true;
      playMainMusic();
    }

    if (nextSection === "scenarioSection") {
      await runScenario(specificGame.runScenario);

      goToSection("mainGame");
    } else if (nextSection === "mainGame") {
      const levelIndex = vars.l ?? 0;
      startGame(levelIndex, specificGame.start);
    }
  });
})();
