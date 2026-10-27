const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  const user = tg.initDataUnsafe?.user;
  if (user && user.first_name) {
    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.innerText = user.first_name;
  }
}

// Безопасный вызов вибрации с проверкой версии
function haptic(type = 'light') {
  try {
    if (tg && tg.HapticFeedback && tg.isVersionAtLeast('6.1')) {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {
    // Игнорируем ошибку, если версия Telegram старая
  }
}
