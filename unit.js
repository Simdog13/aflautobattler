// unit.js (fatigue thresholds + stamina logic + recovery behavior + movement reset logic)

export function createUnit(template, x, y, cols) {
  return {
    ...template,
    x,
    y,
    i: y * cols + x,
    stamina: 100,
    state: 'chase',
    _lastLoggedState: null,
    homeX: x,
    homeY: y
  };
}

export function handleUnitMovement(unit, grid, Ball, cols, scoreCallback, gamePhase) {
  const rows = Math.floor(grid.length / cols);
  const isFree = (x, y) =>
    x >= 0 && y >= 0 && x < cols && y < rows && !grid[y * cols + x]?.occupant;

  const move = (dx, dy) => {
    const nx = unit.x + dx;
    const ny = unit.y + dy;
    const ni = ny * cols + nx;
    if (isFree(nx, ny)) {
      grid[unit.i].occupant = null;
      unit.x = nx;
      unit.y = ny;
      unit.i = ni;
      grid[ni].occupant = unit;
      return true;
    }
    return false;
  };

  const logState = () => {
    if (unit._lastLoggedState !== unit.state) {
      console.log(`[STATE] ${unit.name} → ${unit.state}`);
      unit._lastLoggedState = unit.state;
    }
  };

  const fatigueThresholds = {
    minor: 70,
    tired: 40,
    exhausted: 10
  };

  const staminaCost = {
    idle: -2,
    recover: -3,
    chase: 5,
    carry: 3,
    support: 2,
    shadow: 1,
    anticipate: 3,
    fatigue: -1
  };

  const cost = staminaCost[unit.state] ?? 0;
  unit.stamina = Math.max(0, Math.min(100, unit.stamina - cost));

  if (unit.stamina <= fatigueThresholds.exhausted) {
    unit.state = 'fatigue';
  } else if (unit.state === 'fatigue' && unit.stamina > fatigueThresholds.tired) {
    unit.state = 'recover';
  }

  logState();

  if (gamePhase === 'resetPlay') {
    if (unit.x !== unit.homeX || unit.y !== unit.homeY) {
      const dx = Math.sign(unit.homeX - unit.x);
      const dy = Math.sign(unit.homeY - unit.y);
      move(dx, dy);
    } else {
      unit.state = 'idle';
    }
    return;
  } else if (gamePhase === 'behindReset') {
    const opp = findOpponent(unit, grid, cols);
    if (opp) {
      const dx = Math.sign(opp.x - unit.x);
      const dy = Math.sign(opp.y - unit.y);
      move(dx, dy);
    }
    return;
  }

  switch (unit.state) {
    case 'chase': {
      if (unit.stamina < fatigueThresholds.tired || Ball.state !== 'live') break;
      if (Ball.carrier === unit) {
        unit.state = 'carry';
        break;
      }
      const bx = Ball.carrier ? Ball.carrier.x : Ball.index % cols;
      const by = Ball.carrier ? Ball.carrier.y : Math.floor(Ball.index / cols);
      const dx = Math.sign(bx - unit.x);
      const dy = Math.sign(by - unit.y);
      if (!move(dx, dy)) {
        const altDirs = [
          [dx, 0],
          [0, dy],
          [dx, -dy],
          [-dx, dy],
          [-dx, -dy]
        ];
        for (const [ax, ay] of altDirs) {
          if (move(ax, ay)) break;
        }
      }
      if (!Ball.carrier && Ball.index === unit.i) {
        Ball.pickUp(unit);
        unit.state = 'carry';
      }
      break;
    }

    case 'carry': {
      if (Ball.state !== 'live') break;
      const targetX = unit.x + 1;
      const cell = grid[unit.i];

      if (cell?.isScorable && unit.x >= cols - 2) {
        if (cell.zoneType === 'forwardPocket') {
          scoreCallback?.(6, `${unit.name} scores GOAL from pocket!`, 'goal');
        } else {
          scoreCallback?.(1, `${unit.name} kicks a BEHIND.`, 'behind');
        }
        unit.state = 'idle';
        break;
      }

      const moved = move(1, 0);
      if (!moved) {
        move(1, Math.random() > 0.5 ? 1 : -1);
      }
      break;
    }

    case 'recover': {
      if (unit.stamina >= 90) unit.state = 'idle';
      break;
    }

    case 'idle':
    case 'shadow':
    case 'anticipate':
    case 'fatigue':
      break;

    default:
      console.warn(`Unhandled state: ${unit.state}`);
      break;
  }

  // Soft re-engagement
  if (
    Ball.state === 'live' &&
    !Ball.carrier &&
    (unit.state === 'idle' || unit.state === 'recover') &&
    unit.stamina > 50 &&
    Math.random() < 0.2
  ) {
    unit.state = 'chase';
  }
}

function findOpponent(unit, grid, cols) {
  // Simple placeholder: find the closest other-side unit
  const candidates = grid.filter((cell) => cell?.occupant?.side !== unit.side);
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const da = Math.abs(a.occupant.x - unit.x) + Math.abs(a.occupant.y - unit.y);
    const db = Math.abs(b.occupant.x - unit.x) + Math.abs(b.occupant.y - unit.y);
    return da - db;
  });
  return candidates[0]?.occupant;
}
