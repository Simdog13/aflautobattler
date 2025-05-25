export function buildUILayout() {
  const appContainer = document.createElement('div');
  appContainer.id = 'appContainer';
  appContainer.style.position = 'absolute';
  appContainer.style.top = '0';
  appContainer.style.left = '0';
  appContainer.style.width = '100%';
  appContainer.style.height = '100%';
  appContainer.style.display = 'flex';
  appContainer.style.flexDirection = 'column';
  appContainer.style.justifyContent = 'space-between';
  appContainer.style.alignItems = 'center';
  document.body.appendChild(appContainer);

  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.justifyContent = 'space-between';
  topRow.style.width = '100%';

  const scorePanel = createPanel('scorePanel');
  scorePanel.style.margin = '1rem';
  scorePanel.innerHTML = `
    <div>Q1: <span id="scoreQ1">0.0</span></div>
    <div>Q2: <span id="scoreQ2">0.0</span></div>
    <div>Q3: <span id="scoreQ3">0.0</span></div>
    <div>FT: <span id="scoreFT">0.0</span></div>
    <div>Tick: <span id="tickCount">0</span></div>
    <div>Ball: <span id="ballStatus">-</span></div>
    <div>Units: <span id="unitCount">0</span></div>
  `;

  const logPanel = createPanel('actionLog');
  logPanel.style.margin = '1rem';
  logPanel.style.maxHeight = '120px';
  logPanel.style.overflowY = 'auto';
  logPanel.style.flexGrow = '1';

  topRow.appendChild(scorePanel);
  topRow.appendChild(logPanel);
  appContainer.appendChild(topRow);

  const gridWrapper = document.createElement('div');
  gridWrapper.id = 'gridWrapper';
  gridWrapper.style.display = 'flex';
  gridWrapper.style.justifyContent = 'center';
  gridWrapper.style.alignItems = 'center';
  gridWrapper.appendChild(document.getElementById('fieldCanvas'));
  appContainer.appendChild(gridWrapper);

  const taskbar = createPanel('taskbar');
  taskbar.style.display = 'flex';
  taskbar.style.justifyContent = 'center';
  taskbar.style.gap = '0.5rem';
  taskbar.style.margin = '1rem';

  const buttonDefs = [
    ['startSimBtn', 'Start Sim'],
    ['pauseSimBtn', 'Pause Sim'],
    ['deployTeamBtn', 'Deploy Team'],
    ['speedUpBtn', 'Speed +'],
    ['speedDownBtn', 'Speed -'],
    ['createUnitBtn', 'Create Unit']
  ];

  buttonDefs.forEach(([id, label]) => {
    const btn = createButton(id, label, () => {});
    taskbar.appendChild(btn);
  });

  appContainer.appendChild(taskbar);
}

function createPanel(id) {
  const panel = document.createElement('div');
  panel.id = id;
  panel.className = 'ui-panel';
  return panel;
}

function createButton(id, label, onClick) {
  const btn = document.createElement('button');
  btn.id = id;
  btn.textContent = label;
  btn.onclick = onClick;
  return btn;
}

// === Exported Utility Methods ===

export function updateText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function appendLog(panelId, message) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const line = document.createElement('div');
  line.textContent = message;
  panel.appendChild(line);
  panel.scrollTop = panel.scrollHeight;
}

export function setButtonState(id, { disabled = false, text = null } = {}) {
  const btn = document.getElementById(id);
  if (btn) {
    btn.disabled = disabled;
    if (text !== null) btn.textContent = text;
  }
}
