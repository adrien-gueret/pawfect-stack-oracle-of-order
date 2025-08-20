import initSections, { goToSection } from "./sections.js";
import initUI, { runScenario, initGameTable } from "./ui.js";

import initState, { areSoundMuted } from "./state.js";
import initSounds from "./sounds.js";

import specificGame from "./specificGame/index.js";

(async () => {
  await initUI(specificGame.favicon);

  initState();

  let isSoundInit = false;
  initSections(async ({ currentSection, nextSection, vars }) => {
    if (!isSoundInit && currentSection === "home" && nextSection !== "home") {
      isSoundInit = true;
      initSounds(areSoundMuted());
    }

    if (nextSection === "scenarioSection") {
      await runScenario(specificGame.runScenario);

      goToSection("mainGame");
    } else if (nextSection === "mainGame") {
      const levelIndex = vars.l ?? 0;
      initGameTable(levelIndex, specificGame.initTuto);
    }
  });
})();
