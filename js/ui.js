let toastTimer;
function showToast(text) {
  haptic('light');
  const toast = document.getElementById('toast');
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
const startTime = performance.now();

function animateBalance(currentTime) {
  const elapsed = currentTime - startTime;
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
