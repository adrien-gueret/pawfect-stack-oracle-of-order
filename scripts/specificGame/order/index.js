export default {
  catDesc:
    "The master's cat. It's cute, but it's getting in our way a bit here...",
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
  initTuto(level) {
    if (level === 0) {
      help.innerHTML =
        "Here is the cellar! The objects to tidy up are just on the right. Click one to select it.";

      window.addEventListener("item:selected", function onItemSelected(e) {
        const selectedItem = e.detail;

        help.innerHTML = `${selectedItem.name}? Ok then! It's appeared in the cellar. Move it with your mouse and click to place it. Caution: gravity will affect it!`;

        window.addEventListener(
          "item:dropped",
          () => {
            window.removeEventListener("item:selected", onItemSelected);

            help.innerHTML =
              "Oh, here is the master's cat. He's cute, but he might bother us a little...";

            window.addEventListener(
              "item:dropped",
              () => {
                help.innerHTML =
                  "Each item you place increases the magical concentration of the cellar. Your goal is to get the highest score possible, but you can also spend some to cast spells!";
              },
              { once: true }
            );
          },
          { once: true }
        );
      });
    }
  },
};
