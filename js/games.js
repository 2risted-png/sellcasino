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

// ==========================================
// ЛОГИКА ПЕРЕХОДОВ ЭКРАНОВ ИГРЫ
// ==========================================
function startGameLoading() {
  haptic('medium');
  document.getElementById('games-list-view').style.display = 'none';
  document.getElementById('games-loading-view').style.display = 'flex';
  
  // Имитация загрузки 1.5 секунды
  setTimeout(() => {
    document.getElementById('games-loading-view').style.display = 'none';
    document.getElementById('games-play-view').style.display = 'block';
  }, 1500);
}

function closeGame() {
  haptic('light');
  // Если игра была активна, сбрасываем её
  if (isPlaying) {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    resetGame(); // Сбрасываем состояние
  }
  
  document.getElementById('games-play-view').style.display = 'none';
  document.getElementById('games-list-view').style.display = 'block';
}

// ==========================================
// ЛОГИКА EIGHT JET
// ==========================================
let isPlaying = false;
let isCrashed = false;
let currentMultiplier = 1.00;
let crashPoint = 1.00;
let betAmount = 10;
let animationFrameId = null;
let startTime = 0;

const multiplierDisplay = document.getElementById('game-multiplier');
const actionBtn = document.getElementById('jet-action-btn');
const jetIcon = document.getElementById('jet-icon');
const jetGlow = document.getElementById('jet-glow');
const crashedText = document.getElementById('jet-crashed-text');
const inputGroup = document.getElementById('jet-input-group');

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
  
  loop();
}

function loop(timestamp) {
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
  if (document.getElementById('cashout-val')) {
    document.getElementById('cashout-val').innerText = cashoutVal.toFixed(2) + ' TON';
  }

  animationFrameId = requestAnimationFrame(loop);
}

function cashOut() {
  if (!isPlaying) return;
  isPlaying = false;
  cancelAnimationFrame(animationFrameId);
  haptic('heavy');

  const winAmount = betAmount * currentMultiplier;
  currentBalance += winAmount;
  updateBalanceUI();

  actionBtn.className = 'jet-action-btn';
  actionBtn.innerText = 'ЗАБРАТЬ ' + winAmount.toFixed(2) + ' TON';
  inputGroup.classList.remove('disabled');
  
  showToast(`✅ Вы забрали ${winAmount.toFixed(2)} TON`);

  setTimeout(resetGame, 2000);
}

function crash() {
  isPlaying = false;
  isCrashed = true;
  cancelAnimationFrame(animationFrameId);
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

  setTimeout(resetGame, 3000);
}

function resetGame() {
  isPlaying = false;
  isCrashed = false;
  currentMultiplier = 1.00;
  
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
}

document.addEventListener('DOMContentLoaded', () => {
  updateBalanceUI();
});
