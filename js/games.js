// --- ГЛОБАЛЬНЫЙ БАЛАНС ---
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
let fakePlayers = [];
let playerInterval;

function startLiveBetsSimulation() {
  const list = document.getElementById('live-bets-list');
  const count = document.getElementById('online-count');
  if (!list) return;
  
  list.innerHTML = '';
  fakePlayers = [];
  let online = Math.floor(Math.random() * 20) + 15; // 15-35 человек
  count.innerText = online;

  // Каждые 1.5 секунды добавляем игроков
  playerInterval = setInterval(() => {
    if (!isPlaying) return;

    if (Math.random() > 0.3) {
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)] + Math.floor(Math.random() * 99);
      const bet = Math.floor(Math.random() * 500) + 10;
      const id = Date.now() + Math.random();
      
      fakePlayers.push({ id, name, bet, cashedOut: false, cashoutAt: 0 });

      const item = document.createElement('div');
      item.className = 'live-bet-item';
      item.id = `bet-${id}`;
      item.innerHTML = `
        <div class="live-bet-user">👤 ${name}</div>
        <div class="live-bet-amount">${bet} TON</div>
      `;
      list.prepend(item);

      // Ограничиваем список 5 элементами
      if (list.children.length > 6) {
        list.lastChild.remove();
      }
    }
  }, 1200);
}

function updateLiveBetsCashout(mult) {
  fakePlayers.forEach(p => {
    if (!p.cashedOut && Math.random() < 0.05) { // 5% шанс, что игрок заберет прямо сейчас
      p.cashedOut = true;
      p.cashoutAt = mult;
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
  clearInterval(playerInterval);
}

// ==========================================
// ЛОГИКА ПЕРЕХОДОВ ЭКРАНОВ ИГРЫ
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
  
  if (isPlaying) {
    currentBalance += betAmount;
    updateBalanceUI();
    isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    showToast('Ставка возвращена (выход из игры)');
  }
  
  stopLiveBetsSimulation();
  resetGame();
  document.getElementById('games-play-view').style.display = 'none';
  document.getElementById('games-list-view').style.display = 'block';
}

// ==========================================
// ИНИЦИАЛИЗАЦИЯ И КЛИКИ
// ==========================================
let isPlaying = false;
let isCrashed = false;
let currentMultiplier = 1.00;
let crashPoint = 1.00;
let betAmount = 10;
let animationFrameId = null;
let startTime = 0;

let multiplierDisplay, actionBtn, jetIcon, jetGlow, crashedText, inputGroup;

document.addEventListener('DOMContentLoaded', () => {
  multiplierDisplay = document.getElementById('game-multiplier');
  actionBtn = document.getElementById('jet-action-btn');
  jetIcon = document.getElementById('jet-icon');
  jetGlow = document.getElementById('jet-glow');
  crashedText = document.getElementById('jet-crashed-text');
  inputGroup = document.getElementById('jet-input-group');
  
  updateBalanceUI();

  // ЖЕЛЕЗОБЕТОННЫЙ КЛИК ПО ВИДЖЕТУ
  const widget = document.getElementById('widget-eight-jet');
  if (widget) {
    widget.addEventListener('click', startGameLoading);
  }

  // Клик по кнопке "Назад" в игре
  const backBtn = document.getElementById('game-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', closeGame);
  }

  // Клик по главной кнопке игры
  if (actionBtn) {
    actionBtn.addEventListener('click', handleGameAction);
  }
});

// ==========================================
// ЛОГИКА EIGHT JET
// ==========================================
function setBet(amount) {
  if (isPlaying) return;
  haptic('light');
  
  if (amount === 'max') {
    betAmount = Math.floor(currentBalance);
  } else {
    betAmount = amount;
  }
  
  if (betAmount > currentBalance) betAmount = Math.floor(currentBalance);
  if (betAmount < 1) betAmount = 1;
  
  document.getElementById('bet-amount').value = betAmount;
}

function handleGameAction() {
  if (isCrashed) {
    resetGame();
    return;
  }

  if (isPlaying) {
    cashOut();
  } else {
    startGame();
  }
}

function startGame() {
  const betInput = document.getElementById('bet-amount');
  betAmount = parseFloat(betInput.value);

  if (isNaN(betAmount) || betAmount < 1) {
    showToast('⚠️ Минимальная ставка 1 TON');
    return;
  }
  if (betAmount > currentBalance) {
    showToast('❌ Недостаточно средств');
    return;
  }

  haptic('medium');
  currentBalance -= betAmount;
  updateBalanceUI();

  isPlaying = true;
  isCrashed = false;
  currentMultiplier = 1.00;
  startTime = performance.now();
  
  const r = Math.random();
  crashPoint = 1 + (Math.pow(1 / (1 - r), 1.5) - 1);
  if (crashPoint > 50) crashPoint = 50;

  inputGroup.classList.add('disabled');
  actionBtn.className = 'jet-action-btn cashout';
  actionBtn.innerHTML = `ЗАБРАТЬ <span class="jet-action-sub" id="cashout-val">${(betAmount).toFixed(2)} TON</span>`;
  crashedText.classList.remove('show');
  jetIcon.style.opacity = '1';
  jetIcon.style.transform = 'scale(1) rotate(0deg)';
  multiplierDisplay.style.color = '#fff';
  
  // Запускаем симуляцию онлайна
  startLiveBetsSimulation();
  
  loop();
}

function loop() {
  if (!isPlaying) return;

  const elapsed = (performance.now() - startTime) / 1000;
  currentMultiplier = Math.pow(1.001, elapsed * 1000);
  if (currentMultiplier > 2) currentMultiplier = 2 * Math.pow(1.002, (elapsed - 0.69) * 1000);

  if (currentMultiplier >= crashPoint) {
    crash();
    return;
  }

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
  jetIcon.style.transform = `translateY(${Math.sin(elapsed * 10) * 5}px) scale(${1 + currentMultiplier * 0.02}) rotate(${currentMultiplier * 2}deg)`;

  const cashoutVal = betAmount * currentMultiplier;
  const cashoutEl = document.getElementById('cashout-val');
  if (cashoutEl) cashoutEl.innerText = cashoutVal.toFixed(2) + ' TON';

  // Обновляем симуляцию онлайна
  updateLiveBetsCashout(currentMultiplier);

  animationFrameId = requestAnimationFrame(loop);
}

function cashOut() {
  if (!isPlaying) return;
  isPlaying = false;
  cancelAnimationFrame(animationFrameId);
  stopLiveBetsSimulation();
  haptic('heavy');

  const winAmount = betAmount * currentMultiplier;
  currentBalance += winAmount;
  updateBalanceUI();

  actionBtn.className = 'jet-action-btn';
  actionBtn.innerText = 'ВЫИГРЫШ ' + winAmount.toFixed(2) + ' TON';
  inputGroup.classList.remove('disabled');
  
  showToast(`✅ Вы забрали ${winAmount.toFixed(2)} TON`);

  // Добавляем в историю
  flightHistory.unshift(currentMultiplier);
  if (flightHistory.length > 10) flightHistory.pop();
  renderHistory();

  setTimeout(resetGame, 2000);
}

function crash() {
  isPlaying = false;
  isCrashed = true;
  cancelAnimationFrame(animationFrameId);
  stopLiveBetsSimulation();
  haptic('heavy');

  multiplierDisplay.innerText = crashPoint.toFixed(2) + 'x';
  multiplierDisplay.style.color = '#F87171';
  crashedText.classList.add('show');
  jetIcon.style.opacity = '0';
  jetGlow.style.opacity = '0';
  
  actionBtn.className = 'jet-action-btn crashed';
  actionBtn.innerText = 'УЛЕТЕЛ!';
  inputGroup.classList.remove('disabled');
  
  showToast(`💥 Краш на ${crashPoint.toFixed(2)}x`);

  // Добавляем в историю
  flightHistory.unshift(crashPoint);
  if (flightHistory.length > 10) flightHistory.pop();
  renderHistory();

  setTimeout(resetGame, 3000);
}

function resetGame() {
  isPlaying = false;
  isCrashed = false;
  currentMultiplier = 1.00;
  
  if (!multiplierDisplay) return;
  
  multiplierDisplay.innerText = '1.00x';
  multiplierDisplay.style.color = '#fff';
  crashedText.classList.remove('show');
  jetIcon.style.opacity = '1';
  jetIcon.style.transform = 'scale(1) rotate(0deg)';
  jetGlow.style.opacity = '0.1';
  jetGlow.style.background = 'var(--turquoise)';
  
  actionBtn.className = 'jet-action-btn';
  actionBtn.innerText = 'СДЕЛАТЬ СТАВКУ';
  
  inputGroup.classList.remove('disabled');
  document.getElementById('bet-amount').value = betAmount;
  
  // Очищаем лайв-ставки
  const list = document.getElementById('live-bets-list');
  if (list) list.innerHTML = '';
  const count = document.getElementById('online-count');
  if (count) count.innerText = '0';
}
