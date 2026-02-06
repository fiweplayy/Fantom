const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const seedInput = document.getElementById("seedInput");
const regenBtn = document.getElementById("regenBtn");
const inventoryEl = document.getElementById("inventory");
const craftingEl = document.getElementById("crafting");
const smeltBtn = document.getElementById("smeltBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const weatherToggle = document.getElementById("weatherToggle");
const fogToggle = document.getElementById("fogToggle");
const saveToggle = document.getElementById("saveToggle");
const healthBar = document.getElementById("healthBar");
const hungerBar = document.getElementById("hungerBar");
const staminaBar = document.getElementById("staminaBar");
const furnaceInput = document.getElementById("furnaceInput");
const furnaceFuel = document.getElementById("furnaceFuel");
const furnaceOutput = document.getElementById("furnaceOutput");

const TILE_SIZE = 24;
const CHUNK_SIZE = 16;
const VIEW_RADIUS = 12;

const BLOCKS = {
  air: { id: 0, color: "rgba(0,0,0,0)", solid: false, name: "Воздух" },
  grass: { id: 1, color: "#3aa76d", solid: true, name: "Трава", hardness: 0.6 },
  dirt: { id: 2, color: "#8f5f3b", solid: true, name: "Земля", hardness: 0.5 },
  stone: { id: 3, color: "#8a8f98", solid: true, name: "Камень", hardness: 1.5 },
  sand: { id: 4, color: "#d7c27a", solid: true, name: "Песок", hardness: 0.4 },
  wood: { id: 5, color: "#7a5235", solid: true, name: "Дерево", hardness: 2.0 },
  leaves: { id: 6, color: "#2f7d4f", solid: true, name: "Листва", hardness: 0.2 },
  coal: { id: 7, color: "#2d2e32", solid: true, name: "Угольная руда", hardness: 3.0 },
  iron: { id: 8, color: "#c1a288", solid: true, name: "Железная руда", hardness: 3.5 },
  planks: { id: 9, color: "#9b6a43", solid: true, name: "Доски", hardness: 1.0 },
  stick: { id: 10, color: "#c7a27f", solid: true, name: "Палка", hardness: 0.2 },
  ingot: { id: 11, color: "#d4d0c9", solid: true, name: "Железный слиток", hardness: 2.0 },
};

const RECIPES = [
  { key: "planks", input: { wood: 1 }, output: { planks: 4 } },
  { key: "stick", input: { planks: 2 }, output: { stick: 4 } },
];

const FURNACE_RECIPES = {
  iron: { output: "ingot", time: 8 },
};

const BIOMES = [
  { name: "Лес", surface: "grass", treeChance: 0.2 },
  { name: "Пустыня", surface: "sand", treeChance: 0.0 },
  { name: "Горы", surface: "stone", treeChance: 0.05 },
  { name: "Океан", surface: "sand", treeChance: 0.0 },
];

let worldSeed = Date.now().toString();
let world = new Map();
let dayTime = 0;
let isThirdPerson = false;

const player = {
  x: 0,
  y: 0,
  health: 100,
  hunger: 100,
  stamina: 100,
  hotbarIndex: 0,
  inventory: new Map(),
};

const furnace = {
  input: null,
  fuel: null,
  output: null,
  timer: 0,
};

function hash(seed, x, y) {
  let h = 2166136261 ^ seed;
  h = Math.imul(h ^ x, 16777619);
  h = Math.imul(h ^ y, 16777619);
  h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
  return (h >>> 0) / 4294967295;
}

function noise2D(seed, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = x - x0;
  const yf = y - y0;
  const r00 = hash(seed, x0, y0);
  const r10 = hash(seed, x0 + 1, y0);
  const r01 = hash(seed, x0, y0 + 1);
  const r11 = hash(seed, x0 + 1, y0 + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const lerpX1 = r00 + u * (r10 - r00);
  const lerpX2 = r01 + u * (r11 - r01);
  return lerpX1 + v * (lerpX2 - lerpX1);
}

function generateChunk(cx, cy) {
  const seed = Number.parseInt(worldSeed, 10) || 1337;
  const tiles = [];
  for (let x = 0; x < CHUNK_SIZE; x += 1) {
    for (let y = 0; y < CHUNK_SIZE; y += 1) {
      const wx = cx * CHUNK_SIZE + x;
      const wy = cy * CHUNK_SIZE + y;
      const biomeNoise = noise2D(seed, wx * 0.04, wy * 0.04);
      const heightNoise = noise2D(seed + 99, wx * 0.08, wy * 0.08);
      const oreNoise = noise2D(seed + 199, wx * 0.2, wy * 0.2);
      const biomeIndex = Math.floor(biomeNoise * BIOMES.length) % BIOMES.length;
      const biome = BIOMES[biomeIndex];
      let block = biome.surface;
      if (biome.name === "Океан" && heightNoise < 0.45) {
        block = "sand";
      }
      if (heightNoise > 0.7) {
        block = "stone";
      }
      if (oreNoise > 0.85) {
        block = "iron";
      } else if (oreNoise > 0.78) {
        block = "coal";
      }
      tiles.push({ x: wx, y: wy, block, biome: biome.name });
    }
  }
  world.set(`${cx},${cy}`, tiles);
}

function getTile(x, y) {
  const cx = Math.floor(x / CHUNK_SIZE);
  const cy = Math.floor(y / CHUNK_SIZE);
  if (!world.has(`${cx},${cy}`)) {
    generateChunk(cx, cy);
  }
  const tiles = world.get(`${cx},${cy}`);
  return tiles.find((tile) => tile.x === x && tile.y === y);
}

function setTile(x, y, block) {
  const cx = Math.floor(x / CHUNK_SIZE);
  const cy = Math.floor(y / CHUNK_SIZE);
  if (!world.has(`${cx},${cy}`)) {
    generateChunk(cx, cy);
  }
  const tiles = world.get(`${cx},${cy}`);
  const tile = tiles.find((t) => t.x === x && t.y === y);
  if (tile) {
    tile.block = block;
  }
}

function addItem(block, amount = 1) {
  const count = player.inventory.get(block) || 0;
  player.inventory.set(block, count + amount);
}

function removeItem(block, amount = 1) {
  const count = player.inventory.get(block) || 0;
  if (count < amount) {
    return false;
  }
  const newCount = count - amount;
  if (newCount === 0) {
    player.inventory.delete(block);
  } else {
    player.inventory.set(block, newCount);
  }
  return true;
}

function renderInventory() {
  inventoryEl.innerHTML = "";
  const entries = Array.from(player.inventory.entries());
  if (entries.length === 0) {
    inventoryEl.innerHTML = "<div class=\"slot\">Пусто</div>";
    return;
  }
  entries.forEach(([block, count]) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.textContent = `${BLOCKS[block].name} x${count}`;
    inventoryEl.appendChild(slot);
  });
}

function renderCrafting() {
  craftingEl.innerHTML = "";
  RECIPES.forEach((recipe) => {
    const canCraft = Object.entries(recipe.input).every(
      ([block, count]) => (player.inventory.get(block) || 0) >= count,
    );
    const row = document.createElement("div");
    row.className = "recipe";
    row.innerHTML = `<span>${Object.entries(recipe.input)
      .map(([block, count]) => `${BLOCKS[block].name} x${count}`)
      .join(", ")} → ${Object.entries(recipe.output)
      .map(([block, count]) => `${BLOCKS[block].name} x${count}`)
      .join(", ")}</span>`;
    const button = document.createElement("button");
    button.textContent = "Крафт";
    button.disabled = !canCraft;
    button.addEventListener("click", () => {
      Object.entries(recipe.input).forEach(([block, count]) => {
        removeItem(block, count);
      });
      Object.entries(recipe.output).forEach(([block, count]) => {
        addItem(block, count);
      });
      renderInventory();
      renderCrafting();
    });
    row.appendChild(button);
    craftingEl.appendChild(row);
  });
}

function updateStats() {
  player.hunger = Math.max(0, player.hunger - 0.01);
  if (player.hunger === 0) {
    player.health = Math.max(0, player.health - 0.03);
  }
  player.stamina = Math.min(100, player.stamina + 0.05);
  healthBar.style.width = `${player.health}%`;
  hungerBar.style.width = `${player.hunger}%`;
  staminaBar.style.width = `${player.stamina}%`;
}

function updateFurnace() {
  if (!furnace.input || !furnace.fuel) {
    return;
  }
  const recipe = FURNACE_RECIPES[furnace.input];
  if (!recipe) {
    return;
  }
  furnace.timer += 1;
  if (furnace.timer >= recipe.time * 10) {
    furnace.output = recipe.output;
    furnace.input = null;
    furnace.fuel = null;
    furnace.timer = 0;
  }
}

function renderFurnace() {
  furnaceInput.textContent = furnace.input ? BLOCKS[furnace.input].name : "-";
  furnaceFuel.textContent = furnace.fuel ? BLOCKS[furnace.fuel].name : "-";
  furnaceOutput.textContent = furnace.output ? BLOCKS[furnace.output].name : "-";
}

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const halfWidth = canvas.width / 2;
  const halfHeight = canvas.height / 2;
  for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx += 1) {
    for (let dy = -VIEW_RADIUS; dy <= VIEW_RADIUS; dy += 1) {
      const tx = Math.floor(player.x + dx);
      const ty = Math.floor(player.y + dy);
      const tile = getTile(tx, ty);
      const block = BLOCKS[tile.block];
      const screenX = halfWidth + dx * TILE_SIZE;
      const screenY = halfHeight + dy * TILE_SIZE;
      ctx.fillStyle = block.color;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      if (dx === 0 && dy === 0) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      }
    }
  }
  drawDayNight();
  drawWeather();
}

function drawDayNight() {
  dayTime = (dayTime + 0.002) % 1;
  const darkness = Math.abs(Math.sin(dayTime * Math.PI));
  ctx.fillStyle = `rgba(10, 15, 30, ${0.6 - darkness * 0.6})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWeather() {
  if (weatherToggle.checked) {
    ctx.strokeStyle = "rgba(155, 200, 255, 0.4)";
    for (let i = 0; i < 120; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4, y + 12);
      ctx.stroke();
    }
  }
  if (fogToggle.checked) {
    ctx.fillStyle = "rgba(170, 190, 210, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function handleInput(event) {
  const speed = event.shiftKey ? 0.15 : 0.1;
  if (event.key === "w") player.y -= speed;
  if (event.key === "s") player.y += speed;
  if (event.key === "a") player.x -= speed;
  if (event.key === "d") player.x += speed;
  if (event.key === "f") isThirdPerson = !isThirdPerson;
  if (event.key >= "1" && event.key <= "6") {
    player.hotbarIndex = Number.parseInt(event.key, 10) - 1;
  }
}

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left - canvas.width / 2) / TILE_SIZE + player.x);
  const y = Math.floor((event.clientY - rect.top - canvas.height / 2) / TILE_SIZE + player.y);
  const tile = getTile(x, y);
  if (event.button === 0) {
    if (tile.block !== "air") {
      addItem(tile.block, 1);
      setTile(x, y, "air");
      renderInventory();
      renderCrafting();
    }
  } else if (event.button === 2) {
    const blocks = Array.from(player.inventory.keys());
    const selected = blocks[player.hotbarIndex % Math.max(blocks.length, 1)];
    if (selected) {
      if (removeItem(selected, 1)) {
        setTile(x, y, selected);
        renderInventory();
        renderCrafting();
      }
    }
  }
});

smeltBtn.addEventListener("click", () => {
  if (!furnace.input && player.inventory.size > 0) {
    const input = Array.from(player.inventory.keys()).find((block) => FURNACE_RECIPES[block]);
    if (input) {
      furnace.input = input;
      removeItem(input, 1);
    }
  }
  if (!furnace.fuel && player.inventory.has("wood")) {
    furnace.fuel = "wood";
    removeItem("wood", 1);
  }
  if (furnace.output) {
    addItem(furnace.output, 1);
    furnace.output = null;
  }
  renderInventory();
  renderCrafting();
  renderFurnace();
});

regenBtn.addEventListener("click", () => {
  worldSeed = seedInput.value || Date.now().toString();
  world.clear();
  player.x = 0;
  player.y = 0;
  statusEl.textContent = "Мир перегенерирован";
});

saveBtn.addEventListener("click", () => {
  saveWorld();
});

loadBtn.addEventListener("click", () => {
  loadWorld();
});

document.addEventListener("keydown", handleInput);

function saveWorld() {
  if (!saveToggle.checked) {
    return;
  }
  const data = {
    seed: worldSeed,
    player,
    world: Array.from(world.entries()),
  };
  localStorage.setItem("voxelis-world", JSON.stringify(data));
  statusEl.textContent = "Мир сохранён";
}

function loadWorld() {
  const data = localStorage.getItem("voxelis-world");
  if (!data) {
    statusEl.textContent = "Сохранение не найдено";
    return;
  }
  const parsed = JSON.parse(data);
  worldSeed = parsed.seed;
  player.x = parsed.player.x;
  player.y = parsed.player.y;
  player.health = parsed.player.health;
  player.hunger = parsed.player.hunger;
  player.stamina = parsed.player.stamina;
  player.inventory = new Map(parsed.player.inventory);
  world = new Map(parsed.world);
  statusEl.textContent = "Мир загружен";
}

function tick() {
  updateStats();
  updateFurnace();
  drawWorld();
  renderFurnace();
  if (saveToggle.checked) {
    saveWorld();
  }
  requestAnimationFrame(tick);
}

function init() {
  seedInput.value = worldSeed;
  addItem("wood", 3);
  addItem("stone", 5);
  addItem("iron", 2);
  renderInventory();
  renderCrafting();
  renderFurnace();
  tick();
}

init();
