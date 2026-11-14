const STORAGE_KEY = 'streaks-habits-v1';
const THEME_KEY = 'streaks-theme';
const FILTER_KEY = 'streaks-filter';
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

function readTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function readFilter() {
  return localStorage.getItem(FILTER_KEY) || 'all';
}

let habits = readHabits();
let currentFilter = readFilter();
let toastTimer;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function saveTheme() {
  localStorage.setItem(THEME_KEY, document.body.dataset.theme || 'light');
}

function saveFilter() {
  localStorage.setItem(FILTER_KEY, currentFilter);
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

function isHabitDoneToday(habit) {
  const todayKey = localDateKey(new Date());
  return Boolean(habit.completed?.[todayKey]);
}

function getVisibleHabits() {
  if (currentFilter === 'active') return habits.filter((habit) => !isHabitDoneToday(habit));
  if (currentFilter === 'done') return habits.filter((habit) => isHabitDoneToday(habit));
  return habits;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2300);
}

function renderThemeToggle() {
  const toggle = $('#theme-toggle');
  const isDark = document.body.dataset.theme === 'dark';
  toggle.textContent = isDark ? 'Light' : 'Dark';
  toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

function renderFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });
}

function renderWeekHeader() {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayKey = localDateKey(new Date());
  $('#week-header').innerHTML = `<span class="week-spacer">HABIT</span>${names.map((name, i) => {
    const date = dateForWeekday(i);
    const isToday = localDateKey(date) === todayKey;
    return `<span class="day-heading${isToday ? ' is-today' : ''}"><span>${name}</span><b>${date.getDate()}</b></span>`;
  }).join('')}<span class="streak-heading">STREAK</span>`;
}

function render() {
  renderThemeToggle();
  renderFilterButtons();
  renderWeekHeader();

  const visibleHabits = getVisibleHabits();
  const list = $('#habit-list');
  const empty = visibleHabits.length === 0;
  list.innerHTML = '';
  $('#empty-state').hidden = !empty;
  list.hidden = empty;
  $('#habit-count').textContent = visibleHabits.length;

  const todayKey = localDateKey(new Date());
  const completedToday = habits.filter((habit) => habit.completed?.[todayKey]).length;
  const percent = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;
  $('#today-count').textContent = completedToday;
  $('#today-total').textContent = `/ ${habits.length} ${habits.length === 1 ? 'completed' : 'completed'}`;
  $('#today-progress').style.width = `${percent}%`;
  $('#today-message').textContent = habits.length === 0 ? 'Every beginning counts.' : percent === 100 ? 'Amazing, you did it all! ✨' : percent > 0 ? 'Nice work, keep going.' : 'One step at a time.';

  const streak = habits.reduce((best, habit) => Math.max(best, currentStreak(habit)), 0);
  $('#best-streak').textContent = streak;
  const weekTotal = habits.reduce((sum, habit) => sum + Array.from({ length: 7 }, (_, i) => habit.completed?.[localDateKey(dateForWeekday(i))] ? 1 : 0).reduce((a, b) => a + b, 0), 0);
  $('#week-count').textContent = weekTotal;
  $('#week-caption').textContent = weekTotal === 0 ? 'The week is waiting for you.' : weekTotal === 1 ? 'A great first step!' : 'Small steps, big progress.';

  visibleHabits.forEach((habit, habitIndex) => {
    const row = document.createElement('article');
    row.className = 'habit-row';
    const icon = icons[habitIndex % icons.length];
    const color = palette[habitIndex % palette.length];
    const cells = Array.from({ length: 7 }, (_, i) => {
      const date = dateForWeekday(i);
      const key = localDateKey(date);
      const checked = Boolean(habit.completed?.[key]);
      const isToday = key === todayKey;
      return `<button class="day-cell${checked ? ' checked' : ''}${isToday ? ' is-today' : ''}" type="button" data-habit="${habit.id}" data-date="${key}" aria-label="${checked ? 'Undo' : 'Mark'} ${habit.name}, ${date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}" aria-pressed="${checked}">${checked ? '<span aria-hidden="true">✓</span>' : ''}</button>`;
    }).join('');
    const streakValue = currentStreak(habit);
    row.innerHTML = `<div class="habit-info"><span class="habit-icon ${color}" aria-hidden="true">${icon}</span><span class="habit-name" title="${escapeHTML(habit.name)}">${escapeHTML(habit.name)}</span><button class="delete-button" type="button" data-delete="${habit.id}" aria-label="Remove ${escapeHTML(habit.name)}" title="Remove habit">×</button></div><div class="day-cells">${cells}</div><div class="streak-value">${streakValue ? `<span aria-hidden="true">🔥</span> ${streakValue}` : '<span class="streak-empty">—</span>'}</div>`;
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

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  saveTheme();
  renderThemeToggle();
}

$('#today-label').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase();
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
  showToast('New habit added ✨');
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
    showToast('Habit removed.');
  }
});

$('.filter-btn').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    saveFilter();
    render();
  });
});

$('#theme-toggle').addEventListener('click', () => {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
});

const initialTheme = readTheme();
applyTheme(initialTheme);
currentFilter = readFilter();
render();
