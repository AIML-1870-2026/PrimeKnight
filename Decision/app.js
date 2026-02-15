// ── State ──

let state = {
  restaurants: [
    { id: 'r1', name: 'Scott Cafe' },
    { id: 'r2', name: "DJ's Dugout" },
  ],
  factors: [
    { id: 'f1', name: 'Cost', weight: 5, multiplier: 1, scores: { r1: 10, r2: 3 } },
    { id: 'f2', name: 'Food Quality', weight: 5, multiplier: 1, scores: { r1: 5, r2: 9 } },
    { id: 'f3', name: 'Time to Eat', weight: 5, multiplier: 1, scores: { r1: 8, r2: 4 } },
    { id: 'f4', name: 'Social Atmosphere', weight: 5, multiplier: 1, scores: { r1: 3, r2: 9 } },
    { id: 'f5', name: 'Walking Distance', weight: 5, multiplier: 1, scores: { r1: 9, r2: 4 } },
  ],
};

let bias = { targetId: 'r1', strength: 5, multiplier: 1 }; // habit bias toward Scott Cafe

const multiplierSteps = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4];

let particles = [];
let previousWinnerId = null;
let idCounter = 100;

function genId(prefix) {
  return prefix + (++idCounter);
}

// ── DOM Refs ──

const canvas = document.getElementById('network-canvas');
const ctx = canvas.getContext('2d');
const factorContainer = document.getElementById('factor-nodes');
const restaurantContainer = document.getElementById('restaurant-nodes');
const scoreBars = document.getElementById('score-bars');
const messageBar = document.getElementById('message-bar');
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const addFactorBtn = document.getElementById('add-factor-btn');
const addRestaurantBtn = document.getElementById('add-restaurant-btn');

// ── Scoring ──

function effectiveWeight(f) {
  return f.weight * (f.multiplier || 1);
}

function computeScores() {
  const scores = {};
  const effectiveBias = bias.strength * (bias.multiplier || 1);
  const totalWeight = state.factors.reduce((sum, f) => sum + effectiveWeight(f), 0) + effectiveBias;

  for (const r of state.restaurants) {
    if (totalWeight === 0) {
      scores[r.id] = 0;
    } else {
      let weighted = 0;
      for (const f of state.factors) {
        weighted += effectiveWeight(f) * (f.scores[r.id] ?? 0);
      }
      // Bias adds a full 10 score for the target restaurant, 0 for others
      if (r.id === bias.targetId) {
        weighted += effectiveBias * 10;
      }
      scores[r.id] = weighted / totalWeight;
    }
  }
  return scores;
}

function getWinnerIds(scores) {
  if (state.restaurants.length < 2) return [];
  const effectiveBias = bias.strength * (bias.multiplier || 1);
  const totalWeight = state.factors.reduce((sum, f) => sum + effectiveWeight(f), 0) + effectiveBias;
  if (totalWeight === 0) return [];

  let maxScore = -1;
  for (const id in scores) {
    if (scores[id] > maxScore) maxScore = scores[id];
  }
  return Object.keys(scores).filter((id) => Math.abs(scores[id] - maxScore) < 0.001);
}

// ── Rendering ──

function escHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function renderFactors() {
  factorContainer.innerHTML = '';
  for (const factor of state.factors) {
    const el = document.createElement('div');
    el.className = 'factor-node';
    el.dataset.factorId = factor.id;
    const multIdx = multiplierSteps.indexOf(factor.multiplier);
    const multSliderVal = multIdx >= 0 ? multIdx : multiplierSteps.indexOf(1);
    el.innerHTML = `
      <div class="factor-header">
        <span class="factor-name">${escHtml(factor.name)}</span>
        <button class="remove-btn" data-action="remove-factor" data-id="${factor.id}">&times;</button>
      </div>
      <div class="slider-row">
        <span class="slider-label">Importance</span>
        <input type="range" min="0" max="10" value="${factor.weight}" data-action="weight" data-id="${factor.id}">
        <span class="weight-value">${factor.weight}</span>
      </div>
      <div class="slider-row multiplier-row">
        <span class="slider-label mult-label">Multiplier ${factor.multiplier}x</span>
        <input type="range" min="0" max="${multiplierSteps.length - 1}" value="${multSliderVal}" data-action="multiplier" data-id="${factor.id}">
      </div>
      <div class="node-dot"></div>
    `;
    factorContainer.appendChild(el);
  }
}

function renderRestaurants() {
  const scores = computeScores();
  const winnerIds = getWinnerIds(scores);

  restaurantContainer.innerHTML = '';
  for (const r of state.restaurants) {
    const isWinner = winnerIds.includes(r.id);
    const el = document.createElement('div');
    el.className = 'restaurant-node' + (isWinner ? ' winner' : '');
    el.dataset.restaurantId = r.id;

    const score = scores[r.id] ?? 0;
    el.innerHTML = `
      <div class="node-dot"></div>
      <div class="restaurant-header">
        <span class="restaurant-name">${escHtml(r.name)}</span>
        <div class="node-actions">
          <button class="edit-btn" data-action="edit-restaurant" data-id="${r.id}">&#9998;</button>
          <button class="remove-btn" data-action="remove-restaurant" data-id="${r.id}">&times;</button>
        </div>
      </div>
      <div class="restaurant-score">${score.toFixed(2)} / 10</div>
    `;
    restaurantContainer.appendChild(el);

    if (isWinner && previousWinnerId !== null && !winnerIds.includes(previousWinnerId)) {
      el.classList.add('flash');
      el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
    }
  }

  previousWinnerId = winnerIds.length > 0 ? winnerIds[0] : null;
}

function renderScorePanel() {
  const scores = computeScores();
  const winnerIds = getWinnerIds(scores);
  const effectiveBias = bias.strength * (bias.multiplier || 1);
  const totalWeight = state.factors.reduce((sum, f) => sum + effectiveWeight(f), 0) + effectiveBias;

  scoreBars.innerHTML = '';
  for (const r of state.restaurants) {
    const score = scores[r.id] ?? 0;
    const isWinner = winnerIds.includes(r.id);
    const row = document.createElement('div');
    row.className = 'score-row' + (isWinner ? ' winner' : '');
    row.innerHTML = `
      <span class="score-name">${escHtml(r.name)}</span>
      <div class="score-bar-track">
        <div class="score-bar-fill" style="width: ${score * 10}%"></div>
      </div>
      <span class="score-value">${score.toFixed(1)}</span>
    `;
    scoreBars.appendChild(row);
  }

  if (totalWeight === 0 && (state.factors.length > 0 || bias.strength > 0)) {
    messageBar.textContent = 'Adjust weights to get a recommendation';
  } else if (state.factors.length === 0) {
    messageBar.textContent = 'Add factors to compare restaurants';
  } else if (state.restaurants.length < 2) {
    messageBar.textContent = 'Add at least 2 restaurants to compare';
  } else {
    messageBar.textContent = '';
  }
}

function renderAll() {
  renderFactors();
  renderRestaurants();
  renderScorePanel();
}

// ── Node Position Helpers ──

function getFactorDotPosition(factorId) {
  const el = factorContainer.querySelector(`[data-factor-id="${factorId}"] .node-dot`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const containerRect = canvas.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
  };
}

function getDecisionPosition() {
  const el = document.getElementById('decision-node');
  const rect = el.getBoundingClientRect();
  const containerRect = canvas.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
  };
}

function getRestaurantDotPosition(restaurantId) {
  const el = restaurantContainer.querySelector(`[data-restaurant-id="${restaurantId}"] .node-dot`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const containerRect = canvas.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
  };
}

function getBiasDotPosition() {
  const el = document.querySelector('#bias-node .bias-dot');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const containerRect = canvas.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - containerRect.left,
    y: rect.top + rect.height / 2 - containerRect.top,
  };
}

// ── Canvas / Animation ──

function resizeCanvas() {
  const container = document.getElementById('network-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

function bezierPoint(p0, p1, p2, t) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function spawnParticles() {
  for (const factor of state.factors) {
    const ew = effectiveWeight(factor);
    if (ew === 0) continue;

    // Factor -> Decision
    const spawnRate = 0.01 + ew * 0.008;
    if (Math.random() < spawnRate) {
      particles.push({
        factorId: factor.id,
        restaurantId: null,
        progress: 0,
        speed: 0.003 + ew * 0.002,
        opacity: Math.min(1, 0.2 + (ew / 10) * 0.7),
        size: 1.5 + (ew / 10) * 2,
      });
    }

    // Decision -> each Restaurant
    for (const r of state.restaurants) {
      const score = factor.scores[r.id] ?? 0;
      const signal = ew * score;
      const rSpawnRate = 0.002 + (signal / 100) * 0.012;
      if (Math.random() < rSpawnRate) {
        particles.push({
          factorId: factor.id,
          restaurantId: r.id,
          progress: 0,
          speed: 0.003 + (signal / 100) * 0.004,
          opacity: 0.15 + (signal / 100) * 0.6,
          size: 1.5 + (signal / 100) * 2,
        });
      }
    }
  }
}

function spawnBiasParticles() {
  const eb = bias.strength * (bias.multiplier || 1);
  if (eb === 0) return;

  // Bias -> Decision
  const spawnRate = 0.01 + eb * 0.008;
  if (Math.random() < spawnRate) {
    particles.push({
      factorId: '__bias__',
      restaurantId: null,
      progress: 0,
      speed: 0.003 + eb * 0.002,
      opacity: Math.min(1, 0.2 + (eb / 10) * 0.7),
      size: 1.5 + (eb / 10) * 2,
    });
  }

  // Decision -> biased restaurant
  const signal = eb * 10;
  const rSpawnRate = 0.002 + (signal / 100) * 0.012;
  if (Math.random() < rSpawnRate) {
    particles.push({
      factorId: '__bias__',
      restaurantId: bias.targetId,
      progress: 0,
      speed: 0.003 + (signal / 100) * 0.004,
      opacity: 0.15 + (signal / 100) * 0.6,
      size: 1.5 + (signal / 100) * 2,
    });
  }
}

function drawConnections() {
  const decision = getDecisionPosition();

  for (const factor of state.factors) {
    const start = getFactorDotPosition(factor.id);
    if (!start) continue;

    const ew = effectiveWeight(factor);
    const alpha = ew === 0 ? 0.03 : 0.05 + Math.min(1, ew / 10) * 0.15;
    const cp = { x: (start.x + decision.x) / 2, y: (start.y + decision.y) / 2 };

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(cp.x, cp.y, decision.x, decision.y);
    ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (const r of state.restaurants) {
    const end = getRestaurantDotPosition(r.id);
    if (!end) continue;

    let totalSignal = 0;
    for (const f of state.factors) {
      totalSignal += effectiveWeight(f) * (f.scores[r.id] ?? 0);
    }
    const maxSignal = state.factors.length * 100;
    const norm = maxSignal > 0 ? totalSignal / maxSignal : 0;
    const alpha = 0.03 + norm * 0.15;

    const cp = { x: (decision.x + end.x) / 2, y: (decision.y + end.y) / 2 };

    ctx.beginPath();
    ctx.moveTo(decision.x, decision.y);
    ctx.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
    ctx.strokeStyle = `rgba(100, 100, 140, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Bias -> Decision connection
  const biasPos = getBiasDotPosition();
  if (biasPos) {
    const eb = bias.strength * (bias.multiplier || 1);
    const biasAlpha = eb === 0 ? 0.03 : 0.05 + (eb / 10) * 0.2;
    const cp = { x: (biasPos.x + decision.x) / 2, y: (biasPos.y + decision.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(biasPos.x, biasPos.y);
    ctx.quadraticCurveTo(cp.x, cp.y, decision.x, decision.y);
    ctx.strokeStyle = `rgba(255, 170, 0, ${biasAlpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawParticles() {
  const decision = getDecisionPosition();
  const scores = computeScores();
  const winnerIds = getWinnerIds(scores);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.progress += p.speed;

    if (p.progress >= 1) {
      particles.splice(i, 1);
      continue;
    }

    let pos;

    const isBias = p.factorId === '__bias__';

    if (p.restaurantId === null) {
      const start = isBias ? getBiasDotPosition() : getFactorDotPosition(p.factorId);
      if (!start) { particles.splice(i, 1); continue; }
      const cp = { x: (start.x + decision.x) / 2, y: (start.y + decision.y) / 2 };
      pos = bezierPoint(start, cp, decision, p.progress);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = isBias
        ? `rgba(255, 170, 0, ${p.opacity})`
        : `rgba(0, 229, 255, ${p.opacity})`;
      ctx.fill();
    } else {
      const end = getRestaurantDotPosition(p.restaurantId);
      if (!end) { particles.splice(i, 1); continue; }
      const cp = { x: (decision.x + end.x) / 2, y: (decision.y + end.y) / 2 };
      pos = bezierPoint(decision, cp, end, p.progress);

      const isWinner = winnerIds.includes(p.restaurantId);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = isWinner
        ? `rgba(0, 255, 136, ${p.opacity})`
        : `rgba(100, 100, 140, ${p.opacity})`;
      ctx.fill();
    }
  }
}

function animate() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawConnections();
  spawnParticles();
  spawnBiasParticles();
  drawParticles();
  requestAnimationFrame(animate);
}

// ── Modal Helpers ──

let currentConfirmHandler = null;
let currentCancelHandler = null;

function showModal(title, bodyHtml, onConfirm) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalOverlay.classList.remove('hidden');

  // Clean up old handlers
  if (currentConfirmHandler) modalConfirm.removeEventListener('click', currentConfirmHandler);
  if (currentCancelHandler) modalCancel.removeEventListener('click', currentCancelHandler);

  currentConfirmHandler = () => {
    onConfirm();
    closeModal();
  };
  currentCancelHandler = () => {
    closeModal();
  };

  modalConfirm.addEventListener('click', currentConfirmHandler);
  modalCancel.addEventListener('click', currentCancelHandler);
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  if (currentConfirmHandler) {
    modalConfirm.removeEventListener('click', currentConfirmHandler);
    currentConfirmHandler = null;
  }
  if (currentCancelHandler) {
    modalCancel.removeEventListener('click', currentCancelHandler);
    currentCancelHandler = null;
  }
}

// ── Add Factor ──

function showAddFactorModal() {
  let html = `<label>Factor Name</label><input type="text" id="m-factor-name" placeholder="e.g. Ambience">`;
  for (const r of state.restaurants) {
    html += `<label>Score for ${escHtml(r.name)} (0\u201310)</label>
      <input type="number" min="0" max="10" value="5" data-restaurant-id="${r.id}" class="m-factor-score">`;
  }
  showModal('Add Factor', html, () => {
    const nameInput = document.getElementById('m-factor-name');
    const name = nameInput.value.trim();
    if (!name) return;

    const scores = {};
    const scoreInputs = modalBody.querySelectorAll('.m-factor-score');
    scoreInputs.forEach((input) => {
      const rid = input.dataset.restaurantId;
      scores[rid] = Math.max(0, Math.min(10, Number(input.value) || 0));
    });

    state.factors.push({ id: genId('f'), name, weight: 5, multiplier: 1, scores });
    renderAll();
  });
}

// ── Add Restaurant ──

function showAddRestaurantModal() {
  let html = `<label>Restaurant Name</label><input type="text" id="m-rest-name" placeholder="e.g. Burger Joint">`;
  for (const f of state.factors) {
    html += `<label>${escHtml(f.name)} score (0\u201310)</label>
      <input type="number" min="0" max="10" value="5" data-factor-id="${f.id}" class="m-rest-score">`;
  }
  showModal('Add Restaurant', html, () => {
    const nameInput = document.getElementById('m-rest-name');
    const name = nameInput.value.trim();
    if (!name) return;

    const rid = genId('r');
    state.restaurants.push({ id: rid, name });

    const scoreInputs = modalBody.querySelectorAll('.m-rest-score');
    scoreInputs.forEach((input) => {
      const fid = input.dataset.factorId;
      const factor = state.factors.find((f) => f.id === fid);
      if (factor) {
        factor.scores[rid] = Math.max(0, Math.min(10, Number(input.value) || 0));
      }
    });

    renderAll();
  });
}

// ── Edit Restaurant ──

function showEditRestaurantModal(restaurantId) {
  const restaurant = state.restaurants.find((r) => r.id === restaurantId);
  if (!restaurant) return;

  let html = `<label>Restaurant Name</label><input type="text" id="m-rest-name" value="${escHtml(restaurant.name)}">`;
  for (const f of state.factors) {
    const score = f.scores[restaurantId] ?? 5;
    html += `<label>${escHtml(f.name)} score (0\u201310)</label>
      <input type="number" min="0" max="10" value="${score}" data-factor-id="${f.id}" class="m-rest-score">`;
  }
  showModal('Edit Restaurant', html, () => {
    const nameInput = document.getElementById('m-rest-name');
    const name = nameInput.value.trim();
    if (name) restaurant.name = name;

    const scoreInputs = modalBody.querySelectorAll('.m-rest-score');
    scoreInputs.forEach((input) => {
      const fid = input.dataset.factorId;
      const factor = state.factors.find((f) => f.id === fid);
      if (factor) {
        factor.scores[restaurantId] = Math.max(0, Math.min(10, Number(input.value) || 0));
      }
    });

    renderAll();
  });
}

// ── Event Delegation ──

factorContainer.addEventListener('input', (e) => {
  const target = e.target;
  if (target.dataset.action === 'weight') {
    const factor = state.factors.find((f) => f.id === target.dataset.id);
    if (factor) {
      factor.weight = Number(target.value);
      const valueSpan = target.parentElement.querySelector('.weight-value');
      if (valueSpan) valueSpan.textContent = String(factor.weight);
      renderRestaurants();
      renderScorePanel();
    }
  } else if (target.dataset.action === 'multiplier') {
    const factor = state.factors.find((f) => f.id === target.dataset.id);
    if (factor) {
      factor.multiplier = multiplierSteps[Number(target.value)];
      const label = target.parentElement.querySelector('.mult-label');
      if (label) label.textContent = `Multiplier ${factor.multiplier}x`;
      renderRestaurants();
      renderScorePanel();
    }
  }
});

factorContainer.addEventListener('click', (e) => {
  const target = e.target;
  if (target.dataset.action === 'remove-factor') {
    state.factors = state.factors.filter((f) => f.id !== target.dataset.id);
    renderAll();
  }
});

restaurantContainer.addEventListener('click', (e) => {
  const target = e.target;
  if (target.dataset.action === 'remove-restaurant') {
    const rid = target.dataset.id;
    state.restaurants = state.restaurants.filter((r) => r.id !== rid);
    for (const f of state.factors) {
      delete f.scores[rid];
    }
    renderAll();
  } else if (target.dataset.action === 'edit-restaurant') {
    showEditRestaurantModal(target.dataset.id);
  }
});

document.getElementById('bias-node').addEventListener('input', (e) => {
  const target = e.target;
  if (target.id === 'bias-slider') {
    bias.strength = Number(target.value);
    document.getElementById('bias-value').textContent = String(bias.strength);
  } else if (target.id === 'bias-multiplier-slider') {
    bias.multiplier = multiplierSteps[Number(target.value)];
    document.getElementById('bias-mult-label').textContent = `Multiplier ${bias.multiplier}x`;
  }
  renderRestaurants();
  renderScorePanel();
});

addFactorBtn.addEventListener('click', showAddFactorModal);
addRestaurantBtn.addEventListener('click', showAddRestaurantModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

window.addEventListener('resize', resizeCanvas);

// ── Init ──

renderAll();
resizeCanvas();
requestAnimationFrame(animate);
