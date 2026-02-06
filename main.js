const THREE = window.THREE;

const canvas = document.querySelector('#game');
const menu = document.querySelector('#menu');
const hud = document.querySelector('#hud');
const newGameButton = document.querySelector('#newGame');
const loadGameButton = document.querySelector('#loadGame');
const openSettingsButton = document.querySelector('#openSettings');
const settingsPanel = document.querySelector('#settings');
const sensitivityInput = document.querySelector('#sensitivity');
const volumeInput = document.querySelector('#volume');
const worldStatus = document.querySelector('#worldStatus');
const saveWorldButton = document.querySelector('#saveWorld');
const exitWorldButton = document.querySelector('#exitWorld');
const inventorySlots = [...document.querySelectorAll('.slot')];

const state = {
  running: false,
  sensitivity: 1,
  volume: 0.8,
  selectedBlock: 'dirt',
  seed: 1234,
  isPointerLocked: false,
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  move: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  },
};

const scene = new THREE.Scene();
scene.background = new THREE.Color('#8fd3ff');
scene.fog = new THREE.Fog('#8fd3ff', 10, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const clock = new THREE.Clock();

const hemisphere = new THREE.HemisphereLight('#ffffff', '#4c566a', 0.9);
scene.add(hemisphere);
const directional = new THREE.DirectionalLight('#ffffff', 0.8);
directional.position.set(10, 20, 5);
scene.add(directional);

const textures = {
  dirt: createDirtTexture(),
  wood: createWoodTexture(),
  stone: createStoneTexture(),
};

const materials = {
  dirt: new THREE.MeshStandardMaterial({ map: textures.dirt }),
  wood: new THREE.MeshStandardMaterial({ map: textures.wood }),
  stone: new THREE.MeshStandardMaterial({ map: textures.stone }),
};

const blocks = [];
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);

function addBlock(x, y, z, type) {
  const mesh = new THREE.Mesh(blockGeometry, materials[type]);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  blocks.push(mesh);
}

function buildWorld(seed) {
  blocks.forEach((mesh) => scene.remove(mesh));
  blocks.length = 0;

  const rng = mulberry32(seed);

  for (let x = -10; x <= 10; x += 1) {
    for (let z = -10; z <= 10; z += 1) {
      addBlock(x, 0, z, 'dirt');

      if (rng() > 0.85) {
        addBlock(x, 1, z, 'stone');
      }

      if (rng() > 0.92) {
        addBlock(x, 1, z, 'wood');
        addBlock(x, 2, z, 'wood');
      }
    }
  }
}

function startGame(mode) {
  state.running = true;
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  worldStatus.textContent = `Мир: ${mode}`;
  canvas.requestPointerLock();
}

function setSelected(block) {
  state.selectedBlock = block;
  inventorySlots.forEach((slot) => {
    slot.classList.toggle('active', slot.dataset.block === block);
  });
}

function saveWorld() {
  const data = {
    seed: state.seed,
    position: camera.position.toArray(),
    rotation: [camera.rotation.x, camera.rotation.y],
    selectedBlock: state.selectedBlock,
  };
  localStorage.setItem('blockcraft-lite-save', JSON.stringify(data));
  worldStatus.textContent = 'Мир: сохранено';
}

function loadWorld() {
  const raw = localStorage.getItem('blockcraft-lite-save');
  if (!raw) {
    worldStatus.textContent = 'Мир: нет сохранений';
    return false;
  }
  const data = JSON.parse(raw);
  state.seed = data.seed;
  buildWorld(state.seed);
  camera.position.fromArray(data.position);
  camera.rotation.set(data.rotation[0], data.rotation[1], 0);
  setSelected(data.selectedBlock);
  return true;
}

openSettingsButton.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

sensitivityInput.addEventListener('input', (event) => {
  state.sensitivity = Number(event.target.value);
});

volumeInput.addEventListener('input', (event) => {
  state.volume = Number(event.target.value) / 100;
});

newGameButton.addEventListener('click', () => {
  state.seed = Math.floor(Math.random() * 100000);
  buildWorld(state.seed);
  camera.position.set(0, 2, 6);
  camera.rotation.set(0, 0, 0);
  setSelected('dirt');
  startGame('новый');
});

loadGameButton.addEventListener('click', () => {
  if (loadWorld()) {
    startGame('загружен');
  } else {
    buildWorld(state.seed);
    startGame('новый');
  }
});

saveWorldButton.addEventListener('click', saveWorld);

exitWorldButton.addEventListener('click', () => {
  document.exitPointerLock();
  state.running = false;
  menu.classList.remove('hidden');
  hud.classList.add('hidden');
});

inventorySlots.forEach((slot) => {
  slot.addEventListener('click', () => setSelected(slot.dataset.block));
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
      state.move.forward = true;
      break;
    case 'KeyS':
      state.move.backward = true;
      break;
    case 'KeyA':
      state.move.left = true;
      break;
    case 'KeyD':
      state.move.right = true;
      break;
    case 'Space':
      state.move.jump = true;
      break;
    case 'Digit1':
      setSelected('dirt');
      break;
    case 'Digit2':
      setSelected('wood');
      break;
    case 'Digit3':
      setSelected('stone');
      break;
    default:
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
      state.move.forward = false;
      break;
    case 'KeyS':
      state.move.backward = false;
      break;
    case 'KeyA':
      state.move.left = false;
      break;
    case 'KeyD':
      state.move.right = false;
      break;
    case 'Space':
      state.move.jump = false;
      break;
    default:
      break;
  }
});

canvas.addEventListener('click', () => {
  if (!state.running) return;
  canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  state.isPointerLocked = document.pointerLockElement === canvas;
});

window.addEventListener('mousemove', (event) => {
  if (!state.isPointerLocked) return;
  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;
  camera.rotation.y -= movementX * 0.002 * state.sensitivity;
  camera.rotation.x -= movementY * 0.002 * state.sensitivity;
  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
});

function updateMovement(delta) {
  const speed = 6;
  const gravity = 18;
  const jumpStrength = 8;

  state.direction.set(0, 0, 0);
  if (state.move.forward) state.direction.z -= 1;
  if (state.move.backward) state.direction.z += 1;
  if (state.move.left) state.direction.x -= 1;
  if (state.move.right) state.direction.x += 1;
  state.direction.normalize();

  const yaw = camera.rotation.y;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(-1);
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

  const moveVector = new THREE.Vector3();
  moveVector.addScaledVector(forward, state.direction.z);
  moveVector.addScaledVector(right, state.direction.x);

  camera.position.addScaledVector(moveVector, speed * delta);

  if (camera.position.y <= 2) {
    state.velocity.y = 0;
    camera.position.y = 2;
    if (state.move.jump) {
      state.velocity.y = jumpStrength;
    }
  } else {
    state.velocity.y -= gravity * delta;
  }

  camera.position.y += state.velocity.y * delta;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (state.running) {
    updateMovement(delta);
  }
  renderer.render(scene, camera);
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createDirtTexture() {
  return createTexture('#8b5a2b', ['#6b4f2a', '#5c4321', '#9c6b32']);
}

function createWoodTexture() {
  return createTexture('#a97142', ['#7b4d24', '#8b5a2b', '#c48a4d'], true);
}

function createStoneTexture() {
  return createTexture('#9ca3af', ['#6b7280', '#52525b', '#bfc7d5']);
}

function createTexture(base, accents, stripes = false) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 120; i += 1) {
    ctx.fillStyle = accents[Math.floor(Math.random() * accents.length)];
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const w = Math.floor(Math.random() * 6) + 2;
    const h = Math.floor(Math.random() * 6) + 2;
    ctx.fillRect(x, y, w, h);
  }

  if (stripes) {
    ctx.strokeStyle = 'rgba(60, 34, 20, 0.6)';
    ctx.lineWidth = 4;
    for (let y = 0; y < size; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + 6);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipMapNearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

buildWorld(state.seed);
animate();
