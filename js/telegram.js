const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  const user = tg.initDataUnsafe?.user;
  if (user && user.first_name) {
    document.getElementById('username').innerText = user.first_name;
  }
}

function haptic(type = 'light') {
  if (tg) tg.HapticFeedback.impactOccurred(type);
}