document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const gameName = card.getAttribute('data-game');
    showToast(`Запуск игры: ${gameName}`);
  });
});

document.getElementById('promoBanner').addEventListener('click', () => {
  showToast('🎰 Запуск Lucky Spin!');
});

document.getElementById('topupBtn').addEventListener('click', () => {
  showToast('🪙 Переход к пополнению...');
});

document.getElementById('seeAllBtn').addEventListener('click', () => {
  showToast('Открытие каталога игр...');
});