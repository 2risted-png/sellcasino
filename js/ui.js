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

// АНИМАЦИЯ БАЛАНСА
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
    balanceEl.innerText = currentVal.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  if (progress < 1) requestAnimationFrame(animateBalance);
}
setTimeout(() => requestAnimationFrame(animateBalance), 300);

// АККОРДЕОН
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
    if (item.classList.contains('active')) {
      content.style.maxHeight = content.scrollHeight + "px";
    } else {
      content.style.maxHeight = null;
    }
  });
});

// ЗАГРУЗКА
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
    }
  }, 2000);
});

// КАРУСЕЛЬ ОТЗЫВОВ
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
