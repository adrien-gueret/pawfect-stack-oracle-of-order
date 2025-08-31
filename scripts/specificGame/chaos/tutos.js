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
      addEventListener(
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
  helpContainer.innerHTML = text;
  helpContainer.parentNode.classList.add(...classesToAdd);
  helpContainer.parentNode.classList.remove(...classesToRemove);
};

export default async function startTuto(levelIndex) {
  if (levelIndex === 0) {
    actionsMenu.style.display = "none";
    levelGoals.style.display = "none";

    updateHelp(
      "This is my territory. Mia has already place an item in the cellar... We have to stop her!",
      ["noshop"]
    );

    await waitForClick();

    actionsMenu.style.removeProperty("display");

    updateHelp(
      'To be able to act, I have to be in the cellar. Click on the "Move" trick, on the upper right and place me in the cellar.',
      ["nocursor"]
    );

    await waitFor("cat:moved");

    levelGoals.style.removeProperty("display");

    updateHelp(
      "The game ends when Mia places the required number of items; we win if Mia's magic goal is NOT reached. Check the top left of the screen!",
      [],
      ["nocursor"]
    );

    await waitForClick();

    updateHelp(
      'She has already placed a lot of items and her magic score increases... What if we send her a little "gift"? Click to see my own treasures!',
      ["noshop"]
    );

    await waitForClick();

    updateHelp(
      "My reserve is on the right. Click on an item to select it. It'll be sent to the cellar as a gift for Mia!",
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
      "Now you know everything you need to know to prevent Mia from tidying the cellar properly!",
      [],
      ["noshop", "nocursor"]
    );
  } else {
    updateHelp("Stop Mia from tidying the cellar properly!");
  }
}
