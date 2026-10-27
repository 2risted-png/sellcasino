document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const gameName = card.getAttribute('data-game');
    showToast(`Запуск игры: ${gameName}`);
  });
});
