import { startGame } from "./ui.js";
import { getOtherGameFinishedLevelCount } from "../../state.js";

export default {
  favicon: [
    [0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 1, 2, 1, 2, 1, 2, 1],
    [0, 0, 0, 0, 1, 1, 2, 2, 1, 2, 1, 1],
    [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2],
    [0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 2],
    [0, 0, 0, 0, 0, 1, 1, 2, 2, 2],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  ],
  async runScenario(dialog, speakTo, end) {
    dialog.classList.remove("end");

    scenarioScene.innerHTML =
      '<div class="scenarioMaster c"></div><div class="scenarioMelusine c"></div><div class="scenarioCat c"></div>';
    const master = scenarioScene.querySelector(".scenarioMaster");
    const melusine = scenarioScene.querySelector(".scenarioMelusine");
    const cat = scenarioScene.querySelector(".scenarioCat");

    if (end) {
      cat.style.opacity = 0;

      const scenarioScenes = [
        "Master! I've completed the task you entrusted to me!",
        "Very good, Mélusine! The concentration of magic in the cellar is perfect! Hehehe...",
        "But... What's happening, Master?",
      ];

      const hasFinishedOtherGame = getOtherGameFinishedLevelCount() >= 3;

      if (hasFinishedOtherGame) {
        scenarioScenes.push(
          "Meow! <i>(The Master used Mélusine to accumulate magic, become overpowered and dominate the world!)</i>",
          "Meow... <i>(I tried everything to prevent Mélusine from helping him without her knowing...)</i>",
          "Meow!!! <i>(Attack! We must stop him!)</i>",
          "Master... ? Are you alright? Grimalkin jumped on you... That won't help with your allergy to his fur!"
        );
      } else {
        scenarioScenes.push("Meow... <i>(Oh no, I've failed...)</i>");
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
              master.classList.add("stop", "r");
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

            case 5: {
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
                  : `You've finished <b>Pawfect Stack: Oracle of Order</b>! To discover the true ending, also complete <a target="_parent" href=""><b>Pawfect Stack: Oracle of Chaos</b></a>!`;
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
      "My little Mélusine, I entrust you with a mission of the utmost importance!",
      `Oh, what is it, Master? Ingredients to find? A potion to brew? A spell to craft?`,
      `The cellar really needs to be tidied up!`,
      "Oh... I see. I'll take care of it right away.",
      "And make sure the concentration of magic is optimal!",
      "Very well, Master.",
      "Meow...",
    ];

    let currentScene = -1;

    return new Promise((resolve) => {
      const showNextScene = () => {
        currentScene++;

        dialog.innerHTML = scenarioScenes[currentScene];

        switch (currentScene) {
          case 0: {
            melusine.classList.add("left");

            speakTo(master, melusine);

            cat.style.display = "none";
            master.animate(
              [
                { transform: "translateX(-100%)" },
                { transform: "translateX(0)" },
              ],
              {
                duration: 1500,
                easing: "linear",
                fill: "forwards",
              }
            );
            break;
          }

          case 1:
          case 3: {
            master.getAnimations().forEach((anim) => {
              if (anim instanceof CSSAnimation) {
                return;
              }
              anim.finish();
            });

            speakTo(melusine, master);

            break;
          }

          case 2:
          case 4: {
            speakTo(master, melusine);
            break;
          }

          case 5: {
            speakTo(melusine, master);
            master.classList.remove("stop");

            const masterAnimation = master.animate(
              [
                { transform: "translateX(0) scaleX(-1)" },
                { transform: "translateX(-205%) scaleX(-1)" },
              ],
              {
                duration: 3000,
                easing: "linear",
                fill: "forwards",
              }
            );

            masterAnimation.finished.then(() => {
              master.style.opacity = 0;
            });

            window.setTimeout(() => {
              melusine.classList.remove("left", "speaking");
              melusine.animate(
                [
                  { transform: "translateX(0)" },
                  { transform: "translateX(205%)" },
                ],
                {
                  duration: 3000,
                  easing: "linear",
                  fill: "forwards",
                }
              );
            }, 750);
            break;
          }

          case 6: {
            master.remove();
            melusine.remove();
            cat.style.removeProperty("display");
            cat.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: 2000,
              easing: "ease-in",
              fill: "forwards",
            });

            window.setTimeout(() => {
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
            }, 2500);
            break;
          }
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
  start: startGame,
};
