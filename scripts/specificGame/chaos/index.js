import { startGame } from "./ui.js";
import { getOtherGameFinishedLevelCount } from "../../state.js";

export default {
  f: [
    "0000100001",
    "0000110011",
    "0000111111",
    "0000121121",
    "001112112111",
    "0000112111",
    "0001111111100011",
    "0000011110000001",
    "0000011111000001",
    "0000011111000001",
    "0000011111100001",
    "0000011111111111",
    "0000011111111111",
    "0000001111111111",
  ],
  async l(dialog, speakTo, end) {
    dialog.classList.remove("end");

    scenarioScene.innerHTML =
      '<div class="scenarioMaster c"></div><div class="scenarioMelusine c"></div><div class="scenarioCat c"></div>';
    const master = scenarioScene.querySelector(".scenarioMaster");
    const melusine = scenarioScene.querySelector(".scenarioMelusine");
    const cat = scenarioScene.querySelector(".scenarioCat");

    if (end) {
      cat.style.opacity = 0;

      const scenarioScenes = [
        "Master! Grimalkin keeps bothering me!",
        "Don't worry, Mia, you did a great job despite him! The concentration of magic in the cellar is perfect! Hehehe...",
        "What's happening, Master?",
      ];

      const hasFinishedOtherGame = getOtherGameFinishedLevelCount() >= 3;

      if (hasFinishedOtherGame) {
        scenarioScenes.push(
          "Meow! <i>(The Master used Mia to accumulate magic, become overpowered and dominate the world!)</i>",
          "Meow... <i>(I tried everything to prevent Mia from helping him without her knowing...)</i>",
          "Meow!!! <i>(Attack! We must stop him!)</i>",
          "",
          "Master... ? Are you alright? Grimalkin jumped on you... That won't help with your allergy to his fur!"
        );
      } else {
        scenarioScenes.push("Meow... <i>(Oh no, it's too late!)</i>");
      }

      let currentScene = -1;

      return new Promise(() => {
        const showNextScene = () => {
          currentScene++;

          dialog.innerHTML = scenarioScenes[currentScene];

          switch (currentScene) {
            case 0: {
              melusine.classList.add("left");

              speakTo(melusine, master);

              break;
            }

            case 1: {
              speakTo(master, melusine);
              break;
            }

            case 2: {
              master.classList.add("iddlePause", "r");
              master.classList.remove("speaking");
              melusine.classList.add("shocked");
              break;
            }

            case 3: {
              cat.classList.add("walk");
              cat.style.opacity = 1;
              cat
                .animate(
                  [
                    { transform: "translateX(100%) scaleX(-1)" },
                    { transform: "translateX(0) scaleX(-1)" },
                  ],
                  {
                    duration: 1200,
                    easing: "linear",
                    fill: "forwards",
                  }
                )
                .finished.then(() => {
                  cat.classList.remove("walk");
                });

              break;
            }

            case 6: {
              cat.classList.add("walk");
              cat.style.animationDuration = "333ms";
              cat
                .animate(
                  [
                    { transform: "translateX(0) scaleX(-1)" },
                    { transform: "translateX(-300%) scaleX(-1)" },
                  ],
                  {
                    duration: 600,
                    easing: "linear",
                    fill: "forwards",
                  }
                )
                .finished.then(() => {
                  master.classList.remove("r");
                  cat.classList.remove("walk");
                  cat.style.removeProperty("animationDuration");
                  master.animate(
                    [
                      { transform: "translateX(0) rotate(0)" },
                      { transform: "translateX(-300%) rotate(360deg" },
                    ],
                    {
                      duration: 600,
                      easing: "ease-in",
                      fill: "forwards",
                    }
                  );
                });
            }
          }

          const lastScene = currentScene === scenarioScenes.length - 1;

          dialog.onclick = lastScene
            ? () => {
                dialog.classList.add("tend");

                dialog.innerHTML = hasFinishedOtherGame
                  ? `You've finished BOTH <b>Pawfect Stack</b> games! Thank you so much, I hope you enjoyed the experience! :D`
                  : `You've finished <b>Pawfect Stack: Oracle of Chaos</b>! To discover the true ending, also complete <a target="_parent" href="https://js13kgames.com/2025/games/pawfect-stack-oracle-of-order"><b>Pawfect Stack: Oracle of Order</b></a>!`;
              }
            : showNextScene;

          if (lastScene) {
            dialog.classList.add("end");
          }
        };

        showNextScene();
      });
    }

    const scenarioScenes = [
      "Meow!",
      `My pet human asked his apprentice to tidy up the cellar.`,
      `The cellar is MY territory! And I can't let anyone set foot in it!!!`,
      "The little witch doesn't seem very skilled, but she's ambitious...",
      "It's just you and me now, Mia!",
      "Meow!!",
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

        dialog.innerHTML = scenarioScenes[currentScene];

        switch (currentScene) {
          case 0: {
            melusine.classList.add("left");
            cat.classList.add("left");

            speakTo(master, melusine);

            master.style.display = "none";

            break;
          }

          case 1: {
            melusine.classList.remove("left", "iddlePause");

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
  s: startGame,
};
