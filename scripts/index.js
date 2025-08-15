import initSections from "./sections.js";
import initUI from "./ui.js";

import initState, { areSoundMuted } from "./state.js";
import initSounds from "./sounds.js";

import specificGame from "./specificGame/index.js";

(async () => {
  specificGame();

  await initUI();

  initState();

  let isSoundInit = false;
  initSections(({ currentSection, nextSection, vars }) => {
    if (!isSoundInit && currentSection === "title" && nextSection !== "title") {
      isSoundInit = true;
      initSounds(areSoundMuted());
    }
  });
})();
