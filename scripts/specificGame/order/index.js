import actions from "./actions.js";

const waitForClick = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      document.addEventListener("click", resolve, { once: true });
    }, 1);
  });
};

const waitFor = (eventName, callback) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      window.addEventListener(
        eventName,
        (e) => {
          callback?.(e);
          resolve(e);
        },
        { once: true }
      );
    }, 1);
  });
};

const updateHelp = (text, classesToAdd = [], classesToRemove = []) => {
  help.innerHTML = text;
  help.parentNode.classList.add(...classesToAdd);
  help.parentNode.classList.remove(...classesToRemove);
};

export default {
  catDesc:
    "The master's cat. He's cute, but he's getting in our way a bit here...",
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
  async runScenario(master, melusine, cat, dialog, speakTo) {
    const scenarioScenes = [
      {
        msg: "My little Mélusine, I entrust you with a mission of the utmost importance!",
      },
      {
        msg: `Oh, what is it, Master? Ingredients to find? A potion to brew? A spell to craft?`,
      },
      {
        msg: `The cellar really needs to be tidied up!`,
      },
      {
        msg: "Oh... I see. I'll take care of it right away.",
      },
      {
        msg: "And make sure the concentration of magic is optimal!",
      },
      {
        msg: "Very well, Master.",
      },
      {
        msg: "Meow...",
      },
    ];

    let currentScene = -1;

    return new Promise((resolve) => {
      const showNextScene = () => {
        currentScene++;

        dialog.innerHTML = scenarioScenes[currentScene].msg;

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
  async initTuto(level, onActionInit) {
    onActionInit("Spells", actions);

    if (level === 0) {
      actionsMenu.style.display = "none";
      goals.style.display = "none";

      updateHelp(
        "Here is the cellar! The objects to tidy up are in the reserve. Click to see them.",
        ["noshop"]
      );

      await waitForClick();

      updateHelp(
        "The reserve is just on the right. Click on an item to select it. It'll be sent to the cellar.",
        [],
        ["noshop"]
      );

      const { detail: selectedItem } = await waitFor("item:selected");

      updateHelp(
        `${selectedItem.name}? Ok then! It's appeared in the cellar. Move it with your mouse and click to place it. Caution: gravity will affect it!`,
        ["noshop", "nocursor"]
      );

      await waitFor("item:dropped");

      updateHelp(
        "Oh, here is Grimalkin, the master's cat. He's cute, but he might bother us a little...",
        [],
        ["nocursor"]
      );

      await waitForClick();

      updateHelp(
        "Place a new item in the cellar! Of course, it's impossible to place an item where Grimalkin is standing...",
        [],
        ["noshop"]
      );

      await waitFor("item:dropped", (e) => {
        e.ci = 1;
      });

      updateHelp(
        "Oh! Grimalkin gave us a little gift! Click to see it in the reserve!",
        ["noshop"]
      );

      await waitForClick();

      updateHelp(
        "The gifts from this cat are a bit lame... But we shouldn't upset him, right?",
        [],
        ["noshop"]
      );

      await waitFor("item:dropped");

      goals.style.removeProperty("display");

      updateHelp(
        "To win, we have two goals: place at least the required number of master's items AND reach the required amount of magic. These numbers are on the top left of the screen.",
        ["noshop"]
      );

      await waitForClick();

      updateHelp("Place another item!", [], ["noshop"]);

      await waitFor("item:dropped");

      updateHelp(
        "Each item you place increases the magical concentration of the cellar. This magic score is one of our goals, but you can also spend some magic points to cast spells: try it now!",
        ["noshop", "nocursor"]
      );

      actionsMenu.style.removeProperty("display");
    }
  },
};
