// --- ГЛОБАЛЬНЫЙ БАЛАНС (Синхронизирован с UI) ---
let currentBalance = 1250.50;
const startBalance = 1250.50; // Для сброса при перезагрузке (в будущем из БД)

function updateBalanceUI() {
  const formatted = currentBalance.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  document.getElementById('balance-display').innerText = formatted;
  document.getElementById('game-balance-display').innerText = formatted;
  document.getElementById('profile-balance-display').innerText = formatted;
}

// --- ПЕРЕМЕННЫЕ ИГРЫ EIGHT JET ---
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

// Установка быстрой ставки
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

// Обработка нажатия на главную кнопку
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

// Начало игры
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
  
  // Списываем ставку
  currentBalance -= betAmount;
  updateBalanceUI();

  // Настройки игры
  isPlaying = true;
  isCrashed = false;
  currentMultiplier = 1.00;
  startTime = performance.now();
  
  // Генерация точки краша (от 1.0 до 15.0, чаще падает рано)
  // Используем логарифмическое распределение для реалистичности
  const r = Math.random();
  crashPoint = 1 + (Math.pow(1 / (1 - r), 1.5) - 1);
  if (crashPoint > 50) crashPoint = 50; // Кап

  // UI
  inputGroup.classList.add('disabled');
  actionBtn.className = 'jet-action-btn cashout';
  actionBtn.innerHTML = `ЗАБРАТЬ <span class="jet-action-sub" id="cashout-val">${(betAmount).toFixed(2)} TON</span>`;
  crashedText.classList.remove('show');
  jetIcon.style.opacity = '1';
  jetIcon.style.transform = 'scale(1) rotate(0deg)';
  
  // Запуск цикла
  loop();
}

// Главный игровой цикл (60 fps)
function loop(timestamp) {
  if (!isPlaying) return;

  const elapsed = (performance.now() - startTime) / 1000; // В секундах
  
  // Формула роста множителя (экспоненциальная)
  currentMultiplier = Math.pow(1.001, elapsed * 1000);
  // Для слишком высоких значений ускоряем
  if (currentMultiplier > 2) currentMultiplier = 2 * Math.pow(1.002, (elapsed - 0.69) * 1000);

  // Проверка на краш
  if (currentMultiplier >= crashPoint) {
    crash();
    return;
  }

  // Обновление UI
  multiplierDisplay.innerText = currentMultiplier.toFixed(2) + 'x';
  
  // Динамика цвета в зависимости от множителя
  if (currentMultiplier > 3) {
    multiplierDisplay.style.color = '#FBBF24'; // Желтый
    jetGlow.style.background = '#FBBF24';
  }
  if (currentMultiplier > 5) {
    multiplierDisplay.style.color = '#F87171'; // Красный
    jetGlow.style.background = '#F87171';
  }

  // Динамика свечения и самолета
  jetGlow.style.opacity = 0.1 + (currentMultiplier * 0.05);
  jetGlow.style.transform = `scale(${1 + currentMultiplier * 0.1})`;
  jetIcon.style.transform = `translateY(${Math.sin(elapsed * 10) * 5}px) scale(${1 + currentMultiplier * 0.02}) rotate(${currentMultiplier * 2}deg)`;

  // Обновляем кнопку кэшаута
  const cashoutVal = betAmount * currentMultiplier;
  if (document.getElementById('cashout-val')) {
    document.getElementById('cashout-val').innerText = cashoutVal.toFixed(2) + ' TON';
  }

  animationFrameId = requestAnimationFrame(loop);
}

// Забрать деньги
function cashOut() {
  if (!isPlaying) return;
  isPlaying = false;
  cancelAnimationFrame(animationFrameId);
  haptic('heavy');

  const winAmount = betAmount * currentMultiplier;
  currentBalance += winAmount;
  updateBalanceUI();

  // UI
  actionBtn.className = 'jet-action-btn';
  actionBtn.innerText = 'ЗАБРАТЬ ' + winAmount.toFixed(2) + ' TON';
  inputGroup.classList.remove('disabled');
  
  showToast(`✅ Вы забрали ${winAmount.toFixed(2)} TON`);

  // Сброс через 2 секунды
  setTimeout(resetGame, 2000);
}

// Краш (проигрыш)
function crash() {
  isPlaying = false;
  isCrashed = true;
  cancelAnimationFrame(animationFrameId);
  haptic('heavy');

  // UI
  multiplierDisplay.innerText = crashPoint.toFixed(2) + 'x';
  multiplierDisplay.style.color = '#F87171';
  crashedText.classList.add('show');
  jetIcon.style.opacity = '0';
  jetGlow.style.opacity = '0';
  
  actionBtn.className = 'jet-action-btn crashed';
  actionBtn.innerText = 'УЛЕТЕЛ!';
  inputGroup.classList.remove('disabled');
  
  showToast(`💥 Краш на ${crashPoint.toFixed(2)}x`);

  // Автоматический сброс через 3 секунды
  setTimeout(resetGame, 3000);
}

// Сброс игры в начальное состояние
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  updateBalanceUI();
});
