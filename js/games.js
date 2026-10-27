// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ИГРЫ ---
let currentBalance = 1250.50;
let isPlaying = false;
let isCrashed = false;
let isWaiting = false;
let currentMultiplier = 1.00;
let crashPoint = 1.00;
let betAmount = 10;
let autoCashoutValue = 0;
let animationFrameId = null;
let gameStartTime = 0;
let playerInterval = null;
let fakePlayers = [];

// --- ОБНОВЛЕНИЕ БАЛАНСА ---
function updateBalanceUI() {
  const formatted = currentBalance.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (document.getElementById('balance-display')) document.getElementById('balance-display').innerText = formatted;
  if (document.getElementById('game-balance-display')) document.getElementById('game-balance-display').innerText = formatted;
  if (document.getElementById('profile-balance-display')) document.getElementById('profile-balance-display').innerText = formatted;
}

// --- ИСТОРИЯ ПОЛЕТОВ ---
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

// --- СИМУЛЯЦИЯ ОНЛАЙН ИГРОКОВ ---
const fakeNames = ["Alex", "Max", "Satoshi", "CryptoKing", "Lucky7", "Whale", "N00b", "Gambler", "MoonBoy"];

function startLiveBetsSimulation() {
  const list = document.getElementById('live-bets-list');
  const count = document.getElementById('online-count');
  if (!list) return;
  
  list.innerHTML = '';
  fakePlayers = [];
  let online = Math.floor(Math.random() * 20) + 15;
  count.innerText = online;

  // Игроки ставят во время отсчета
  let betInterval = setInterval(() => {
    if (!isWaiting && !isPlaying) {
      clearInterval(betInterval);
      return;
    }
    if (isWaiting) {
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)] + Math.floor(Math.random() * 99);
      const bet = Math.floor(Math.random() * 500) + 10;
      const id = Date.now() + Math.random();
      
      fakePlayers.push({ id, name, bet, cashedOut: false });

      const item = document.createElement('div');
      item.className = 'live-bet-item';
      item.id = `bet-${id}`;
      item.innerHTML = `
        <div class="live-bet-user">👤 ${name}</div>
        <div class="live-bet-amount">${bet} TON</div>
      `;
      list.prepend(item);

      if (list.children.length > 6) list.lastChild.remove();
    }
  }, 300);
}

function updateLiveBetsCashout(mult) {
  fakePlayers.forEach(p => {
    if (!p.cashedOut && Math.random() < 0.05) {
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
    resetGame();
    renderHistory();
  }, 1500);
}

function closeGame() {
  haptic('light');
  if (isPlaying || isWaiting) {
    currentBalance += betAmount;
    updateBalanceUI();
    isPlaying = false;
    isWaiting = false;
    cancelAnimationFrame(animationFrameId);
    if (typeof showToast === 'function') showToast('Ставка возвращена');
  }
  
  stopLiveBetsSimulation();
  resetGame();
  document.getElementById('games-play-view').style.display = 'none';
  document.getElementById('games-list-view').style.display = 'block';
}

// ==========================================
// ЛОГИКА ИГРЫ
// ==========================================
function setBet(amount) {
  if (isPlaying || isWaiting) return;
  haptic('light');
  
  if (amount === 'max') betAmount = Math.floor(currentBalance);
  else betAmount = amount;
  
  if (betAmount > currentBalance) betAmount = Math.floor(currentBalance);
  if (betAmount < 1) betAmount = 1;
  
  document.getElementById('bet-amount').value = betAmount;
}

function handleGameAction() {
  if (isWaiting) return; // Во время отсчета ничего не делаем
  if (isCrashed) {
    resetGame();
    return;
  }

  if (isPlaying) {
    cashOut(true);
  } else {
    startGame();
  }
}

function startGame() {
  const betInput = document.getElementById('bet-amount');
  betAmount = parseFloat(betInput.value);
  autoCashoutValue = parseFloat(document.getElementById('auto-cashout').value) || 0;

  if (isNaN(betAmount) || betAmount < 1) {
    if (typeof showToast === 'function') showToast('⚠️ Минимальная ставка 1 TON');
    return;
  }
  if (betAmount > currentBalance) {
    if (typeof showToast === 'function') showToast('❌ Недостаточно средств');
    return;
  }

  haptic('medium');
  currentBalance -= betAmount;
  updateBalanceUI();

  isWaiting = true;
  isCrashed = false;
  currentMultiplier = 1.00;
  
  // Генерация точки краша (стандартная формула Crash)
  const r = Math.random();
  crashPoint = Math.max(1.00, 0.95 / (1 - r)); 
  if (crashPoint > 100) crashPoint = 100;

  const inputGroup = document.getElementById('jet-input-group');
  const actionBtn = document.getElementById('jet-action-btn');
  const overlay = document.getElementById('game-overlay');
  const countdownText = document.getElementById('countdown-text');
  const profitText = document.getElementById('profit-text');

  inputGroup.classList.add('disabled');
  actionBtn.className = 'jet-action-btn';
  actionBtn.innerText = 'ОЖИДАНИЕ...';
  overlay.classList.add('active');
  profitText.classList.remove('show');
  document.getElementById('jet-crashed-text').classList.remove('show');
  
  startLiveBetsSimulation();

  // Отсчет 3 секунды
  let count = 3.0;
  countdownText.innerText = '3.0s';
  
  const countdownInterval = setInterval(() => {
    count -= 0.1;
    if (count <= 0) {
      clearInterval(countdownInterval);
      overlay.classList.remove('active');
      launchPlane();
    } else {
      countdownText.innerText = count.toFixed(1) + 's';
    }
  }, 100);
}

function launchPlane() {
  isWaiting = false;
  isPlaying = true;
  gameStartTime = performance.now();
  
  const actionBtn = document.getElementById('jet-action-btn');
  const jetIcon = document.getElementById('jet-icon');
  
  actionBtn.className = 'jet-action-btn cashout';
  actionBtn.innerHTML = `ЗАБРАТЬ <span class="jet-action-sub" id="cashout-val">${betAmount.toFixed(2)} TON</span>`;
  
  jetIcon.style.opacity = '1';
  jetIcon.style.left = '10%'; // Сброс позиции самолета
  jetIcon.style.transform = 'translateY(0) scale(1) rotate(0deg)';
  
  loop();
}

function loop() {
  if (!isPlaying) return;

  const elapsed = (performance.now() - gameStartTime) / 1000;
  
  // ПРИЯТНАЯ МАТЕМАТИКА: 2x достигается за 5 секунд
  currentMultiplier = Math.exp(0.15 * elapsed);

  if (currentMultiplier >= crashPoint) {
    crash();
    return;
  }

  // Проверка на авто-вывод
  if (autoCashoutValue > 0 && currentMultiplier >= autoCashoutValue) {
    cashOut(false); // false означает авто-вывод
    return;
  }

  const multiplierDisplay = document.getElementById('game-multiplier');
  const jetGlow = document.getElementById('jet-glow');
  const jetIcon = document.getElementById('jet-icon');
  const cashoutEl = document.getElementById('cashout-val');

  multiplierDisplay.innerText = currentMultiplier.toFixed(2) + 'x';
  
  // Цвета и позиции
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
  
  // Самолет летит вправо и покачивается
  const planeLeft = 10 + (elapsed * 5); // Движение по X
  if (planeLeft < 80) {
    jetIcon.style.left = planeLeft + '%';
  }
  jetIcon.style.transform = `translateY(${Math.sin(elapsed * 5) * 10}px) scale(${1 + currentMultiplier * 0.01}) rotate(${currentMultiplier * 1.5}deg)`;

  if (cashoutEl) cashoutEl.innerText = (betAmount * currentMultiplier).toFixed(2) + ' TON';

  updateLiveBetsCashout(currentMultiplier);

  animationFrameId = requestAnimationFrame(loop);
}

function cashOut(isManual) {
  if (!isPlaying) return;
  isPlaying = false;
  cancelAnimationFrame(animationFrameId);
  
  if (isManual) haptic('heavy');

  const winAmount = betAmount * currentMultiplier;
  currentBalance += winAmount;
  updateBalanceUI();

  const actionBtn = document.getElementById('jet-action-btn');
  const inputGroup = document.getElementById('jet-input-group');
  const profitText = document.getElementById('profit-text');
  const overlay = document.getElementById('game-overlay');
  const jetIcon = document.getElementById('jet-icon');

  // Визуал выигрыша
  overlay.classList.add('active');
  profitText.innerText = `+${winAmount.toFixed(2)} TON`;
  profitText.classList.add('show');
  
  // Улетаем вправо
  jetIcon.style.left = '120%';
  jetIcon.style.transform = 'scale(1.5) rotate(10deg)';
  
  actionBtn.className = 'jet-action-btn';
  actionBtn.innerText = 'ВЫИГРЫШ!';
  inputGroup.classList.remove('disabled');
  
  if (typeof showToast === 'function') showToast(`✅ Вы забрали ${winAmount.toFixed(2)} TON`);

  flightHistory.unshift(currentMultiplier);
  if (flightHistory.length > 10) flightHistory.pop();
  renderHistory();

  setTimeout(resetGame, 2500);
}

function crash() {
  isPlaying = false;
  isCrashed = true;
  cancelAnimationFrame(animationFrameId);
  haptic('heavy');

  const multiplierDisplay = document.getElementById('game-multiplier');
  const crashedText = document.getElementById('jet-crashed-text');
  const jetIcon = document.getElementById('jet-icon');
  const jetGlow = document.getElementById('jet-glow');
  const actionBtn = document.getElementById('jet-action-btn');
  const inputGroup = document.getElementById('jet-input-group');

  multiplierDisplay.innerText = crashPoint.toFixed(2) + 'x';
  multiplierDisplay.style.color = '#F87171';
  crashedText.classList.add('show');
  jetIcon.style.opacity = '0';
  jetGlow.style.opacity = '0';
  
  actionBtn.className = 'jet-action-btn crashed';
  actionBtn.innerText = 'УЛЕТЕЛ!';
  inputGroup.classList.remove('disabled');
  
  if (typeof showToast === 'function') showToast(`💥 Краш на ${crashPoint.toFixed(2)}x`);

  flightHistory.unshift(crashPoint);
  if (flightHistory.length > 10) flightHistory.pop();
  renderHistory();

  setTimeout(resetGame, 3000);
}

function resetGame() {
  isPlaying = false;
  isCrashed = false;
  isWaiting = false;
  currentMultiplier = 1.00;
  
  const multiplierDisplay = document.getElementById('game-multiplier');
  if (!multiplierDisplay) return;
  
  multiplierDisplay.innerText = '1.00x';
  multiplierDisplay.style.color = '#fff';
  document.getElementById('jet-crashed-text').classList.remove('show');
  document.getElementById('jet-icon').style.opacity = '1';
  document.getElementById('jet-icon').style.left = '10%'; // Сброс
  document.getElementById('jet-icon').style.transform = 'translateY(0) scale(1) rotate(0deg)';
  document.getElementById('jet-glow').style.opacity = '0.1';
  document.getElementById('jet-glow').style.background = 'var(--turquoise)';
  
  document.getElementById('jet-action-btn').className = 'jet-action-btn';
  document.getElementById('jet-action-btn').innerText = 'СДЕЛАТЬ СТАВКУ';
  
  document.getElementById('jet-input-group').classList.remove('disabled');
  document.getElementById('bet-amount').value = betAmount;
  
  // Сброс оверлея
  document.getElementById('game-overlay').classList.remove('active');
  document.getElementById('profit-text').classList.remove('show');

  const list = document.getElementById('live-bets-list');
  if (list) list.innerHTML = '';
  const count = document.getElementById('online-count');
  if (count) count.innerText = '0';
}

document.addEventListener('DOMContentLoaded', () => {
  updateBalanceUI();
});
