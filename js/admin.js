// Дефолтные данные (если LocalStorage пуст)
const defaultData = {
  appName: "Casino Sell",
  jackpot: "15,430.00",
  stats: { players: "1,245", withdraws: "50,000", rtp: "96.5" },
  reviews: [
    { name: "Alex_99", avatar: "A", color: "#2DD4BF", stars: "★★★★★", text: "Вывел первый джекпот! Шок. Пришло за 2 минуты, всё честно. Интерфейс просто космос." },
    { name: "MaxCrypto", avatar: "M", color: "#0d9488", stars: "★★★★★", text: "Играю в Crash каждый вечер. Графика плавная, ничего не лагает. Радует адекватная поддержка." },
    { name: "Satoshi", avatar: "S", color: "#2DD4BF", stars: "★★★★☆", text: "Топ слоты реально дают жару. Пока в плюсе на 500 TON. Дизайн приятный, глаза не устают." }
  ]
};

let appData = JSON.parse(localStorage.getItem('casinoData')) || defaultData;

function saveData() {
  localStorage.setItem('casinoData', JSON.stringify(appData));
  applyDataToUI();
}

// Применение данных к интерфейсу
function applyDataToUI() {
  document.title = appData.appName;
  document.getElementById('greeting-text').innerText = `Добро пожаловать в ${appData.appName}`;
  document.getElementById('jackpot-display').innerText = appData.jackpot;
  document.getElementById('stat-players').innerText = appData.stats.players;
  document.getElementById('stat-withdraws').innerText = appData.stats.withdraws;
  document.getElementById('stat-rtp').innerText = appData.stats.rtp + '%';
  renderReviews();
}

// Отрисовка отзывов
function renderReviews() {
  const track = document.getElementById('reviewsTrack');
  track.innerHTML = ''; 

  appData.reviews.forEach(review => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-top">
        <div class="review-user">
          <div class="review-avatar" style="background: ${review.color};">${review.avatar}</div>
          <div class="review-name">${review.name}</div>
        </div>
        <div class="review-stars">${review.stars}</div>
      </div>
      <div class="review-text">${review.text}</div>
    `;
    track.appendChild(card);
  });

  if (typeof resetCarousel === 'function') resetCarousel();
}

// ==========================================
// ЛОГИКА АВТОРИЗАЦИИ
// ==========================================
function toggleAdminPanel() {
  const panel = document.getElementById('adminPanel');
  const loginView = document.getElementById('adminLoginView');
  const mainView = document.getElementById('adminMainView');
  
  panel.classList.toggle('active');
  
  if (panel.classList.contains('active')) {
    // Если панель открывается, проверяем авторизацию
    if (sessionStorage.getItem('adminAuth') === 'true') {
      loginView.style.display = 'none';
      mainView.style.display = 'flex';
      fillAdminInputs();
    } else {
      loginView.style.display = 'flex';
      mainView.style.display = 'none';
    }
  }
  haptic('medium');
}

function loginAdmin() {
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
  
  if (user === 'admin' && pass === 'admin123') {
    sessionStorage.setItem('adminAuth', 'true');
    document.getElementById('adminLoginView').style.display = 'none';
    document.getElementById('adminMainView').style.display = 'flex';
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    fillAdminInputs();
    showToast('✅ Вход выполнен');
  } else {
    showToast('❌ Неверный логин или пароль');
  }
}

function logoutAdmin() {
  sessionStorage.removeItem('adminAuth');
  toggleAdminPanel();
  showToast('Вы вышли из админки');
}

// ==========================================
// РАБОТА С АДМИНКОЙ
// ==========================================
function switchAdminTab(tabId, btn) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  
  btn.classList.add('active');
  document.getElementById(`admin-${tabId}`).classList.add('active');
}

function fillAdminInputs() {
  document.getElementById('admin-app-name').value = appData.appName;
  document.getElementById('admin-jackpot').value = appData.jackpot;
  document.getElementById('admin-players').value = appData.stats.players;
  document.getElementById('admin-withdraws').value = appData.stats.withdraws;
  document.getElementById('admin-rtp').value = appData.stats.rtp;
  renderAdminReviewsList();
}

function saveAdminSettings() {
  appData.appName = document.getElementById('admin-app-name').value;
  appData.jackpot = document.getElementById('admin-jackpot').value;
  appData.stats.players = document.getElementById('admin-players').value;
  appData.stats.withdraws = document.getElementById('admin-withdraws').value;
  appData.stats.rtp = document.getElementById('admin-rtp').value;
  
  saveData();
  showToast('✅ Настройки сохранены!');
}

function addReview() {
  const name = document.getElementById('review-name').value;
  const text = document.getElementById('review-text').value;
  
  if (!name || !text) {
    showToast('⚠️ Заполните имя и текст');
    return;
  }

  appData.reviews.push({
    name: name,
    avatar: name.charAt(0).toUpperCase(),
    color: "#2DD4BF",
    stars: "★★★★★",
    text: text
  });

  saveData();
  
  document.getElementById('review-name').value = '';
  document.getElementById('review-text').value = '';
  
  renderAdminReviewsList();
  showToast('✅ Отзыв добавлен!');
}

function deleteReview(index) {
  appData.reviews.splice(index, 1);
  saveData();
  renderAdminReviewsList();
  showToast('🗑️ Отзыв удален');
}

function renderAdminReviewsList() {
  const list = document.getElementById('admin-reviews-list');
  list.innerHTML = '';
  
  appData.reviews.forEach((review, index) => {
    const item = document.createElement('div');
    item.className = 'admin-review-item';
    item.innerHTML = `
      <span>${review.name}</span>
      <button onclick="deleteReview(${index})">Удалить</button>
    `;
    list.appendChild(item);
  });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  applyDataToUI();
});
