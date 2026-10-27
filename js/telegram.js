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

function haptic(type = 'light') {
  try {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {}
}

// ССЫЛКА НА ТВОЙ БЭКЕНД В CLOUDFLARE
const API_URL = 'https://casino-api.vercel-coder.workers.dev';

// Функция загрузки баланса с сервера
async function fetchUserBalance() {
    if (!tg || !tg.initData) {
        console.warn('Не в Telegram, баланс не загружен');
        return;
    }

    try {
        console.log('Отправка запроса на сервер...');
        const response = await fetch(`${API_URL}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData })
        });
        
        if (!response.ok) throw new Error('Ошибка сервера: ' + response.status);
        
        const data = await response.json();
        console.log('Ответ сервера:', data);

        if (data.success) {
            // Если currentBalance определена в другом файле, она обновится
            window.currentBalance = data.balance; 
            
            // Вызываем функцию обновления интерфейса
            if (typeof updateBalanceUI === 'function') {
                updateBalanceUI();
            }
            if (typeof showToast === 'function') {
                showToast(`Баланс загружен: ${data.balance} TON`);
            }
        }
    } catch (err) {
        console.error('Ошибка загрузки баланса:', err);
        if (typeof showToast === 'function') showToast('Ошибка связи с сервером');
    }
}

// Запускаем загрузку после полной загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(fetchUserBalance, 500);
});
