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

const forceNextWizardAction = (actionIndex) => (e) => {
  e.ci = actionIndex;
};

export default async function startTuto(levelIndex) {
  if (levelIndex === 0) {
    actionsMenu.style.display = "none";
    levelGoals.style.display = "none";

    const actionsDomNodes = actionsMenu.querySelectorAll(".s");
    actionsDomNodes.forEach((node) => {
      node.style.display = "none";
    });

    updateHelp(
      "This is my territory. Mia has already place an item in the cellar... We have to stop her!",
      ["noshop"]
    );

    await waitForClick();

    actionsMenu.style.removeProperty("display");
    actionsDomNodes[0].style.removeProperty("display");

    updateHelp(
      'To be able to act, I have to be in the cellar. Click on the "Move" trick, on the upper right and place me in the cellar.',
      ["nocursor"]
    );

    let itemDropped;
    do {
      const results = await waitFor("item:dropped", forceNextWizardAction(0));
      itemDropped = results?.detail;
    } while (!itemDropped?.isCat);

    levelGoals.style.removeProperty("display");

    actionsMenu.inert = true;

    updateHelp(
      "The game ends when the required number of items is in the cellar; we win if Mia's magic goal is NOT reached. Check the top left of the screen!",
      [],
      ["nocursor"]
    );

    await waitForClick();

    updateHelp(
      'She has already placed two items and her magic score increases... What if we send her a little "gift"? Click to see my own treasures!',
      ["noshop"]
    );

    await waitForClick();

    updateHelp(
      "My reserve is on the right. Click on an item to select it. It'll be sent to the cellar and will bother Mia!",
      [],
      ["noshop"]
    );

    const { detail: selectedItem } = await waitFor("item:selected");

    updateHelp(
      `${selectedItem.name}? Ok then! It's appeared in the cellar. Move it with your mouse and click to place it. Caution: gravity will affect it!`,
      ["noshop", "nocursor"]
    );

    await waitFor("item:dropped", forceNextWizardAction(1));

    actionsMenu.inert = false;

    updateHelp(
      `Hydravo! Mia has cast a water spell on me and I had to run away! When this happens, please use the "move" trick to make me come back...`
    );

    await waitFor("item:dropped", forceNextWizardAction(2));

    actionsDomNodes.forEach((node) => {
      node.style.removeProperty("display");
    });

    updateHelp(
      'Thanks! I have other tricks up my sleeve... but Mia too! She has cast her Ejectum spell and our "gift" has disappeared...',
      [],
      ["nocursor"]
    );

    await waitForClick();

    updateHelp(
      "Now you know everything you need to know to prevent Mia from tidying the cellar properly!"
    );

    await waitForClick();
  }
  updateHelp("Stop Mia from tidying the cellar properly!", [], ["noshop"]);
}
