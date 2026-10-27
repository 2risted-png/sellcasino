let currentBalance = 0;

// js/telegram.js (или games.js)
const API_URL = 'http://localhost:3000'; // Замени на URL твоего сервера после деплоя

async function fetchUserBalance() {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) {
        console.warn('Не в Telegram, баланс не загружен');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData })
        });
        const data = await response.json();
        
        if (data.success) {
            currentBalance = data.balance;
            updateBalanceUI(); // Обновляем все элементы на странице
            console.log('Баланс загружен с сервера:', currentBalance);
        }
    } catch (err) {
        console.error('Ошибка загрузки баланса:', err);
        // Показываем старый баланс из localStorage как временную заглушку
        currentBalance = parseFloat(localStorage.getItem('cachedBalance') || '0');
        updateBalanceUI();
    }
}

// Вызываем при загрузке страницы
document.addEventListener('DOMContentLoaded', fetchUserBalance);

function updateBalanceUI() {
  const formatted = currentBalance.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (document.getElementById('balance-display')) document.getElementById('balance-display').innerText = formatted;
  if (document.getElementById('game-balance-display')) document.getElementById('game-balance-display').innerText = formatted;
  if (document.getElementById('dice-balance-display')) document.getElementById('dice-balance-display').innerText = formatted;
  if (document.getElementById('mines-balance-display')) document.getElementById('mines-balance-display').innerText = formatted;
  if (document.getElementById('profile-balance-display')) document.getElementById('profile-balance-display').innerText = formatted;
}

// --- EIGHT JET ---
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
  if (graphDot) { graphDot.setAttribute('cx', 0); graphDot.setAttribute('cy', 150); graphDot.style.opacity = '0'; }
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
  graphFill.setAttribute('d', `${pathD} L ${x} 150 L 0 150 Z`);
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
  graphDot.setAttribute('filter', 'drop-shadow(0 0 8px #D4AF37)');
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
  if (jetGlow) { jetGlow.style.opacity = '0.1'; jetGlow.style.background = 'var(--gold)'; }

  resetGraph();
  colorGraphDefault();

  waitStartTime = performance.now();
  let timeLeft = 5.0;
  
  if (waitIntervalId) clearInterval(waitIntervalId);
  waitIntervalId = setInterval(() => {
    timeLeft -= 0.1;
    const cdText = document.getElementById('countdown-text');
    if (cdText) cdText.innerText = Math.max(0, timeLeft).toFixed(1) + 's';
    if (timeLeft <= 0) { clearInterval(waitIntervalId); startFlyingPhase(); }
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

  if (currentMultiplier >= crashPoint) { endRoundCrash(); return; }

  const multiplierDisplay = document.getElementById('game-multiplier');
  const jetGlow = document.getElementById('jet-glow');

  if (multiplierDisplay) {
    multiplierDisplay.innerText = currentMultiplier.toFixed(2) + 'x';
    if (currentMultiplier > 3) { multiplierDisplay.style.color = '#FBBF24'; if (jetGlow) jetGlow.style.background = '#FBBF24'; }
    if (currentMultiplier > 5) { multiplierDisplay.style.color = '#F87171'; if (jetGlow) jetGlow.style.background = '#F87171'; }
  }

  if (jetGlow) { jetGlow.style.opacity = 0.1 + (currentMultiplier * 0.05); jetGlow.style.transform = `scale(${1 + currentMultiplier * 0.1})`; }
  
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
  if (crashedText) { crashedText.style.display = 'block'; crashedText.innerText = `УЛЕТЕЛ!`; }
  
  colorGraphRed();
  const jetGlow = document.getElementById('jet-glow');
  if (jetGlow) jetGlow.style.opacity = '0';
  
  if (playerBet.active && !playerBet.cashedOut) { if (typeof showToast === 'function') showToast(`💥 Вы проиграли ${playerBet.amount.toFixed(2)} TON`); }

  if (actionBtn) { actionBtn.className = 'jet-action-btn crashed'; actionBtn.innerText = 'УЛЕТЕЛ!'; }
  
  const inputGroup = document.getElementById('jet-input-group');
  if (inputGroup) inputGroup.classList.remove('disabled');
  
  flightHistory.unshift(crashPoint);
  if (flightHistory.length > 10) flightHistory.pop();
  renderHistory();

  setTimeout(() => { if (gameState !== 'offline') startWaitingPhase(); }, 3000);
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
  if (gameState === 'waiting') placeBet();
  else if (gameState === 'flying' && playerBet.active && !playerBet.cashedOut) handlePlayerCashout(false);
}

function placeBet() {
  if (playerBet.active) return;
  const betInput = document.getElementById('bet-amount');
  if (!betInput) return;
  const amount = parseFloat(betInput.value);
  const autoInput = document.getElementById('auto-cashout');
  const auto = autoInput ? parseFloat(autoInput.value) || 0 : 0;

  if (isNaN(amount) || amount < 1) { if (typeof showToast === 'function') showToast('⚠️ Мин. ставка 1 TON'); return; }
  if (amount > currentBalance) { if (typeof showToast === 'function') showToast('❌ Недостаточно средств'); return; }

  haptic('medium');
  currentBalance -= amount;
  updateBalanceUI();

  playerBet.active = true;
  playerBet.amount = amount;
  playerBet.cashedOut = false;
  playerBet.autoCashout = auto;

  const actionBtn = document.getElementById('jet-action-btn');
  if (actionBtn) { actionBtn.className = 'jet-action-btn waiting'; actionBtn.innerText = 'СТАВКА ПРИНЯТА!'; }
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
  if (actionBtn) { actionBtn.className = 'jet-action-btn cashed-out'; actionBtn.innerText = `ЗАБРАНО ${winAmount.toFixed(2)} TON`; }
  if (typeof showToast === 'function') showToast(isAuto ? `🤖 Авто-вывод ${winAmount.toFixed(2)} TON` : `✅ Вы забрали ${winAmount.toFixed(2)} TON`);
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
      <span class="live-bet-bet">${bet} TON</span><span class="live-bet-sep">-</span>
      <span class="live-bet-win">0 TON</span><span class="live-bet-sep">-</span>
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
    document.getElementById('games-play-view').style.display = 'flex'; 
    renderHistory();
    startWaitingPhase();
  }, 2000);
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
  if (modal) modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}


// ==========================================
// DICE (С кастомным кубиком)
// ==========================================
let isDiceRolling = false;

// Функция генерации HTML для граней кубика
function getDiceFaceHTML(num) {
  const pips = {
    1: '<span class="pip p-center"></span>',
    2: '<span class="pip p-top-right"></span><span class="pip p-bottom-left"></span>',
    3: '<span class="pip p-top-right"></span><span class="pip p-center"></span><span class="pip p-bottom-left"></span>',
    4: '<span class="pip p-top-left"></span><span class="pip p-top-right"></span><span class="pip p-bottom-left"></span><span class="pip p-bottom-right"></span>',
    5: '<span class="pip p-top-left"></span><span class="pip p-top-right"></span><span class="pip p-center"></span><span class="pip p-bottom-left"></span><span class="pip p-bottom-right"></span>',
    6: '<span class="pip p-top-left"></span><span class="pip p-top-right"></span><span class="pip p-mid-left"></span><span class="pip p-mid-right"></span><span class="pip p-bottom-left"></span><span class="pip p-bottom-right"></span>'
  };
  return `<div class="die-face face-${num}">${pips[num]}</div>`;
}

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

  if (isNaN(betAmount) || betAmount < 1) { if (typeof showToast === 'function') showToast('⚠️ Мин. ставка 1 TON'); return; }
  if (betAmount > currentBalance) { if (typeof showToast === 'function') showToast('❌ Недостаточно средств'); return; }

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
  diceCube.innerHTML = getDiceFaceHTML(1); // Сброс на 1 при начале броска

  setTimeout(() => {
    diceCube.classList.remove('rolling');
    const roll = Math.floor(Math.random() * 6) + 1;
    diceCube.innerHTML = getDiceFaceHTML(roll);

    let isWin = false;
    let payoutMultiplier = 0;

    if (choice === 'over' && roll > 3) { isWin = true; payoutMultiplier = 2.0; }
    else if (choice === 'under' && roll < 3) { isWin = true; payoutMultiplier = 2.5; }

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
// MINES GAME
// ==========================================
let minesCount = 3;
let isMinesPlaying = false;
let minesBetAmount = 0;
let currentMinesMultiplier = 1.00;
let currentMinesSafeClicks = 0;
let minesPositions = [];
const TOTAL_CELLS = 25;

function startMinesLoading() {
  haptic('medium');
  document.getElementById('games-list-view').style.display = 'none';
  document.getElementById('games-loading-view').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('games-loading-view').style.display = 'none';
    document.getElementById('mines-play-view').style.display = 'flex';
    updateBalanceUI();
    initMinesGame();
  }, 1500);
}

function closeMinesGame() {
  haptic('light');
  if (isMinesPlaying) {
    cashOutMines(true); // Авто-кэшаут при выходе
  }
  document.getElementById('mines-play-view').style.display = 'none';
  document.getElementById('games-list-view').style.display = 'block';
}

function setMinesCount(count, btn) {
  if (isMinesPlaying) return;
  haptic('light');
  minesCount = count;
  document.querySelectorAll('.mine-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateMinesNextMultiplier(0); // Обновляем множитель для 0 кликов
}

function setMinesBet(amount) {
  if (isMinesPlaying) return;
  haptic('light');
  let betAmount = 10;
  if (amount === 'max') betAmount = Math.floor(currentBalance);
  else betAmount = amount;
  if (betAmount > currentBalance) betAmount = Math.floor(currentBalance);
  if (betAmount < 1) betAmount = 1;
  document.getElementById('mines-bet-amount').value = betAmount;
}

function calculateMinesMultiplier(safeClicks) {
  let prob = 1.0;
  for (let i = 0; i < safeClicks; i++) {
    prob *= (TOTAL_CELLS - minesCount - i) / (TOTAL_CELLS - i);
  }
  // Комиссия казино ~3%
  return (1 / prob) * 0.97;
}

function updateMinesNextMultiplier(safeClicks) {
  const multEl = document.getElementById('mines-next-mult');
  if (multEl) {
    const nextMult = calculateMinesMultiplier(safeClicks + 1);
    multEl.innerText = nextMult.toFixed(2) + 'x';
  }
}

function initMinesGame() {
  isMinesPlaying = false;
  currentMinesSafeClicks = 0;
  currentMinesMultiplier = 1.00;
  minesPositions = [];
  
  const grid = document.getElementById('mines-grid');
  grid.innerHTML = '';
  
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const cell = document.createElement('div');
    cell.className = 'mines-cell';
    cell.dataset.index = i;
    cell.onclick = () => handleMinesClick(i, cell);
    grid.appendChild(cell);
  }
  
  const actionBtn = document.getElementById('mines-action-btn');
  actionBtn.className = 'jet-action-btn waiting';
  actionBtn.innerText = 'СДЕЛАТЬ СТАВКУ';
  
  document.getElementById('mines-input-group').classList.remove('disabled');
  document.getElementById('mines-selector').style.pointerEvents = 'auto';
  updateMinesNextMultiplier(0);
}

function handleMinesAction() {
  if (isMinesPlaying) {
    cashOutMines(false);
  } else {
    startMinesGame();
  }
}

function startMinesGame() {
  const betInput = document.getElementById('mines-bet-amount');
  minesBetAmount = parseFloat(betInput.value);

  if (isNaN(minesBetAmount) || minesBetAmount < 1) { if (typeof showToast === 'function') showToast('⚠️ Мин. ставка 1 TON'); return; }
  if (minesBetAmount > currentBalance) { if (typeof showToast === 'function') showToast('❌ Недостаточно средств'); return; }

  haptic('medium');
  currentBalance -= minesBetAmount;
  updateBalanceUI();

  isMinesPlaying = true;
  currentMinesSafeClicks = 0;
  
  // Генерируем позиции мин
  minesPositions = [];
  while(minesPositions.length < minesCount) {
    const r = Math.floor(Math.random() * TOTAL_CELLS);
    if (!minesPositions.includes(r)) minesPositions.push(r);
  }

  const grid = document.getElementById('mines-grid');
  Array.from(grid.children).forEach(cell => {
    cell.className = 'mines-cell';
    cell.innerText = '';
  });

  const actionBtn = document.getElementById('mines-action-btn');
  actionBtn.className = 'jet-action-btn cashout';
  actionBtn.innerText = 'ЗАБРАТЬ 0.00 TON';
  
  document.getElementById('mines-input-group').classList.add('disabled');
  document.getElementById('mines-selector').style.pointerEvents = 'none';
}

function handleMinesClick(index, cell) {
  if (!isMinesPlaying || cell.classList.contains('revealed')) return;
  
  cell.classList.add('revealed');

  if (minesPositions.includes(index)) {
    // Взрыв
    cell.classList.add('mine', 'crashed');
    cell.innerText = '💥';
    isMinesPlaying = false;
    haptic('heavy');
    
    // Открываем все мины
    const grid = document.getElementById('mines-grid');
    Array.from(grid.children).forEach((c, i) => {
      if (minesPositions.includes(i) && i !== index) {
        c.classList.add('revealed', 'mine');
        c.innerText = '💣';
      }
    });

    const actionBtn = document.getElementById('mines-action-btn');
    actionBtn.className = 'jet-action-btn crashed';
    actionBtn.innerText = 'ВЗОРВАЛОСЬ!';
    
    document.getElementById('mines-input-group').classList.remove('disabled');
    document.getElementById('mines-selector').style.pointerEvents = 'auto';
    if (typeof showToast === 'function') showToast(`💥 Вы наткнулись на мину и проиграли ${minesBetAmount.toFixed(2)} TON`);
    
    setTimeout(initMinesGame, 3000);

  } else {
    // Алмаз
    cell.classList.add('safe');
    cell.innerText = '💎';
    currentMinesSafeClicks++;
    haptic('light');
    
    currentMinesMultiplier = calculateMinesMultiplier(currentMinesSafeClicks);
    
    const actionBtn = document.getElementById('mines-action-btn');
    const winAmount = minesBetAmount * currentMinesMultiplier;
    actionBtn.innerText = `ЗАБРАТЬ ${winAmount.toFixed(2)} TON`;
    
    updateMinesNextMultiplier(currentMinesSafeClicks);
    
    // Если открыли все безопасные ячейки - авто-выигрыш
    if (currentMinesSafeClicks === TOTAL_CELLS - minesCount) {
      cashOutMines(false);
    }
  }
}

function cashOutMines(isSilent) {
  if (!isMinesPlaying) return;
  
  const winAmount = minesBetAmount * currentMinesMultiplier;
  currentBalance += winAmount;
  updateBalanceUI();
  isMinesPlaying = false;
  
  if (!isSilent) haptic('heavy');
  
  const actionBtn = document.getElementById('mines-action-btn');
  actionBtn.className = 'jet-action-btn waiting';
  actionBtn.innerText = 'СДЕЛАТЬ СТАВКУ';
  
  document.getElementById('mines-input-group').classList.remove('disabled');
  document.getElementById('mines-selector').style.pointerEvents = 'auto';
  
  if (!isSilent && typeof showToast === 'function') {
    showToast(`✅ Вы забрали ${winAmount.toFixed(2)} TON`);
  } else if (isSilent && winAmount > 0 && typeof showToast === 'function') {
    showToast(`Авто-вывод: ${winAmount.toFixed(2)} TON`);
  }

  // Открываем поле на пару секунд перед сбросом
  const grid = document.getElementById('mines-grid');
  Array.from(grid.children).forEach((c, i) => {
    if (!c.classList.contains('revealed') && minesPositions.includes(i)) {
      c.classList.add('revealed', 'mine');
      c.innerText = '💣';
    }
  });

  setTimeout(initMinesGame, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
  updateBalanceUI();
});
