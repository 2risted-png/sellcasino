// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let currentBalance = 1250.50;

function updateBalanceUI() {
  const formatted = currentBalance.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (document.getElementById('balance-display')) document.getElementById('balance-display').innerText = formatted;
  if (document.getElementById('game-balance-display')) document.getElementById('game-balance-display').innerText = formatted;
  if (document.getElementById('dice-balance-display')) document.getElementById('dice-balance-display').innerText = formatted;
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

// ==========================================
// ЛОГИКА ИГРЫ EIGHT JET
// ==========================================
let gameState = 'offline'; 
let crashPoint = 1.00;
let currentMultiplier = 1.00;
let roundStartTime = 0;
let waitStartTime = 0;
let animationFrameId = null;
let waitIntervalId = null;

let playerBet = { active: false, amount: 0, cashedOut: false, autoCashout: 0 };

function generateCrashPoint() {
  const r = Math.random();
  const point = Math.max(1.00, 0.97 / (1 - r));
  return point > 100 ? 100 : point;
}

const graphLine = document.getElementById('graph-line');
const graphFill = document.getElementById('graph-fill');
const graphDot = document.getElementById('graph-dot');

function resetGraph() {
  if (graphLine) graphLine.setAttribute('d', '');
  if (graphFill) graphFill.setAttribute('d', '');
  if (graphDot) {
    graphDot.setAttribute('cx', 0);
    graphDot.setAttribute('cy', 150);
    graphDot.style.opacity = '0';
  }
}

function updateGraph(elapsed) {
  if (!graphLine || !graphFill || !graphDot) return;
  graphDot.style.opacity = '1';
  const maxX = 290;
  const maxY = 10;
  let x = Math.min(maxX, 10 + elapsed * 25);
  let y = 150 - (Math.log(currentMultiplier) * 45);
  if (y < maxY) y = maxY;
  const pathD = `M 0 150 Q ${x * 0.6} 150, ${x} ${y}`;
  graphLine.setAttribute('d', pathD);
  const fillD = `${pathD} L ${x} 150 L 0 150 Z`;
  graphFill.setAttribute('d', fillD);
  graphDot.setAttribute('cx', x);
  graphDot.setAttribute('cy', y);
}

function colorGraphRed() {
  if (!graphLine) return;
  graphLine.setAttribute('stroke', '#F87171');
  graphFill.setAttribute('fill', 'rgba(248, 113, 113, 0.1)');
  graphDot.setAttribute('fill', '#F87171');
  graphDot.setAttribute('filter', 'drop-shadow(0 0 8px rgba(248, 113, 113, 0.8))');
}

function colorGraphDefault() {
  if (!graphLine) return;
  graphLine.setAttribute('stroke', 'url(#line-gradient)');
  graphFill.setAttribute('fill', 'url(#graph-gradient)');
  graphDot.setAttribute('fill', '#fff');
  graphDot.setAttribute('filter', 'drop-shadow(0 0 6px #2DD4BF)');
}

function startWaitingPhase() {
  gameState = 'waiting';
  crashPoint = generateCrashPoint();
  currentMultiplier = 1.00;
  playerBet.active = false;
  playerBet.cashedOut = false;
  
  const actionBtn = document.getElementById('jet-action-btn');
  const inputGroup = document.getElementById('jet-input-group');
  const timerDisplay = document.getElementById('waiting-timer');
  const multiplierDisplay = document.getElementById('game-multiplier');
  const crashedText = document.getElementById('jet-crashed-text');
  const betInput = document.getElementById('bet-amount');
  const autoInput = document.getElementById('auto-cashout');

  if (!timerDisplay || !multiplierDisplay || !crashedText || !actionBtn) return;
  
  timerDisplay.style.display = 'flex';
  multiplierDisplay.style.display = 'none';
  crashedText.style.display = 'none';
  
  actionBtn.className = 'jet-action-btn waiting';
  actionBtn.innerText = 'СДЕЛАТЬ СТАВКУ';
  
  if (inputGroup) inputGroup.classList.remove('disabled');
  if (betInput) betInput.disabled = false;
  if (autoInput) autoInput.disabled = false;
  
  const jetGlow = document.getElementById('jet-glow');
  if (jetGlow) {
    jetGlow.style.opacity = '0.1';
    jetGlow.style.background = 'var(--turquoise)';
  }

  resetGraph();
  colorGraphDefault();

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
  
  const timerDisplay = document.getElementById('waiting-timer');
  const multiplierDisplay = document.getElementById('game-multiplier');
  
  if (timerDisplay) timerDisplay.style.display = 'none';
  if (multiplierDisplay) multiplierDisplay.style.display = 'block';
  
  const actionBtn = document.getElementById('jet-action-btn');
  if (actionBtn) {
    if (playerBet.active && !playerBet.cashedOut) {
      actionBtn.className = 'jet-action-btn cashout';
      actionBtn.innerHTML = `ЗАБРАТЬ <span class="jet-action-sub" id="cashout-val">${playerBet.amount.toFixed(2)} TON</span>`;
    } else {
      actionBtn.className = 'jet-action-btn cashed-out';
      actionBtn.innerText = 'ЖДЕМ СЛЕДУЮЩИЙ РАУНД';
    }
  }
  
  const inputGroup = document.getElementById('jet-input-group');
  if (inputGroup) inputGroup.classList.add('disabled');
  
  loop();
}

function loop() {
  if (gameState !== 'flying') return;

  const elapsed = (performance.now() - roundStartTime) / 1000;
  currentMultiplier = Math.exp(0.08 * elapsed);

  if (currentMultiplier >= crashPoint) {
    endRoundCrash();
    return;
  }

  const multiplierDisplay = document.getElementById('game-multiplier');
  const jetGlow = document.getElementById('jet-glow');

  if (multiplierDisplay) {
    multiplierDisplay.innerText = currentMultiplier.toFixed(2) + 'x';
    
    if (currentMultiplier > 3) {
      multiplierDisplay.style.color = '#FBBF24';
      if (jetGlow) jetGlow.style.background = '#FBBF24';
    }
    if (currentMultiplier > 5) {
      multiplierDisplay.style.color = '#F87171';
      if (jetGlow) jetGlow.style.background = '#F87171';
    }
  }

  if (jetGlow) {
    jetGlow.style.opacity = 0.1 + (currentMultiplier * 0.05);
    jetGlow.style.transform = `scale(${1 + currentMultiplier * 0.1})`;
  }
  
  updateGraph(elapsed);

  if (playerBet.active && !playerBet.cashedOut) {
    if (playerBet.autoCashout > 0 && currentMultiplier >= playerBet.autoCashout) {
      handlePlayerCashout(true);
    } else {
      const cashoutEl = document.getElementById('cashout-val');
      if (cashoutEl) cashoutEl.innerText = (playerBet.amount * currentMultiplier).toFixed(2) + ' TON';
    }
  }

  animationFrameId = requestAnimationFrame(loop);
}

function endRoundCrash() {
  gameState = 'crashed';
  cancelAnimationFrame(animationFrameId);
  clearInterval(waitIntervalId);
  haptic('heavy');

  const multiplierDisplay = document.getElementById('game-multiplier');
  const crashedText = document.getElementById('jet-crashed-text');
  const actionBtn = document.getElementById('jet-action-btn');
  
  if (multiplierDisplay) multiplierDisplay.style.display = 'none';
  if (crashedText) {
    crashedText.style.display = 'block';
    crashedText.innerText = `УЛЕТЕЛ!`;
  }
  
  colorGraphRed();

  const jetGlow = document.getElementById('jet-glow');
  if (jetGlow) jetGlow.style.opacity = '0';
  
  if (playerBet.active && !playerBet.cashedOut) {
    if (typeof showToast === 'function') showToast(`💥 Вы проиграли ${playerBet.amount.toFixed(2)} TON`);
  }

  if (actionBtn) {
    actionBtn.className = 'jet-action-btn crashed';
    actionBtn.innerText = 'УЛЕТЕЛ!';
  }
  
  const inputGroup = document.getElementById('jet-input-group');
  if (inputGroup) inputGroup.classList.remove('disabled');
  
  flightHistory.unshift(crashPoint);
  if (flightHistory.length > 10) flightHistory.pop();
  renderHistory();

  setTimeout(() => {
    if (gameState !== 'offline') startWaitingPhase();
  }, 3000);
}

function setBet(amount) {
  if (gameState !== 'waiting' || playerBet.active) return; 
  haptic('light');
  let betAmount = 10;
  if (amount === 'max') betAmount = Math.floor(currentBalance);
  else betAmount = amount;
  if (betAmount > currentBalance) betAmount = Math.floor(currentBalance);
  if (betAmount < 1) betAmount = 1;
  const betInput = document.getElementById('bet-amount');
  if (betInput) betInput.value = betAmount;
}

function handleGameAction() {
  if (gameState === 'waiting') {
    placeBet();
  } else if (gameState === 'flying' && playerBet.active && !playerBet.cashedOut) {
    handlePlayerCashout(false);
  }
}

function placeBet() {
  if (playerBet.active) return;
  const betInput = document.getElementById('bet-amount');
  if (!betInput) return;
  
  const amount = parseFloat(betInput.value);
  const autoInput = document.getElementById('auto-cashout');
  const auto = autoInput ? parseFloat(autoInput.value) || 0 : 0;

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
  if (actionBtn) {
    actionBtn.className = 'jet-action-btn waiting';
    actionBtn.innerText = 'СТАВКА ПРИНЯТА!';
  }
  betInput.disabled = true;
  if (autoInput) autoInput.disabled = true;
  
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
  if (actionBtn) {
    actionBtn.className = 'jet-action-btn cashed-out';
    actionBtn.innerText = `ЗАБРАНО ${winAmount.toFixed(2)} TON`;
  }

  if (typeof showToast === 'function') {
    showToast(isAuto ? `🤖 Авто-вывод ${winAmount.toFixed(2)} TON` : `✅ Вы забрали ${winAmount.toFixed(2)} TON`);
  }
  updatePlayerLiveStatus(winAmount, currentMultiplier);
}

function addPlayerToLiveList(name, bet) {
  const list = document.getElementById('live-bets-list');
  if (!list) return;
  list.innerHTML = '';
  const item = document.createElement('div');
  item.className = 'live-bet-item';
  item.id = 'player-bet';
  item.innerHTML = `
    <div class="live-bet-user">👤 ${name}</div>
    <div class="live-bet-data">
      <span class="live-bet-bet">${bet} TON</span>
      <span class="live-bet-sep">-</span>
      <span class="live-bet-win">0 TON</span>
      <span class="live-bet-sep">-</span>
      <span class="live-bet-mult">0.00x</span>
    </div>
  `;
  list.prepend(item);
}

function updatePlayerLiveStatus(win, mult) {
  const el = document.getElementById('player-bet');
  if (el) {
    const winEl = el.querySelector('.live-bet-win');
    const multEl = el.querySelector('.live-bet-mult');
    if (winEl) winEl.innerText = `+${win.toFixed(2)} TON`;
    if (multEl) multEl.innerText = `${mult.toFixed(2)}x`;
    el.classList.add('cashed-out');
  }
}

function startGameLoading() {
  haptic('medium');
  document.getElementById('games-list-view').style.display = 'none';
  document.getElementById('games-loading-view').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('games-loading-view').style.display = 'none';
    document.getElementById('games-play-view').style.display = 'block';
    renderHistory();
    startWaitingPhase();
  }, 2200);
}

function closeGame() {
  haptic('light');
  gameState = 'offline';
  if (waitIntervalId) clearInterval(waitIntervalId);
  cancelAnimationFrame(animationFrameId);
  if (playerBet.active && !playerBet.cashedOut) {
    currentBalance += playerBet.amount;
    updateBalanceUI();
    if (typeof showToast === 'function') showToast('Ставка возвращена');
  }
  document.getElementById('games-play-view').style.display = 'none';
  document.getElementById('games-list-view').style.display = 'block';
}

function toggleRules() {
  haptic('light');
  const modal = document.getElementById('rulesModal');
  if (modal) {
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  }
}

// ==========================================
// ЛОГИКА ИГРЫ DICE
// ==========================================
let isDiceRolling = false;

function startDiceLoading() {
  haptic('medium');
  document.getElementById('games-list-view').style.display = 'none';
  document.getElementById('games-loading-view').style.display = 'flex';
  
  setTimeout(() => {
    document.getElementById('games-loading-view').style.display = 'none';
    document.getElementById('dice-play-view').style.display = 'flex';
    updateBalanceUI();
    resetDiceUI();
  }, 1500);
}

function closeDiceGame() {
  haptic('light');
  document.getElementById('dice-play-view').style.display = 'none';
  document.getElementById('games-list-view').style.display = 'block';
}

function setDiceBet(amount) {
  if (isDiceRolling) return;
  haptic('light');
  
  let betAmount = 10;
  if (amount === 'max') betAmount = Math.floor(currentBalance);
  else betAmount = amount;
  
  if (betAmount > currentBalance) betAmount = Math.floor(currentBalance);
  if (betAmount < 1) betAmount = 1;
  
  document.getElementById('dice-bet-amount').value = betAmount;
}

function playDice(choice) {
  if (isDiceRolling) return;

  const betInput = document.getElementById('dice-bet-amount');
  const betAmount = parseFloat(betInput.value);

  if (isNaN(betAmount) || betAmount < 1) {
    if (typeof showToast === 'function') showToast('⚠️ Мин. ставка 1 TON');
    return;
  }
  if (betAmount > currentBalance) {
    if (typeof showToast === 'function') showToast('❌ Недостаточно средств');
    return;
  }

  haptic('medium');
  currentBalance -= betAmount;
  updateBalanceUI();

  isDiceRolling = true;
  
  const diceCube = document.getElementById('dice-cube');
  const resultText = document.getElementById('dice-result-text');
  const btnUnder = document.getElementById('btn-under');
  const btnOver = document.getElementById('btn-over');
  const inputGroup = document.getElementById('dice-input-group');

  inputGroup.classList.add('disabled');
  btnUnder.disabled = true;
  btnOver.disabled = true;
  resultText.classList.remove('show', 'win', 'loss');
  
  diceCube.classList.add('rolling');
  diceCube.innerText = '🎲';

  setTimeout(() => {
    diceCube.classList.remove('rolling');
    
    const roll = Math.floor(Math.random() * 6) + 1;
    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    diceCube.innerText = diceEmojis[roll];

    let isWin = false;
    let payoutMultiplier = 0;

    if (choice === 'over') {
      if (roll > 3) {
        isWin = true;
        payoutMultiplier = 2.0;
      }
    } else if (choice === 'under') {
      if (roll < 3) {
        isWin = true;
        payoutMultiplier = 2.5;
      }
    }

    if (isWin) {
      const winAmount = betAmount * payoutMultiplier;
      currentBalance += winAmount;
      updateBalanceUI();
      resultText.innerText = `+${winAmount.toFixed(2)} TON`;
      resultText.className = 'dice-result-text show win';
      haptic('heavy');
      if (typeof showToast === 'function') showToast(`🎉 Победа! Выигрыш ${winAmount.toFixed(2)} TON`);
    } else {
      resultText.innerText = 'Проигрыш';
      resultText.className = 'dice-result-text show loss';
      haptic('heavy');
      if (typeof showToast === 'function') showToast(`💥 Выпало ${roll}. Вы проиграли.`);
    }

    setTimeout(() => {
      isDiceRolling = false;
      inputGroup.classList.remove('disabled');
      btnUnder.disabled = false;
      btnOver.disabled = false;
      resetDiceUI();
    }, 2000);

  }, 1500);
}

function resetDiceUI() {
  const resultText = document.getElementById('dice-result-text');
  if (resultText) resultText.classList.remove('show', 'win', 'loss');
}

// ==========================================
// ИНИЦИАЛИЗАЦИЯ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  updateBalanceUI();
});
