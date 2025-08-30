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

export default async function startTuto(levelIndex) {
  if (levelIndex === 0) {
    actionsMenu.style.display = "none";
    levelGoals.style.display = "none";

    updateHelp(
      "Here is the cellar! The items to tidy up are in the reserve. Click to see them.",
      ["noshop"]
    );

    await waitForClick();

    updateHelp(
      "The reserve is on the right. Click on an item to select it. It'll be sent to the cellar.",
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

    levelGoals.style.removeProperty("display");

    updateHelp(
      "The game ends when we place the required number of items; we win if we've reached the minimum required amount of magic. Check the top left of the screen!",
      ["noshop"]
    );

    await waitForClick();

    updateHelp("Place another item!", [], ["noshop"]);

    await waitFor("item:dropped");

    updateHelp(
      "As long as an object is in the cellar, it gives its magic to it. The magic score is our main goal but you can also spend some magic to cast spells: try it now! (there is one to scare the cat away!)",
      ["noshop", "nocursor"]
    );

    actionsMenu.style.removeProperty("display");

    const { detail: spellCasted } = await waitFor("spell:casted");

    updateHelp(
      `${spellCasted.name.toUpperCase()}! You have cast your first spell! Its magic cost has increased by 1.`,
      ["noshop"],
      ["nocursor"]
    );

    actionsMenu.inert = true;

    await waitForClick();

    actionsMenu.inert = false;

    updateHelp(
      "You now know all you need to know to properly tidy up the cellar! Try to reach our goals!",
      [],
      ["noshop", "nocursor"]
    );
  } else {
    updateHelp("Tidy up the cellar!");
  }
}
