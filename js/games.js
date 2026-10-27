// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let currentBalance = 1250.50;

function updateBalanceUI() {
  const formatted = currentBalance.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (document.getElementById('balance-display')) document.getElementById('balance-display').innerText = formatted;
  if (document.getElementById('game-balance-display')) document.getElementById('game-balance-display').innerText = formatted;
  if (document.getElementById('profile-balance-display')) document.getElementById('profile-balance-display').innerText = formatted;
}

// --- ИСТОРИЯ ---
let flightHistory = [1.23, 4.50, 1.05, 2.80, 12.40, 1.50, 1.01, 3.20];
function renderHistory() {
  const container = document.getElementById('flight-history');
  if (!container) return;
  container.innerHTML = '';
  flightHistory.forEach(mult => {
    const pill = document.createElement('div');
    pill.className = `history-pill ${mult >= 2 ? 'win' : 'loss'}`;
    pill.innerText = mult.toFixed(2) + 'x';
    container.appendChild(pill);
  });
}

// ==========================================
// ДВИЖОК ИГРЫ (БЕСКОНЕЧНЫЙ ЦИКЛ)
// ==========================================
let gameState = 'offline'; // offline, waiting, flying, crashed
let crashPoint = 1.00;
let currentMultiplier = 1.00;
let roundStartTime = 0;
let waitStartTime = 0;
let animationFrameId = null;
let waitIntervalId = null;

// Состояние ставки игрока
let playerBet = {
  active: false,
  amount: 0,
  cashedOut: false,
  autoCashout: 0
};

// Боты
let fakePlayers = [];
let playerInterval = null;
const fakeNames = ["Alex", "Max", "Satoshi", "CryptoKing", "Lucky7", "Whale", "N00b", "Gambler", "MoonBoy"];

// --- ГЕНЕРАТОР КРАША ---
function generateCrashPoint() {
  const r = Math.random();
  // Вероятностное распределение: чаще падает рано, реже — высоко
  const point = Math.max(1.00, 0.97 / (1 - r));
  return point > 100 ? 100 : point;
}

// ==========================================
// УПРАВЛЕНИЕ РАУНДАМИ
// ==========================================
function startWaitingPhase() {
  gameState = 'waiting';
  crashPoint = generateCrashPoint();
  currentMultiplier = 1.00;
  playerBet.active = false;
  playerBet.cashedOut = false;
  
  const overlay = document.getElementById('game-overlay');
  const actionBtn = document.getElementById('jet-action-btn');
  const inputGroup = document.getElementById('jet-input-group');
  
  overlay.innerHTML = `<div class="countdown-text" id="countdown-text">5.0s</div><div class="countdown-sub">Прием ставок</div>`;
  overlay.classList.add('active');
  
  actionBtn.className = 'jet-action-btn waiting';
  actionBtn.innerText = 'СДЕЛАТЬ СТАВКУ';
  inputGroup.classList.remove('disabled');
  
  document.getElementById('jet-icon').style.opacity = '1';
  document.getElementById('jet-icon').style.left = '10%';
  document.getElementById('jet-icon').style.transform = 'translateY(0) scale(1) rotate(0deg)';
  document.getElementById('jet-crashed-text').classList.remove('show');
  document.getElementById('game-multiplier').style.color = '#fff';
  document.getElementById('game-multiplier').innerText = '1.00x';
  document.getElementById('jet-glow').style.opacity = '0.1';
  document.getElementById('jet-glow').style.background = 'var(--turquoise)';

  startLiveBetsSimulation();

  waitStartTime = performance.now();
  let timeLeft = 5.0;
  
  if (waitIntervalId) clearInterval(waitIntervalId);
  waitIntervalId = setInterval(() => {
    timeLeft -= 0.1;
    const cdText = document.getElementById('countdown-text');
    if (cdText) cdText.innerText = Math.max(0, timeLeft).toFixed(1) + 's';
    
    if (timeLeft <= 0) {
      clearInterval(waitIntervalId);
      startFlyingPhase();
    }
  }, 100);
}

function startFlyingPhase() {
  gameState = 'flying';
  roundStartTime = performance.now();
  
  document.getElementById('game-overlay').classList.remove('active');
  
  const actionBtn = document.getElementById('jet-action-btn');
  if (playerBet.active && !playerBet.cashedOut) {
    actionBtn.className = 'jet-action-btn cashout';
    actionBtn.innerHTML = `ЗАБРАТЬ <span class="jet-action-sub" id="cashout-val">${playerBet.amount.toFixed(2)} TON</span>`;
  } else {
    actionBtn.className = 'jet-action-btn cashed-out';
    actionBtn.innerText = 'ЖДЕМ СЛЕДУЮЩИЙ РАУНД';
  }
  
  document.getElementById('jet-input-group').classList.add('disabled');
  
  loop();
}

function loop() {
  if (gameState !== 'flying') return;

  const elapsed = (performance.now() - roundStartTime) / 1000;
  
  // --- НОВАЯ ПРИЯТНАЯ МАТЕМАТИКА ---
  // 1.50x достигается за ~5 сек, 2.00x за ~8.6 сек, 10x за ~28 сек.
  currentMultiplier = Math.exp(0.08 * elapsed);

  // Проверка на краш
  if (currentMultiplier >= crashPoint) {
    endRoundCrash();
    return;
  }

  // Обновление множителя на экране
  const multiplierDisplay = document.getElementById('game-multiplier');
  const jetGlow = document.getElementById('jet-glow');
  const jetIcon = document.getElementById('jet-icon');

  multiplierDisplay.innerText = currentMultiplier.toFixed(2) + 'x';
  
  if (currentMultiplier > 3) {
    multiplierDisplay.style.color = '#FBBF24';
    jetGlow.style.background = '#FBBF24';
  }
  if (currentMultiplier > 5) {
    multiplierDisplay.style.color = '#F87171';
    jetGlow.style.background = '#F87171';
  }

  jetGlow.style.opacity = 0.1 + (currentMultiplier * 0.05);
  jetGlow.style.transform = `scale(${1 + currentMultiplier * 0.1})`;
  
  // --- УСКОРЕНИЕ САМОЛЕТА ---
  // Сначала летит медленно, но с ростом времени скорость растет квадратично
  const planeLeft = 10 + (elapsed * 2) + Math.pow(elapsed, 1.8) * 2;
  
  if (planeLeft < 90) {
    jetIcon.style.left = planeLeft + '%';
  }
  // Вращение и вибрация тоже усиливаются
  jetIcon.style.transform = `translateY(${Math.sin(elapsed * 5) * 10}px) scale(${1 + currentMultiplier * 0.01}) rotate(${currentMultiplier * 1.5}deg)`;

  // Проверка авто-вывода
  if (playerBet.active && !playerBet.cashedOut) {
    if (playerBet.autoCashout > 0 && currentMultiplier >= playerBet.autoCashout) {
      handlePlayerCashout(true);
    } else {
      const cashoutEl = document.getElementById('cashout-val');
      if (cashoutEl) {
        cashoutEl.innerText = (playerBet.amount * currentMultiplier).toFixed(2) + ' TON';
      }
    }
  }

  updateLiveBetsCashout(currentMultiplier);

  animationFrameId = requestAnimationFrame(loop);
}

function endRoundCrash() {
  gameState = 'crashed';
  cancelAnimationFrame(animationFrameId);
  clearInterval(waitIntervalId);
  stopLiveBetsSimulation();
  haptic('heavy');

  const multiplierDisplay = document.getElementById('game-multiplier');
  const crashedText = document.getElementById('jet-crashed-text');
  const actionBtn = document.getElementById('jet-action-btn');
  
  multiplierDisplay.innerText = crashPoint.toFixed(2) + 'x';
  multiplierDisplay.style.color = '#F87171';
  crashedText.classList.add('show');
  document.getElementById('jet-icon').style.opacity = '0';
  document.getElementById('jet-glow').style.opacity = '0';
  
  if (playerBet.active && !playerBet.cashedOut) {
    if (typeof showToast === 'function') showToast(`💥 Вы проиграли ${playerBet.amount.toFixed(2)} TON`);
  }

  actionBtn.className = 'jet-action-btn crashed';
  actionBtn.innerText = 'УЛЕТЕЛ!';
  document.getElementById('jet-input-group').classList.remove('disabled');
  
  flightHistory.unshift(crashPoint);
  if (flightHistory.length > 10) flightHistory.pop();
  renderHistory();

  setTimeout(() => {
    if (gameState !== 'offline') startWaitingPhase();
  }, 3000);
}

// ==========================================
// ДЕЙСТВИЯ ИГРОКА
// ==========================================
function setBet(amount) {
  if (gameState !== 'waiting') return;
  haptic('light');
  
  let betAmount = 10;
  if (amount === 'max') betAmount = Math.floor(currentBalance);
  else betAmount = amount;
  
  if (betAmount > currentBalance) betAmount = Math.floor(currentBalance);
  if (betAmount < 1) betAmount = 1;
  
  document.getElementById('bet-amount').value = betAmount;
}

function handleGameAction() {
  if (gameState === 'waiting') {
    placeBet();
  } else if (gameState === 'flying' && playerBet.active && !playerBet.cashedOut) {
    handlePlayerCashout(false);
  }
}

function placeBet() {
  const betInput = document.getElementById('bet-amount');
  const amount = parseFloat(betInput.value);
  const auto = parseFloat(document.getElementById('auto-cashout').value) || 0;

  if (isNaN(amount) || amount < 1) {
    if (typeof showToast === 'function') showToast('⚠️ Мин. ставка 1 TON');
    return;
  }
  if (amount > currentBalance) {
    if (typeof showToast === 'function') showToast('❌ Недостаточно средств');
    return;
  }

  haptic('medium');
  currentBalance -= amount;
  updateBalanceUI();

  playerBet.active = true;
  playerBet.amount = amount;
  playerBet.cashedOut = false;
  playerBet.autoCashout = auto;

  const actionBtn = document.getElementById('jet-action-btn');
  actionBtn.className = 'jet-action-btn waiting';
  actionBtn.innerText = 'СТАВКА ПРИНЯТА!';
  
  addPlayerToLiveList("ВЫ", amount);
}

function handlePlayerCashout(isAuto) {
  if (!playerBet.active || playerBet.cashedOut) return;
  
  playerBet.cashedOut = true;
  const winAmount = playerBet.amount * currentMultiplier;
  currentBalance += winAmount;
  updateBalanceUI();

  if (!isAuto) haptic('heavy');

  const actionBtn = document.getElementById('jet-action-btn');
  actionBtn.className = 'jet-action-btn cashed-out';
  actionBtn.innerText = `ЗАБРАНО ${winAmount.toFixed(2)} TON`;

  if (typeof showToast === 'function') {
    showToast(isAuto ? `🤖 Авто-вывод ${winAmount.toFixed(2)} TON` : `✅ Вы забрали ${winAmount.toFixed(2)} TON`);
  }
  
  updatePlayerLiveStatus(winAmount, currentMultiplier);
}

// ==========================================
// СИМУЛЯЦИЯ БОТОВ
// ==========================================
function addPlayerToLiveList(name, bet) {
  const list = document.getElementById('live-bets-list');
  if (!list) return;
  
  const id = 'player-bet';
  const item = document.createElement('div');
  item.className = 'live-bet-item';
  item.id = id;
  item.innerHTML = `
    <div class="live-bet-user" style="color: var(--turquoise)">👤 ${name}</div>
    <div class="live-bet-amount">${bet} TON</div>
  `;
  list.prepend(item);
}

function updatePlayerLiveStatus(win, mult) {
  const el = document.getElementById('player-bet');
  if (el) {
    const amountDiv = el.querySelector('.live-bet-amount');
    amountDiv.className = 'live-bet-cashout';
    amountDiv.innerText = `+${win.toFixed(0)} TON (${mult.toFixed(2)}x)`;
  }
}

function startLiveBetsSimulation() {
  const list = document.getElementById('live-bets-list');
  const count = document.getElementById('online-count');
  if (!list) return;
  
  list.innerHTML = '';
  fakePlayers = [];
  count.innerText = Math.floor(Math.random() * 30) + 10;

  if (playerInterval) clearInterval(playerInterval);
  
  playerInterval = setInterval(() => {
    if (gameState !== 'waiting') return;
    
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)] + Math.floor(Math.random() * 99);
    const bet = Math.floor(Math.random() * 500) + 10;
    const id = Date.now() + Math.random();
    
    fakePlayers.push({ id, name, bet, cashedOut: false, autoCashout: Math.random() * 5 + 1.1 });

    const item = document.createElement('div');
    item.className = 'live-bet-item';
    item.id = `bet-${id}`;
    item.innerHTML = `
      <div class="live-bet-user">👤 ${name}</div>
      <div class="live-bet-amount">${bet} TON</div>
    `;
    list.prepend(item);

    if (list.children.length > 8) list.lastChild.remove();
  }, 400);
}

function updateLiveBetsCashout(mult) {
  fakePlayers.forEach(p => {
    if (!p.cashedOut && (mult >= p.autoCashout || Math.random() < 0.02)) {
      p.cashedOut = true;
      const el = document.getElementById(`bet-${p.id}`);
      if (el) {
        const amountDiv = el.querySelector('.live-bet-amount');
        amountDiv.className = 'live-bet-cashout';
        amountDiv.innerText = `+${(p.bet * mult).toFixed(0)} TON (${mult.toFixed(2)}x)`;
      }
    }
  });
}

function stopLiveBetsSimulation() {
  if (playerInterval) clearInterval(playerInterval);
}

// ==========================================
// ПЕРЕХОДЫ МЕЖДУ ЭКРАНАМИ
// ==========================================
function startGameLoading() {
  haptic('medium');
  document.getElementById('games-list-view').style.display = 'none';
  document.getElementById('games-loading-view').style.display = 'flex';
  
  setTimeout(() => {
    document.getElementById('games-loading-view').style.display = 'none';
    document.getElementById('games-play-view').style.display = 'block';
    renderHistory();
    startWaitingPhase();
  }, 1500);
}

function closeGame() {
  haptic('light');
  gameState = 'offline';
  
  if (waitIntervalId) clearInterval(waitIntervalId);
  cancelAnimationFrame(animationFrameId);
  stopLiveBetsSimulation();
  
  if (playerBet.active && !playerBet.cashedOut) {
    currentBalance += playerBet.amount;
    updateBalanceUI();
    if (typeof showToast === 'function') showToast('Ставка возвращена');
  }

  document.getElementById('games-play-view').style.display = 'none';
  document.getElementById('games-list-view').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  updateBalanceUI();
});
