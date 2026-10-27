let toastTimer;
function showToast(text) {
  haptic('light');
  const toast = document.getElementById('toast');
  toast.innerText = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    haptic('light');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// Анимация баланса
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
  
  balanceEl.innerText = currentVal.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (progress < 1) requestAnimationFrame(animateBalance);
}
setTimeout(() => requestAnimationFrame(animateBalance), 300);