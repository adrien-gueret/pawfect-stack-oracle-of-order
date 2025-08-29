export default {
  catDesc: "That's me! Mélusine can't place items where I am.",
  catItemDesc:
    "A gift from me to Mélusine. It's a bit bulky, but I'm sure she loves it!",
  favicon: [
    [],
    [],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 1, 2, 1],
    [0, 0, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 2, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
  ],
  async runScenario(master, melusine, cat, dialog, speakTo) {
    const scenarioScenes = [
      {
        msg: "Meow...",
      },
      {
        msg: `My pet human asked his apprentice to tidy up the cellar.`,
      },
      {
        msg: `The cellar is MY territory! And I can't let anyone set foot in it!!!`,
      },
      {
        msg: `The little witch doesn't seem very skilled, but she's ambitious...`,
      },
      {
        msg: "It's just you and me now, Mélusine!",
      },
      {
        msg: "Meow!",
      },
    ];

    let currentScene = -1;

    function zoomIn() {
      scenarioScene.style.transform = "scale(1.5) translateX(-120px)";
    }

    function zoomOut() {
      scenarioScene.style.removeProperty("transform");
    }

    return new Promise((resolve) => {
      const showNextScene = () => {
        currentScene++;

        dialog.innerHTML = scenarioScenes[currentScene].msg;

        switch (currentScene) {
          case 0: {
            melusine.classList.add("left");
            cat.classList.add("left");

            speakTo(master, melusine);

            master.style.display = "none";

            break;
          }

          case 1: {
            melusine.classList.remove("left", "stop");

            melusine.animate(
              [
                { transform: "translateX(0)" },
                { transform: "translateX(500%)" },
              ],
              {
                duration: 3000,
                easing: "linear",
                fill: "forwards",
              }
            );
            break;
          }

          case 2:
          case 4:
            zoomIn();
            break;

          case 3:
            zoomOut();
            break;

          case 5:
            zoomOut();
            cat.classList.add("walk");
            cat
              .animate(
                [
                  { transform: "translateX(0)" },
                  { transform: "translateX(400%)" },
                ],
                {
                  duration: 3000,
                  easing: "linear",
                  fill: "forwards",
                }
              )
              .finished.then(resolve);
            break;
        }

        const lastScene = currentScene === scenarioScenes.length - 1;

        dialog.onclick = lastScene ? resolve : showNextScene;

        if (lastScene) {
          dialog.classList.add("end");
        }
      };

      showNextScene();
    });
  },
};
