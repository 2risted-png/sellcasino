// ... (Начало файла, баланс и логика EIGHT JET остаются без изменений) ...

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
    updateDiceBalance();
    resetDiceUI();
  }, 1500);
}

function closeDiceGame() {
  haptic('light');
  document.getElementById('dice-play-view').style.display = 'none';
  document.getElementById('games-list-view').style.display = 'block';
}

function updateDiceBalance() {
  const formatted = currentBalance.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const diceBal = document.getElementById('dice-balance-display');
  if (diceBal) diceBal.innerText = formatted;
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
  
  // Списываем ставку
  currentBalance -= betAmount;
  updateBalanceUI();
  updateDiceBalance();

  isDiceRolling = true;
  
  const diceCube = document.getElementById('dice-cube');
  const resultText = document.getElementById('dice-result-text');
  const btnUnder = document.getElementById('btn-under');
  const btnOver = document.getElementById('btn-over');
  const inputGroup = document.getElementById('dice-input-group');

  // Блокируем UI
  inputGroup.classList.add('disabled');
  btnUnder.disabled = true;
  btnOver.disabled = true;
  resultText.classList.remove('show', 'win', 'loss');
  
  // Запускаем анимацию
  diceCube.classList.add('rolling');
  diceCube.innerText = '🎲';

  // Таймер на "бросок" (1.5 сек)
  setTimeout(() => {
    diceCube.classList.remove('rolling');
    
    // Рандом 1-6
    const roll = Math.floor(Math.random() * 6) + 1;
    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    diceCube.innerText = diceEmojis[roll];

    let isWin = false;
    let payoutMultiplier = 0;

    if (choice === 'over') {
      // Больше 3 (4, 5, 6)
      if (roll > 3) {
        isWin = true;
        payoutMultiplier = 2.0;
      }
    } else if (choice === 'under') {
      // Меньше 3 (1, 2)
      if (roll < 3) {
        isWin = true;
        payoutMultiplier = 2.5;
      }
    }
    // Если выпало 3 - проигрыш для всех (казино всегда в плюсе)

    if (isWin) {
      const winAmount = betAmount * payoutMultiplier;
      currentBalance += winAmount;
      updateBalanceUI();
      updateDiceBalance();
      
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

    // Разблокируем UI через 2 секунды
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

// Инициализация DICE при загрузке (добавляем в общий DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
  updateBalanceUI();
  updateDiceBalance(); // Обновляем баланс и в DICE
});
