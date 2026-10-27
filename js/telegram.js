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
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type);
  } catch (e) {}
}

// !!! ВСТАВЬ СЮДА СВОЮ НОВУЮ ССЫЛКУ ОТ CLOUDFLARE WORKERS !!!
const API_URL = 'https://casino-api.твой-ник.workers.dev'; 

async function fetchUserBalance() {
    console.log("1. Функция fetchUserBalance запущена");
    
    if (!tg || !tg.initData) {
        console.warn("2. ОШИБКА: Нет данных от Telegram (initData). Открывай строго через кнопку меню!");
        return;
    }

    console.log("3. Данные от Telegram есть. Отправляем на сервер...");
    try {
        const response = await fetch(`${API_URL}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData })
        });
        
        console.log("4. Сервер ответил, статус:", response.status);
        const data = await response.json();
        console.log("5. Ответ сервера:", data);

        if (data.success) {
            window.currentBalance = data.balance;
            if (typeof updateBalanceUI === 'function') updateBalanceUI();
            console.log("6. Баланс успешно обновлен:", data.balance);
        } else {
            console.error("6. Сервер вернул ошибку:", data.error);
            if (typeof showToast === 'function') showToast('Ошибка: ' + data.error);
        }
    } catch (err) {
        console.error("6. Ошибка сети (Сервер недоступен):", err);
        if (typeof showToast === 'function') showToast('Ошибка связи с сервером');
    }
}

// Запускаем после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка, чтобы Telegram точно передал данные
    setTimeout(fetchUserBalance, 1000);
});
