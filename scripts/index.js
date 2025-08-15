import initSections from "./sections.js";
import initUI, { runScenario } from "./ui.js";

import initState, { areSoundMuted } from "./state.js";
import initSounds from "./sounds.js";

import specificGame from "./specificGame/index.js";

(async () => {
  await initUI(specificGame.favicon);

  initState();

  let isSoundInit = false;
  initSections(async ({ currentSection, nextSection, vars }) => {
    if (!isSoundInit && currentSection === "title" && nextSection !== "title") {
      isSoundInit = true;
      initSounds(areSoundMuted());
    }

    if (nextSection === "scenarioSection") {
      await runScenario(specificGame.runScenario);
    }
  });
})();
