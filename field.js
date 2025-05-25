// field.js

export function drawField(ctx, cols, rows, cellSize, grid) {
  // Step 1: Shade field zones based on grid.zoneType
  for (const cell of grid) {
    ctx.fillStyle = '#e0ffe0'; // Default defensive
    if (cell.zoneType === 'midfield') ctx.fillStyle = '#d0e0ff'; // Light blue
    if (cell.zoneType === 'forward') ctx.fillStyle = '#ffd0d0'; // Light red
    if (cell.zoneType === 'forwardPocket') ctx.fillStyle = '#ffe0e0'; // Special pocket
    if (cell.isBoundary) ctx.fillStyle = '#cfcfcf'; // Boundary

    ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
  }

  // Step 2: Draw oval boundary, centre circle, arcs etc next
  const centerX = Math.floor(cols / 2);
  const centerY = Math.floor(rows / 2);

  drawOvalBoundary(ctx, centerX, centerY, cols, rows, cellSize);
  drawCentreSquare(ctx, centerX, centerY, cellSize);
  drawCentreCircles(ctx, centerX, centerY, cellSize);
  drawFiftyMetreArcs(ctx, cols, rows, cellSize);
  drawGoalSquares(ctx, cols, rows, cellSize);
}

function drawOvalBoundary(ctx, h, k, cols, rows, cellSize) {
  const a = (cols / 2) * 0.9; // slightly inside grid
  const b = (rows / 2) * 0.9;

  ctx.beginPath();
  for (let theta = 0; theta <= 2 * Math.PI; theta += 0.01) {
    const x = h + a * Math.cos(theta);
    const y = k + b * Math.sin(theta);
    ctx.lineTo(x * cellSize, y * cellSize);
  }
  ctx.closePath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCentreSquare(ctx, h, k, cellSize) {
  const size = 10; // 10x10 cells
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    (h - size / 2) * cellSize,
    (k - size / 2) * cellSize,
    size * cellSize,
    size * cellSize
  );
}

function drawCentreCircles(ctx, h, k, cellSize) {
  const radii = [1, 2]; // small and large circles
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  radii.forEach((r) => {
    ctx.beginPath();
    ctx.arc(h * cellSize, k * cellSize, r * cellSize, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawFiftyMetreArcs(ctx, cols, rows, cellSize) {
  const r = 8 * cellSize; // 8 cells radius now

  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 1;

  const goals = [
    { x: 3, y: Math.floor(rows / 2) }, // Shifted inward
    { x: cols - 4, y: Math.floor(rows / 2) }
  ];

  goals.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.arc(x * cellSize, y * cellSize, r, Math.PI * 0.5, Math.PI * 1.5, x < cols / 2);
    ctx.stroke();
  });
}

function drawGoalSquares(ctx, cols, rows, cellSize) {
  const width = 3 * cellSize; // 3 cells wide
  const depth = 2 * cellSize; // 2 cells deep

  const goals = [
    { x: 0, y: Math.floor(rows / 2) - 1 }, // Left end
    { x: cols - 1, y: Math.floor(rows / 2) - 1 } // Right end
  ];

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;

  goals.forEach(({ x, y }) => {
    const leftX = x < cols / 2 ? x * cellSize : (x - 2) * cellSize;
    ctx.strokeRect(leftX, y * cellSize, width, depth);
  });
}
