import order from "./order/index.js";
import chaos from "./chaos/index.js";

const selected = process.env.GAME_TYPE === "order" ? order : chaos;
export default selected;
