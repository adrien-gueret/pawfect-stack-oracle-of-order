const scenarioScenes = [
  {
    msg: "Ma petite Mélusine, je te confie une mission de la plus haute importance !",
  },
  {
    msg: `Oh, quoi donc, Maître ? Des ingrédients à chercher ? Une potion à concocter ? Un sort à fabriquer ?`,
  },
  {
    msg: `La cave a bien besoin d'être rangée !`,
  },
  {
    msg: "Oh... je vois. Je m'en occupe tout de suite.",
  },
  {
    msg: "Et veille à ce que la concentration en magie soit optimale !",
  },
  {
    msg: "Très bien, maître.",
  },
  {
    msg: "Miaou...",
  },
];

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
  async runScenario(master, melusine, cat, dialog) {
    let currentScene = 0;

    melusine.classList.add("left");
    cat.style.display = "none";
    console.log(dialog);
    dialog.innerHTML = scenarioScenes[currentScene].msg;

    return;

    const showNextScene = () => {
      if (currentScene < scenarioScenes.length) {
        const scene = scenarioScenes[currentScene];
        document.getElementById("scenarioDialog").innerText = scene.msg;
        currentScene++;
      }
    };

    showNextScene();
  },
};
