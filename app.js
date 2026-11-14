const STORAGE_KEY = 'ritmo-habits-v1';
const palette = ['mint', 'lilac', 'peach', 'blue', 'yellow', 'pink'];
const icons = ['✳', '◉', '⌁', '✿', '☼', '◇', '↗', '♡'];
const $ = (selector) => document.querySelector(selector);

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readHabits() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((habit) => habit && typeof habit.id === 'string' && typeof habit.name === 'string') : [];
  } catch {
    return [];
  }
}

let habits = readHabits();
let toastTimer;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function dateForWeekday(index) {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);
  monday.setDate(monday.getDate() + index);
  return monday;
}

function currentStreak(habit) {
  const today = new Date();
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!habit.completed?.[localDateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (habit.completed?.[localDateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2300);
}

function renderWeekHeader() {
  const names = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const todayKey = localDateKey(new Date());
  $('#week-header').innerHTML = `<span class="week-spacer">ABITUDINE</span>${names.map((name, i) => {
    const date = dateForWeekday(i);
    const isToday = localDateKey(date) === todayKey;
    return `<span class="day-heading${isToday ? ' is-today' : ''}"><span>${name}</span><b>${date.getDate()}</b></span>`;
  }).join('')}<span class="streak-heading">SERIE</span>`;
}

function render() {
  renderWeekHeader();
  const list = $('#habit-list');
  const empty = habits.length === 0;
  list.innerHTML = '';
  $('#empty-state').hidden = !empty;
  list.hidden = empty;
  $('#habit-count').textContent = habits.length;

  const todayKey = localDateKey(new Date());
  const completedToday = habits.filter((habit) => habit.completed?.[todayKey]).length;
  const percent = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;
  $('#today-count').textContent = completedToday;
  $('#today-total').textContent = `/ ${habits.length} ${habits.length === 1 ? 'completata' : 'completate'}`;
  $('#today-progress').style.width = `${percent}%`;
  $('#today-message').textContent = habits.length === 0 ? 'Ogni inizio conta.' : percent === 100 ? 'Bravissima, hai fatto tutto! ✨' : percent > 0 ? 'Ottimo, continua così.' : 'Un piccolo passo alla volta.';

  const streak = habits.reduce((best, habit) => Math.max(best, currentStreak(habit)), 0);
  $('#best-streak').textContent = streak;
  const weekTotal = habits.reduce((sum, habit) => sum + Array.from({ length: 7 }, (_, i) => habit.completed?.[localDateKey(dateForWeekday(i))] ? 1 : 0).reduce((a, b) => a + b, 0), 0);
  $('#week-count').textContent = weekTotal;
  $('#week-caption').textContent = weekTotal === 0 ? 'La settimana è tutta da scrivere.' : weekTotal === 1 ? 'Un bel primo passo!' : 'Piccoli progressi, grande differenza.';

  habits.forEach((habit, habitIndex) => {
    const row = document.createElement('article');
    row.className = 'habit-row';
    const icon = icons[habitIndex % icons.length];
    const color = palette[habitIndex % palette.length];
    const cells = Array.from({ length: 7 }, (_, i) => {
      const date = dateForWeekday(i);
      const key = localDateKey(date);
      const checked = Boolean(habit.completed?.[key]);
      const isToday = key === todayKey;
      return `<button class="day-cell${checked ? ' checked' : ''}${isToday ? ' is-today' : ''}" type="button" data-habit="${habit.id}" data-date="${key}" aria-label="${checked ? 'Annulla' : 'Segna'} ${habit.name}, ${date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}" aria-pressed="${checked}">${checked ? '<span aria-hidden="true">✓</span>' : ''}</button>`;
    }).join('');
    const streakValue = currentStreak(habit);
    row.innerHTML = `<div class="habit-info"><span class="habit-icon ${color}" aria-hidden="true">${icon}</span><span class="habit-name" title="${escapeHTML(habit.name)}">${escapeHTML(habit.name)}</span><button class="delete-button" type="button" data-delete="${habit.id}" aria-label="Rimuovi ${escapeHTML(habit.name)}" title="Rimuovi abitudine">×</button></div><div class="day-cells">${cells}</div><div class="streak-value">${streakValue ? `<span aria-hidden="true">🔥</span> ${streakValue}` : '<span class="streak-empty">—</span>'}</div>`;
    list.append(row);
  });
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function openForm() {
  $('#habit-form').hidden = false;
  $('#open-form').hidden = true;
  $('#habit-name').focus();
}

function closeForm() {
  $('#habit-form').reset();
  $('#habit-form').hidden = true;
  $('#open-form').hidden = false;
}

$('#today-label').textContent = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toLocaleUpperCase('it-IT');
$('#open-form').addEventListener('click', openForm);
$('#empty-add').addEventListener('click', openForm);
$('#cancel-form').addEventListener('click', closeForm);

$('#habit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#habit-name').value.trim();
  if (!name) return;
  habits.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, name, completed: {} });
  save();
  closeForm();
  render();
  showToast('Nuova abitudine aggiunta ✨');
});

$('#habit-list').addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-habit]');
  if (toggle) {
    const habit = habits.find((item) => item.id === toggle.dataset.habit);
    if (!habit) return;
    habit.completed ||= {};
    const dateKey = toggle.dataset.date;
    if (habit.completed[dateKey]) delete habit.completed[dateKey];
    else habit.completed[dateKey] = true;
    save();
    render();
    return;
  }
  const remove = event.target.closest('[data-delete]');
  if (remove) {
    habits = habits.filter((habit) => habit.id !== remove.dataset.delete);
    save();
    render();
    showToast('Abitudine rimossa.');
  }
});

render();
