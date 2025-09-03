import initSections, { goToSection } from "./sections.js";
import initUI, { startGame, runScenario } from "./ui.js";

import initState, { getThisGameFinishedLevelCount } from "./state.js";
import playMainMusic from "./sounds.js";

import specificGame from "./specificGame/index.js";

(() => {
  initState();

  initUI(specificGame.f);

  let isSoundInit = false;
  initSections(async ({ currentSection, nextSection, vars }) => {
    if (!isSoundInit && currentSection === "home") {
      isSoundInit = true;
      playMainMusic();
    }

    if (nextSection === "scenarioSection") {
      await runScenario(specificGame.l, vars.end);

      goToSection("mainGame");
    }
    if (nextSection === "mainGame") {
      startGame(getThisGameFinishedLevelCount() ?? 0, specificGame.s);
    }
  });
})();
