// game.js (updated with clear game flow and kickout logic)11111111111111111111111

import * as BallModule from './ball.js';
import * as UnitModule from './unit.js';
import * as UI from './ui.js';
import { GameState } from './gamestate.js';
import { drawField } from './field.js';

let canvas, ctx;
let backgroundCanvas, backgroundCtx;
const cols = 40;
const rows = 30;
const cellSize = 20;
const grid = [];
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < cols; x++) {
    grid.push({
      x: x,
      y: y,
      occupant: null,
      isBoundary: false,
      zoneType: getZone(x),
      isScorable: false
    });
  }
}

const units = [];
let infiniteStaminaEnabled = false;

const DevTools = {
  log(category, msg, data = {}) {
    const timestamp = (performance.now() / 1000).toFixed(1);
    const formatted = `[${timestamp}] ${category.toUpperCase()} → ${msg}`;
    UI.appendLog('actionLog', formatted);
    console.log(formatted, data);
  }
};

function getZone(x) {
  if (x < cols / 3) return 'defensive';
  if (x < (2 * cols) / 3) return 'midfield';
  return 'forward';
}

function createFieldCell(x, y) {
  return {
    x,
    y,
    occupant: null,
    isGoalSquare: false,
    isBoundary: false,
    isScorable: false,
    zoneType: '',
    terrainBonus: null
  };
}

function buildGrid() {
  grid.length = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = createFieldCell(x, y);

      // Properly assign zoneType based on x
      cell.zoneType = getZone(x);

      // THEN do all your special overrides like goal square, boundary etc
      if ((x <= 2 || x >= cols - 3) && y >= 12 && y <= 17) {
        cell.isGoalSquare = true;
        cell.isScorable = true;
      }
      if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) {
        cell.isBoundary = true;
      }
      if ((x === 38 && y >= 12 && y <= 14) || (x === 38 && y >= 16 && y <= 18)) {
        cell.zoneType = 'forwardPocket'; // special override
        cell.terrainBonus = { accuracy: 1 };
        cell.isScorable = true;
      }
      const arcLeft = Math.sqrt((x - 5) ** 2 + (y - 15) ** 2);
      const arcRight = Math.sqrt((x - (cols - 6)) ** 2 + (y - 15) ** 2);
      if ((arcLeft >= 7 && arcLeft <= 8) || (arcRight >= 7 && arcRight <= 8)) {
        cell.is50Arc = true;
      }

      grid.push(cell);
    }
  }
}

function updateBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas first

  // Draw units
  for (const unit of units) {
    ctx.fillStyle = unit.side === 'home' ? '#3AAFB9' : '#FE5D26';
    ctx.fillRect(unit.x * cellSize, unit.y * cellSize, cellSize, cellSize);
    ctx.fillStyle = '#000';
    ctx.fillText(`${unit.name}`, unit.x * cellSize + 1, unit.y * cellSize + 12);
  }

  // Draw ball
  if (BallModule.Ball.carrier) {
    ctx.beginPath();
    ctx.arc(
      BallModule.Ball.carrier.x * cellSize + cellSize / 2,
      BallModule.Ball.carrier.y * cellSize + cellSize / 2,
      5,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'yellow';
    ctx.fill();
  } else if (BallModule.Ball.index !== null) {
    const bx = BallModule.Ball.index % cols;
    const by = Math.floor(BallModule.Ball.index / cols);
    ctx.beginPath();
    ctx.arc(bx * cellSize + cellSize / 2, by * cellSize + cellSize / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
  }

  // Update UI elements
  UI.updateText('tickCount', `${GameState.tick}`);
  UI.updateText('unitCount', `${units.length}`);
  UI.updateText(
    'ballStatus',
    BallModule.Ball.carrier
      ? `Ball with ${BallModule.Ball.carrier.name}`
      : `Ball at ${BallModule.Ball.index}`
  );
  UI.updateText('scoreQ1', GameState.getScoreString('home'));
}

function runSimulationTick() {
  if (GameState.phase !== 'play') return;

  GameState.tick++;
  GameState.updateTimer(); // ⏱️ Decrement timeLeft and handle Q transitions if needed

  units.forEach((u) =>
    UnitModule.handleUnitMovement(
      u,
      grid,
      BallModule.Ball,
      cols,
      (points, msg, type) => {
        DevTools.log('score', msg);

        const team = u.side;
        if (type === 'goal') {
          GameState.score[team].goals++;
          BallModule.Ball.reset(cols, rows);
          BallModule.Ball.state = 'dead';
          GameState.phase = 'resetPlay';
          setTimeout(() => restartPlay(), 1000);
        } else if (type === 'behind') {
          GameState.score[team].behinds++;
          BallModule.Ball.state = 'dead';
          GameState.phase = 'kickoutPlay';
          setTimeout(() => {
            const kickout = units.find((u) => u.role === 'd' && u.side === 'home');
            if (kickout) {
              kickout.x = 1;
              kickout.y = Math.floor(rows / 2);
              kickout.i = kickout.y * cols + kickout.x;
              BallModule.Ball.pickUp(kickout);
              kickout.state = 'carry';
            }
            BallModule.Ball.state = 'live';
            GameState.phase = 'play';
          }, 1000);
        }
      },
      infiniteStaminaEnabled
    )
  );

  BallModule.Ball.update(grid, cols);
  updateBoard();

  // 🧠 Update UI
  const scoreElId = `scoreQ${GameState.quarter}`;
  UI.updateText(scoreElId, GameState.getScoreString('home'));

  const mins = Math.floor(GameState.timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const secs = (GameState.timeLeft % 60).toString().padStart(2, '0');
  UI.updateText('quarterTimer', `${mins}:${secs}`);
}

function restartPlay() {
  BallModule.Ball.reset(cols, rows);
  BallModule.Ball.state = 'live';
  GameState.phase = 'play';
  DevTools.log('info', 'Restarting play after goal');
}

function deployTeam(side) {
  const positions = {
    d: [
      [1, 8],
      [1, 15],
      [1, 22],
      [5, 8],
      [5, 15],
      [5, 22]
    ],
    m: [
      [15, 8],
      [15, 22],
      [18, 13],
      [19, 15],
      [20, 17]
    ],
    f: [
      [34, 8],
      [34, 15],
      [34, 22],
      [38, 8],
      [38, 15],
      [38, 22]
    ]
  };

  Object.entries(positions).forEach(([role, spots]) => {
    spots.forEach(([x, y], i) => {
      const name = `${role}_${side}_${i + 1}`;
      const unit = UnitModule.createUnit({ name, role, side }, x, y, cols);
      units.push(unit);
      grid[y * cols + x].occupant = unit;
      DevTools.log('DEPLOY', `Deployed ${name} to (${x}, ${y})`, unit);
    });
  });
  UI.updateText('unitCount', units.length);
  DevTools.log('info', 'Team deployed');

  updateBoard();
}

window.onload = () => {
  canvas = document.getElementById('fieldCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  backgroundCanvas = document.getElementById('backgroundCanvas');
  backgroundCtx = backgroundCanvas.getContext('2d');
  backgroundCanvas.width = cols * cellSize;
  backgroundCanvas.height = rows * cellSize;

  drawField(backgroundCtx, cols, rows, cellSize, grid); // Background field

  buildGrid();
  BallModule.Ball.reset(cols, rows);
  BallModule.Ball.state = 'live';
  GameState.phase = 'play';

  document.getElementById('startSimBtn').onclick = () => {
    if (!GameState.interval) {
      GameState.interval = setInterval(runSimulationTick, GameState.speed);
      UI.setButtonState('pauseSimBtn', { disabled: false });
      DevTools.log('info', 'Simulation started');
    }
  };

  document.getElementById('pauseSimBtn').onclick = () => {
    if (GameState.interval) {
      clearInterval(GameState.interval);
      GameState.interval = null;
      DevTools.log('info', 'Simulation paused');
    }
  };

  document.getElementById('deployTeamBtn').onclick = () => deployTeam('home');

  document.getElementById('speedUpBtn').onclick = () => {
    GameState.speed = Math.max(50, GameState.speed - 50);
    if (GameState.interval) {
      clearInterval(GameState.interval);
      GameState.interval = setInterval(runSimulationTick, GameState.speed);
    }
    DevTools.log('info', `Speed increased: ${GameState.speed}ms`);
  };

  document.getElementById('speedDownBtn').onclick = () => {
    GameState.speed += 50;
    if (GameState.interval) {
      clearInterval(GameState.interval);
      GameState.interval = setInterval(runSimulationTick, GameState.speed);
    }
    DevTools.log('info', `Speed decreased: ${GameState.speed}ms`);
  };

  document.getElementById('createUnitToggle').onclick = () => {
    const form = document.getElementById('unitForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  };

  updateBoard();
  DevTools.log('info', 'Game initialized');
};
