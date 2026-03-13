const POLL_MS = 15000;

const refreshBtn = document.getElementById('refreshBtn');
const totalMeetingsEl = document.getElementById('totalMeetings');
const activeEmployeesEl = document.getElementById('activeEmployees');
const leaderEl = document.getElementById('leader');
const updatedAtEl = document.getElementById('updatedAt');
const ratingBody = document.getElementById('ratingBody');
const errorEl = document.getElementById('error');
const toastEl = document.getElementById('toast');

let previousCounts = new Map();
let toastTimer;

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function hideError() {
  errorEl.classList.add('hidden');
  errorEl.textContent = '';
}

function showToast(message) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 4000);
}

function renderTable(stats) {
  ratingBody.innerHTML = '';

  if (!stats.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4">Сегодня встреч пока нет.</td>';
    ratingBody.appendChild(row);
    return;
  }

  stats.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.employeeName}</td>
      <td>${item.position || 'Оператор'}</td>
      <td><strong>${item.meetingsCount}</strong></td>
    `;
    ratingBody.appendChild(row);
  });
}

function processNewMeetings(stats) {
  stats.forEach((item) => {
    const prev = previousCounts.get(item.employeeId) || 0;
    if (item.meetingsCount > prev) {
      showToast(`Вау, красавчик! ${item.employeeName} назначил(а) новую встречу 👏`);
    }
  });

  previousCounts = new Map(stats.map((item) => [item.employeeId, item.meetingsCount]));
}

async function loadData() {
  try {
    const response = await fetch('/api/meetings/today', { cache: 'no-store' });
    const payload = await response.json();

    if (!response.ok || payload.error) {
      throw new Error(payload.error || 'Ошибка получения данных');
    }

    hideError();

    const stats = Array.isArray(payload.stats) ? payload.stats : [];
    const summary = payload.summary || {};

    totalMeetingsEl.textContent = String(summary.totalMeetings || 0);
    activeEmployeesEl.textContent = String(summary.activeEmployees || 0);

    const leader = stats[0];
    leaderEl.textContent = leader ? `${leader.employeeName} (${leader.meetingsCount})` : '—';

    updatedAtEl.textContent = `Обновлено: ${new Date(payload.generatedAt).toLocaleTimeString('ru-RU')}`;

    processNewMeetings(stats);
    renderTable(stats);
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Неизвестная ошибка');
  }
}

refreshBtn.addEventListener('click', loadData);

loadData();
setInterval(loadData, POLL_MS);
