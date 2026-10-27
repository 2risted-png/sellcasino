let toastTimer;
function showToast(text) {
  haptic('light');
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  
  const activeNavBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (activeNavBtn) activeNavBtn.classList.add('active');
  
  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) activeTab.classList.add('active');
  
  document.querySelector('.app-content').scrollTop = 0;
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    haptic('light');
    const tabId = item.getAttribute('data-tab');
    switchTab(tabId);
  });
});

const balanceEl = document.getElementById('balance-display');
let start = 0;
const target = 1250.50;
const duration = 1500;
const balanceStartTime = performance.now();

function animateBalance(currentTime) {
  const elapsed = currentTime - balanceStartTime;
  const progress = Math.min(elapsed / duration, 1);
  const easeOut = 1 - Math.pow(1 - progress, 3);
  const currentVal = start + (target - start) * easeOut;
  if (balanceEl) {
    balanceEl.innerText = currentVal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (progress < 1) requestAnimationFrame(animateBalance);
}
setTimeout(() => requestAnimationFrame(animateBalance), 300);

document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    haptic('light');
    const item = header.parentElement;
    const content = header.nextElementSibling;
    document.querySelectorAll('.accordion-item').forEach(otherItem => {
      if (otherItem !== item && otherItem.classList.contains('active')) {
        otherItem.classList.remove('active');
        otherItem.querySelector('.accordion-content').style.maxHeight = null;
      }
    });
    item.classList.toggle('active');
    if (item.classList.contains('active')) content.style.maxHeight = content.scrollHeight + "px";
    else content.style.maxHeight = null;
  });
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) { loader.style.opacity = '0'; loader.style.visibility = 'hidden'; }
  }, 2000);
});

let carouselInterval;
function resetCarousel() {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;
  const cards = track.querySelectorAll('.review-card');
  let currentIndex = 0;
  track.style.transform = `translateX(0%)`;
  if (carouselInterval) clearInterval(carouselInterval);
  if (cards.length > 1) {
    carouselInterval = setInterval(() => {
      currentIndex++;
      if (currentIndex >= cards.length) currentIndex = 0;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    }, 4000);
  }
}

// ==========================================
// СИСТЕМА ВЫВОДА СРЕДСТВ
// ==========================================
let currentWithdrawType = null;

function openWithdrawModal() {
  haptic('light');
  document.getElementById('withdrawMethodModal').style.display = 'flex';
  document.getElementById('withdrawCryptoModal').style.display = 'none';
  document.getElementById('withdrawFormModal').style.display = 'none';
}

function closeWithdrawModal() {
  haptic('light');
  document.getElementById('withdrawMethodModal').style.display = 'none';
  document.getElementById('withdrawCryptoModal').style.display = 'none';
  document.getElementById('withdrawFormModal').style.display = 'none';
}

function selectWithdrawType(type) {
  haptic('light');
  document.getElementById('withdrawMethodModal').style.display = 'none';
  document.getElementById('withdrawCryptoModal').style.display = 'none';
  document.getElementById('withdrawFormModal').style.display = 'none';

  if (type === 'crypto') {
    document.getElementById('withdrawCryptoModal').style.display = 'flex';
    return;
  }

  currentWithdrawType = type;
  const title = document.getElementById('withdraw-form-title');
  const label = document.getElementById('withdraw-address-label');
  const input = document.getElementById('withdraw-address');

  if (type === 'card') {
    title.innerText = 'Вывод на карту';
    label.innerText = 'Номер карты (16 цифр)';
    input.placeholder = '0000 0000 0000 0000';
  } else if (type === 'phone') {
    title.innerText = 'Вывод на телефон';
    label.innerText = 'Номер телефона';
    input.placeholder = '+7 (999) 000-00-00';
  } else if (['trc20', 'erc20', 'bep20', 'ton', 'trx'].includes(type)) {
    title.innerText = `Вывод в сети ${type.toUpperCase()}`;
    label.innerText = 'Адрес кошелька';
    input.placeholder = 'Введите адрес...';
  }

  document.getElementById('withdrawFormModal').style.display = 'flex';
  document.getElementById('withdraw-amount').value = '';
  document.getElementById('withdraw-address').value = '';
}

function submitWithdrawal() {
  const amount = parseFloat(document.getElementById('withdraw-amount').value);
  const address = document.getElementById('withdraw-address').value;

  if (!amount || amount < 10) { showToast('⚠️ Мин. сумма вывода 10 TON'); return; }
  if (!address || address.length < 5) { showToast('⚠️ Введите корректные реквизиты'); return; }
  if (amount > currentBalance) { showToast('❌ Недостаточно средств'); return; }

  haptic('heavy');
  currentBalance -= amount;
  updateBalanceUI();

  const newRequest = {
    id: Date.now().toString().slice(-6),
    date: new Date().toLocaleString('ru-RU'),
    type: currentWithdrawType,
    amount: amount,
    address: address,
    status: 'pending'
  };

  let requests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
  requests.push(newRequest);
  localStorage.setItem('withdrawalRequests', JSON.stringify(requests));

  closeWithdrawModal();
  showToast(`✅ Заявка на вывод ${amount.toFixed(2)} TON создана`);
}

// ==========================================
// ЧАТ ТЕХПОДДЕРЖКИ (СТОРОНА ИГРОКА)
// ==========================================
const PLAYER_ID = "Player_1"; // В будущем можно брать tg.initDataUnsafe.user.id

function openSupportChat() {
  haptic('light');
  document.getElementById('supportChatModal').style.display = 'flex';
  renderUserChat();
}

function sendUserMessage() {
  const input = document.getElementById('user-chat-input');
  const text = input.value.trim();
  if (!text) return;

  haptic('medium');

  let chats = JSON.parse(localStorage.getItem('support_chats') || '{}');
  if (!chats[PLAYER_ID]) chats[PLAYER_ID] = [];

  chats[PLAYER_ID].push({
    sender: 'user',
    text: text,
    time: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})
  });

  localStorage.setItem('support_chats', JSON.stringify(chats));
  input.value = '';
  renderUserChat();
}

function renderUserChat() {
  const box = document.getElementById('user-chat-box');
  if (!box) return;

  let chats = JSON.parse(localStorage.getItem('support_chats') || '{}');
  const messages = chats[PLAYER_ID] || [];

  if (messages.length === 0) {
    box.innerHTML = '<div style="text-align:center; color:var(--text-dim); font-size:12px; margin-top:20px;">Опишите вашу проблему, и мы ответим в ближайшее время.</div>';
    return;
  }

  box.innerHTML = '';
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.sender}`;
    div.innerHTML = `${msg.text} <span class="chat-time">${msg.time}</span>`;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
}
