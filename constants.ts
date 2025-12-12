import { Template, ProjectState } from './types';

export const BLANK_CODE: ProjectState = {
  html: `<div id="game-container">
  <h1>New Game</h1>
  <canvas id="gameCanvas" width="600" height="400"></canvas>
  <p>Edit game.js to bring this to life!</p>
</div>`,
  css: `body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #1a1a1a;
  color: #eee;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
}

#game-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

canvas {
  background-color: #000;
  border: 2px solid #444;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  display: block;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #6366f1;
}`,
  js: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let time = 0;

function gameLoop() {
  time += 0.05;
  
  // Clear screen
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw bouncing box
  const x = canvas.width / 2 + Math.sin(time) * 100;
  const y = canvas.height / 2 + Math.cos(time * 1.5) * 50;
  
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(x - 25, y - 25, 50, 50);
  
  // Draw text
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Press Run to update!', canvas.width/2, canvas.height - 20);

  requestAnimationFrame(gameLoop);
}

// Start
gameLoop();`
};

const COIN_COLLECTOR_CODE: ProjectState = {
  html: `<div id="game-container">
  <canvas id="gameCanvas" width="600" height="400"></canvas>
  <div id="ui-layer">
    <div id="score">Score: 0</div>
    <div id="timer">Time: 60</div>
  </div>
  <div id="game-over" class="hidden">
    <h1>Game Over!</h1>
    <p>Final Score: <span id="final-score">0</span></p>
    <button onclick="resetGame()">Play Again</button>
  </div>
</div>`,
  css: `body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #222;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

#game-container {
  position: relative;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  border: 4px solid #444;
  border-radius: 8px;
}

canvas {
  background-color: #333;
  display: block;
}

#ui-layer {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

#score, #timer {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 1px 1px 2px black;
}

#game-over {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  border: 2px solid #fff;
}

.hidden {
  display: none;
}

button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  margin-top: 10px;
}

button:hover {
  background: #45a049;
}`,
  js: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

// Game State
let score = 0;
let timeLeft = 60;
let isGameActive = true;
let animationId;
let lastTime = 0;

// Player
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 30,
  speed: 300,
  color: '#3498db'
};

// Input
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Coins
const coins = [];
const COIN_SIZE = 15;

function spawnCoin() {
  coins.push({
    x: Math.random() * (canvas.width - COIN_SIZE),
    y: Math.random() * (canvas.height - COIN_SIZE),
    size: COIN_SIZE,
    color: '#f1c40f'
  });
}

function update(deltaTime) {
  if (!isGameActive) return;

  const moveStep = player.speed * deltaTime;
  if (keys['ArrowUp'] || keys['w']) player.y -= moveStep;
  if (keys['ArrowDown'] || keys['s']) player.y += moveStep;
  if (keys['ArrowLeft'] || keys['a']) player.x -= moveStep;
  if (keys['ArrowRight'] || keys['d']) player.x += moveStep;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    if (
      player.x < c.x + c.size &&
      player.x + player.size > c.x &&
      player.y < c.y + c.size &&
      player.y + player.size > c.y
    ) {
      coins.splice(i, 1);
      score += 10;
      scoreEl.textContent = 'Score: ' + score;
      spawnCoin();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);
  
  for (const c of coins) {
    ctx.beginPath();
    ctx.arc(c.x + c.size/2, c.y + c.size/2, c.size/2, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.strokeStyle = '#d4ac0d';
    ctx.stroke();
  }
}

function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  update(deltaTime);
  draw();
  if (isGameActive) requestAnimationFrame(gameLoop);
}

function endGame() {
  isGameActive = false;
  gameOverEl.classList.remove('hidden');
  finalScoreEl.textContent = score;
}

const timerInterval = setInterval(() => {
  if (!isGameActive) return;
  timeLeft--;
  timerEl.textContent = 'Time: ' + timeLeft;
  if (timeLeft <= 0) endGame();
}, 1000);

function resetGame() {
  score = 0;
  timeLeft = 60;
  isGameActive = true;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  coins.length = 0;
  scoreEl.textContent = 'Score: 0';
  timerEl.textContent = 'Time: 60';
  gameOverEl.classList.add('hidden');
  spawnCoin(); spawnCoin(); spawnCoin();
  lastTime = performance.now();
  gameLoop(lastTime);
}

resetGame();
window.resetGame = resetGame;`
};

const PLATFORMER_CODE: ProjectState = {
  html: `<div id="game-container">
  <canvas id="gameCanvas" width="600" height="400"></canvas>
  <div id="ui">Controls: Arrows / Space to Jump</div>
</div>`,
  css: `body {
  background: #1e1e2e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}
#game-container {
  border: 4px solid #333;
  position: relative;
}
#ui {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.6);
  padding: 8px 12px;
  border-radius: 4px;
  font-family: sans-serif;
  pointer-events: none;
}`,
  js: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = { x: 50, y: 200, w: 30, h: 30, dx: 0, dy: 0, grounded: false };
const gravity = 0.6;
const friction = 0.8;
const jumpPower = -12;
const speed = 5;

const platforms = [
  { x: 0, y: 350, w: 600, h: 50 },
  { x: 200, y: 260, w: 200, h: 20 },
  { x: 50, y: 150, w: 100, h: 20 },
  { x: 400, y: 150, w: 100, h: 20 },
  { x: 250, y: 80, w: 100, h: 20 }
];

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function update() {
  if (keys['ArrowRight']) player.dx = speed;
  else if (keys['ArrowLeft']) player.dx = -speed;
  else player.dx *= friction;

  if ((keys['ArrowUp'] || keys[' ']) && player.grounded) {
    player.dy = jumpPower;
    player.grounded = false;
  }

  player.dy += gravity;
  player.x += player.dx;
  player.y += player.dy;
  player.grounded = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw Platforms
  ctx.fillStyle = '#6c5ce7';
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Collision
    if (player.x < p.x + p.w && player.x + player.w > p.x &&
        player.y < p.y + p.h && player.y + player.h > p.y) {
      if (player.dy > 0 && player.y + player.h - player.dy <= p.y) {
        player.grounded = true;
        player.dy = 0;
        player.y = p.y - player.h;
      }
    }
  });

  // Boundaries
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
  if (player.y > canvas.height) { player.x = 50; player.y = 200; player.dy = 0; }

  // Draw Player
  ctx.fillStyle = '#ff7675';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  requestAnimationFrame(update);
}

update();`
};

const RUNNER_CODE: ProjectState = {
  html: `<div id="game-container">
  <canvas id="gameCanvas" width="800" height="300"></canvas>
  <div id="score-board">Score: <span id="score">0</span></div>
  <div id="start-msg">Press Space to Jump / Start</div>
</div>`,
  css: `body {
  margin: 0;
  background: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: 'Arial', sans-serif;
}
#game-container { position: relative; border: 2px solid #fff; }
#score-board { position: absolute; top: 10px; right: 20px; color: #fff; font-size: 20px; font-weight: bold; }
#start-msg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 5px; }`,
  js: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const msgEl = document.getElementById('start-msg');

let playing = false;
let score = 0;
let speed = 5;
let frame = 0;

const dino = { x: 50, y: 250, w: 30, h: 30, dy: 0, jumpPower: -12, grounded: true };
const obstacles = [];

function reset() {
  playing = true;
  score = 0;
  speed = 5;
  obstacles.length = 0;
  dino.y = 250;
  dino.dy = 0;
  msgEl.style.display = 'none';
  loop();
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (!playing) reset();
    else if (dino.grounded) {
      dino.dy = dino.jumpPower;
      dino.grounded = false;
    }
  }
});

function loop() {
  if (!playing) return;
  requestAnimationFrame(loop);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  // Dino Physics
  dino.dy += 0.6; // Gravity
  dino.y += dino.dy;
  
  if (dino.y >= 250) {
    dino.y = 250;
    dino.dy = 0;
    dino.grounded = true;
  }
  
  // Obstacles
  if (frame++ % 100 === 0) {
    obstacles.push({ x: canvas.width, w: 20 + Math.random()*20, h: 30 + Math.random()*20 });
    speed += 0.1;
  }
  
  ctx.fillStyle = '#ff6b6b';
  obstacles.forEach((obs, i) => {
    obs.x -= speed;
    ctx.fillRect(obs.x, 280 - obs.h, obs.w, obs.h);
    
    // Collision
    if (dino.x < obs.x + obs.w && dino.x + dino.w > obs.x &&
        dino.y < 280 && dino.y + dino.h > 280 - obs.h) {
      playing = false;
      msgEl.innerText = "Game Over! Press Space";
      msgEl.style.display = 'block';
    }
    
    // Score
    if (obs.x + obs.w < dino.x && !obs.passed) {
      score++;
      obs.passed = true;
      scoreEl.innerText = score;
    }
  });
  
  // Remove off-screen
  if (obstacles.length && obstacles[0].x < -100) obstacles.shift();

  // Draw Dino
  ctx.fillStyle = '#4ecdc4';
  ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
  
  // Ground
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 280, canvas.width, 2);
}`
};

const SHOOTER_CODE: ProjectState = {
  html: `<div id="game-container">
  <canvas id="gameCanvas" width="600" height="600"></canvas>
  <div id="hud">Score: <span id="score">0</span> | Lives: <span id="lives">3</span></div>
</div>`,
  css: `body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
#game-container { position: relative; }
canvas { border: 1px solid #333; }
#hud { position: absolute; top: 10px; left: 10px; font-family: monospace; font-size: 18px; color: #0f0; }`,
  js: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = { x: 300, y: 550, size: 20, speed: 5, color: '#00ffff' };
const bullets = [];
const enemies = [];
const particles = [];
let score = 0;
let lives = 3;
let frame = 0;
const keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function loop() {
  requestAnimationFrame(loop);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Trails
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if (lives <= 0) {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '40px monospace';
    ctx.fillText("GAME OVER", 300, 300);
    return;
  }

  // Player
  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < canvas.width) player.x += player.speed;
  if (keys[' ']) {
    if (frame % 10 === 0) bullets.push({ x: player.x, y: player.y, speed: 7 });
  }

  // Draw Player
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.size);
  ctx.lineTo(player.x - player.size, player.y + player.size);
  ctx.lineTo(player.x + player.size, player.y + player.size);
  ctx.fill();

  // Bullets
  ctx.fillStyle = '#ff0';
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.y -= b.speed;
    ctx.fillRect(b.x - 2, b.y, 4, 10);
    if (b.y < 0) bullets.splice(i, 1);
  }

  // Enemies
  if (frame % 40 === 0) {
    enemies.push({ x: Math.random() * canvas.width, y: -20, size: 20 + Math.random()*20, speed: 1 + Math.random() * 2 });
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.y += e.speed;
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x - e.size/2, e.y - e.size/2, e.size, e.size);
    
    // Collision with Player
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    if (Math.sqrt(dx*dx + dy*dy) < e.size + player.size) {
      lives--;
      document.getElementById('lives').innerText = lives;
      enemies.splice(i, 1);
      createExplosion(e.x, e.y);
    }
    
    // Collision with Bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (b.x > e.x - e.size/2 && b.x < e.x + e.size/2 && b.y > e.y - e.size/2 && b.y < e.y + e.size/2) {
        score += 10;
        document.getElementById('score').innerText = score;
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        createExplosion(e.x, e.y);
        break;
      }
    }
    
    if (e.y > canvas.height) enemies.splice(i, 1);
  }
  
  // Particles
  updateParticles();
  
  frame++;
}

function createExplosion(x, y) {
  for(let i=0; i<10; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 20,
      color: \`hsl(\${Math.random()*60 + 10}, 100%, 50%)\`
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
    if(p.life <= 0) particles.splice(i,1);
  }
}

loop();`
};

const PUZZLE_CODE: ProjectState = {
  html: `<div id="game-container">
  <h1>15 Puzzle</h1>
  <canvas id="gameCanvas" width="400" height="400"></canvas>
  <button onclick="shuffle()">Shuffle</button>
</div>`,
  css: `body {
  background: #2d3436;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  font-family: sans-serif;
}
#game-container { text-align: center; }
canvas { background: #000; border-radius: 4px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); cursor: pointer; }
button { margin-top: 15px; padding: 10px 20px; font-size: 16px; background: #0984e3; border: none; color: white; border-radius: 5px; cursor: pointer; }
button:hover { background: #74b9ff; }`,
  js: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const SIZE = 4;
const TILE_SIZE = 100;
let tiles = [];
let empty = { r: 3, c: 3 };

function init() {
  tiles = [];
  for (let r = 0; r < SIZE; r++) {
    tiles[r] = [];
    for (let c = 0; c < SIZE; c++) {
      if (r === SIZE - 1 && c === SIZE - 1) {
        tiles[r][c] = 0; // Empty slot
      } else {
        tiles[r][c] = r * SIZE + c + 1;
      }
    }
  }
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = tiles[r][c];
      if (val !== 0) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        ctx.fillStyle = '#dfe6e9';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#2d3436';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
      }
    }
  }
}

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const c = Math.floor(x / TILE_SIZE);
  const r = Math.floor(y / TILE_SIZE);
  move(r, c);
});

function move(r, c) {
  if (Math.abs(r - empty.r) + Math.abs(c - empty.c) === 1) {
    tiles[empty.r][empty.c] = tiles[r][c];
    tiles[r][c] = 0;
    empty = { r, c };
    draw();
    checkWin();
  }
}

function shuffle() {
  for (let i = 0; i < 1000; i++) {
    const neighbors = [];
    if (empty.r > 0) neighbors.push({ r: empty.r - 1, c: empty.c });
    if (empty.r < SIZE - 1) neighbors.push({ r: empty.r + 1, c: empty.c });
    if (empty.c > 0) neighbors.push({ r: empty.r, c: empty.c - 1 });
    if (empty.c < SIZE - 1) neighbors.push({ r: empty.r, c: empty.c + 1 });
    const rand = neighbors[Math.floor(Math.random() * neighbors.length)];
    move(rand.r, rand.c);
  }
}

function checkWin() {
  let count = 1;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (r === SIZE - 1 && c === SIZE - 1) return; // Ignore last
      if (tiles[r][c] !== count++) return;
    }
  }
  setTimeout(() => alert("You Win!"), 100);
}

init();
shuffle();
window.shuffle = shuffle;`
};

export const TEMPLATES: Template[] = [
  {
    id: 'coin-collector',
    name: 'Coin Collector',
    description: 'Top-down arcade. Collect coins, avoid timeout.',
    code: COIN_COLLECTOR_CODE
  },
  {
    id: 'platformer',
    name: 'Platformer',
    description: 'Side-scrolling physics with gravity and jumps.',
    code: PLATFORMER_CODE
  },
  {
    id: 'runner',
    name: 'Endless Runner',
    description: 'Jump over procedurally generated obstacles.',
    code: RUNNER_CODE
  },
  {
    id: 'shooter',
    name: 'Space Shooter',
    description: 'Shoot enemies, dodge attacks, particle effects.',
    code: SHOOTER_CODE
  },
  {
    id: 'puzzle',
    name: '15-Puzzle',
    description: 'Classic sliding tile logic game.',
    code: PUZZLE_CODE
  }
];