const defaultData = {
  appName: "Casino Sell",
  stats: { players: "1,245", withdraws: "50,000", rtp: "96.5" },
  reviews: [
    { name: "Alex_99", avatar: "A", color: "#D4AF37", stars: "★★★★★", text: "Вывел первый джекпот! Шок. Пришло за 2 минуты, всё честно." },
    { name: "MaxCrypto", avatar: "M", color: "#0d9488", stars: "★★★★★", text: "Играю в Crash каждый вечер. Графика плавная, ничего не лагает." },
    { name: "Satoshi", avatar: "S", color: "#2DD4BF", stars: "★★★★☆", text: "Топ слоты реально дают жару. Пока в плюсе на 500 TON." }
  ]
};

let appData = JSON.parse(localStorage.getItem('casinoData')) || defaultData;
let currentAdminChatUser = null;

function saveData() {
  localStorage.setItem('casinoData', JSON.stringify(appData));
  applyDataToUI();
}

function applyDataToUI() {
  document.title = appData.appName;
  if (document.getElementById('greeting-text')) document.getElementById('greeting-text').innerText = `Добро пожаловать в ${appData.appName}`;
  if (document.getElementById('stat-players')) document.getElementById('stat-players').innerText = appData.stats.players;
  if (document.getElementById('stat-withdraws')) document.getElementById('stat-withdraws').innerText = appData.stats.withdraws;
  if (document.getElementById('stat-rtp')) document.getElementById('stat-rtp').innerText = appData.stats.rtp + '%';
  renderReviews();
}

function renderReviews() {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;
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
// ЛОГИКА АВТОРИЗАЦИИ (ИСПРАВЛЕН БАГ С ВХОДОМ)
// ==========================================
function toggleAdminPanel() {
  const panel = document.getElementById('adminPanel');
  const loginView = document.getElementById('adminLoginView');
  const mainView = document.getElementById('adminMainView');
  const bottomNav = document.querySelector('.bottom-nav');
  
  // Теперь мы используем класс active, который управляет display: flex / none
  const isActive = panel.classList.toggle('active');
  if (typeof haptic === 'function') haptic('medium');

  if (bottomNav) {
    bottomNav.style.display = isActive ? 'none' : 'flex';
  }

  if (isActive) {
    if (sessionStorage.getItem('adminAuth') === 'true') {
      loginView.style.display = 'none';
      mainView.style.display = 'flex';
      fillAdminInputs();
    } else {
      loginView.style.display = 'flex';
      mainView.style.display = 'none';
    }
  }
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
    if (typeof showToast === 'function') showToast('✅ Вход выполнен');
  } else {
    if (typeof showToast === 'function') showToast('❌ Неверный логин или пароль');
  }
}

function logoutAdmin() {
  sessionStorage.removeItem('adminAuth');
  toggleAdminPanel();
  if (typeof showToast === 'function') showToast('Вы вышли из админки');
}

// ==========================================
// РАБОТА С АДМИНКОЙ
// ==========================================
function switchAdminTab(tabId, btn) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  
  btn.classList.add('active');
  document.getElementById(`admin-${tabId}`).classList.add('active');
  
  if (tabId === 'withdrawals') {
    renderAdminWithdrawals();
  } else if (tabId === 'support') {
    renderAdminSupportList();
    document.getElementById('admin-support-chat').style.display = 'none';
    document.getElementById('admin-support-list').style.display = 'block';
  }
}

function fillAdminInputs() {
  document.getElementById('admin-app-name').value = appData.appName;
  document.getElementById('admin-players').value = appData.stats.players;
  document.getElementById('admin-withdraws').value = appData.stats.withdraws;
  document.getElementById('admin-rtp').value = appData.stats.rtp;
  renderAdminReviewsList();
  renderAdminWithdrawals();
}

function saveAdminSettings() {
  appData.appName = document.getElementById('admin-app-name').value;
  appData.stats.players = document.getElementById('admin-players').value;
  appData.stats.withdraws = document.getElementById('admin-withdraws').value;
  appData.stats.rtp = document.getElementById('admin-rtp').value;
  
  saveData();
  if (typeof showToast === 'function') showToast('✅ Настройки сохранены!');
}

function addReview() {
  const name = document.getElementById('review-name').value;
  const text = document.getElementById('review-text').value;
  
  if (!name || !text) {
    if (typeof showToast === 'function') showToast('⚠️ Заполните имя и текст');
    return;
  }

  appData.reviews.push({
    name: name,
    avatar: name.charAt(0).toUpperCase(),
    color: "#D4AF37",
    stars: "★★★★★",
    text: text
  });

  saveData();
  
  document.getElementById('review-name').value = '';
  document.getElementById('review-text').value = '';
  
  renderAdminReviewsList();
  if (typeof showToast === 'function') showToast('✅ Отзыв добавлен!');
}

function deleteReview(index) {
  appData.reviews.splice(index, 1);
  saveData();
  renderAdminReviewsList();
  if (typeof showToast === 'function') showToast('🗑️ Отзыв удален');
}

function renderAdminReviewsList() {
  const list = document.getElementById('admin-reviews-list');
  if (!list) return;
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

// ==========================================
// РЕНДЕР ЗАЯВОК НА ВЫВОД
// ==========================================
function renderAdminWithdrawals() {
  const list = document.getElementById('admin-withdrawals-list');
  if (!list) return;
  
  let requests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
  
  if (requests.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: var(--text-dim); margin-top: 20px;">Заявок пока нет</p>';
    return;
  }

  list.innerHTML = '';
  
  requests.reverse().forEach((req, index) => {
    const item = document.createElement('div');
    item.className = 'admin-withdrawal-item';
    
    let typeText = req.type.toUpperCase();
    if (req.type === 'card') typeText = 'БАНК. КАРТА';
    if (req.type === 'phone') typeText = 'ТЕЛЕФОН';

    item.innerHTML = `
      <div class="admin-withdrawal-header">
        <span>#${req.id} (${typeText})</span>
        <span>${req.date}</span>
      </div>
      <div class="admin-withdrawal-data">${req.address}</div>
      <div class="admin-withdrawal-amount">${req.amount.toFixed(2)} TON</div>
      <div class="admin-withdrawal-actions">
        <button class="btn-approve" onclick="updateWithdrawalStatus(${requests.length - 1 - index}, 'approved')">Выплачено</button>
        <button class="btn-reject" onclick="updateWithdrawalStatus(${requests.length - 1 - index}, 'rejected')">Отклонить</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function updateWithdrawalStatus(index, status) {
  let requests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
  if (requests[index]) {
    requests.splice(index, 1);
    localStorage.setItem('withdrawalRequests', JSON.stringify(requests));
    renderAdminWithdrawals();
    if (typeof showToast === 'function') showToast(status === 'approved' ? '✅ Выплачено' : '❌ Отклонено');
  }
}

// ==========================================
// ЧАТ ТЕХПОДДЕРЖКИ (СТОРОНА АДМИНА)
// ==========================================
function renderAdminSupportList() {
  const list = document.getElementById('admin-support-list');
  if (!list) return;

  let chats = JSON.parse(localStorage.getItem('support_chats') || '{}');
  const keys = Object.keys(chats);

  if (keys.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: var(--text-dim); margin-top: 20px;">Обращений нет</p>';
    return;
  }

  list.innerHTML = '';
  keys.forEach(userId => {
    const msgs = chats[userId];
    if (msgs.length === 0) return;
    
    const lastMsg = msgs[msgs.length - 1];

    const div = document.createElement('div');
    div.className = 'admin-support-user';
    div.onclick = () => openAdminChat(userId);
    div.innerHTML = `
      <div>
        <div class="user-name">👤 ${userId.replace('_', ' ')}</div>
        <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${lastMsg.sender === 'admin' ? 'Вы: ' : ''}${lastMsg.text}
        </div>
      </div>
      <div style="font-size: 10px; color: var(--gold); font-weight: bold;">${lastMsg.time}</div>
    `;
    list.appendChild(div);
  });
}

function openAdminChat(userId) {
  haptic('light');
  currentAdminChatUser = userId;
  
  document.getElementById('admin-support-list').style.display = 'none';
  document.getElementById('admin-support-chat').style.display = 'flex';
  document.getElementById('admin-chat-user-name').innerText = `Диалог: ${userId.replace('_', ' ')}`;
  
  renderAdminChat();
}

function closeAdminChat() {
  haptic('light');
  currentAdminChatUser = null;
  document.getElementById('admin-support-chat').style.display = 'none';
  document.getElementById('admin-support-list').style.display = 'block';
  renderAdminSupportList(); // Обновляем список на случай новых сообщений
}

function sendAdminMessage() {
  if (!currentAdminChatUser) return;
  const input = document.getElementById('admin-chat-input');
  const text = input.value.trim();
  if (!text) return;

  haptic('medium');

  let chats = JSON.parse(localStorage.getItem('support_chats') || '{}');
  if (!chats[currentAdminChatUser]) chats[currentAdminChatUser] = [];

  chats[currentAdminChatUser].push({
    sender: 'admin',
    text: text,
    time: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})
  });

  localStorage.setItem('support_chats', JSON.stringify(chats));
  input.value = '';
  renderAdminChat();
}

function renderAdminChat() {
  const box = document.getElementById('admin-chat-box');
  if (!box || !currentAdminChatUser) return;

  let chats = JSON.parse(localStorage.getItem('support_chats') || '{}');
  const messages = chats[currentAdminChatUser] || [];

  box.innerHTML = '';
  messages.forEach(msg => {
    const div = document.createElement('div');
    // Инвертируем классы: сообщения клиента слева, админа справа
    div.className = `chat-msg ${msg.sender === 'user' ? 'admin' : 'user'}`; 
    div.innerHTML = `${msg.text} <span class="chat-time">${msg.time}</span>`;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  applyDataToUI();
});
