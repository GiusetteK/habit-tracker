const STORAGE_KEY = 'streaks-habits-v1';
const THEME_KEY = 'streaks-theme';
const FILTER_KEY = 'streaks-filter';
const palette = ['mint', 'lilac', 'peach', 'blue', 'yellow', 'pink'];
const icons = ['✳', '◉', '⌁', '✿', '☼', '◇', '↗', '♡'];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function readHabits() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((h) => h && typeof h.id === 'string' && typeof h.name === 'string') : [];
  } catch { return []; }
}
function storageGet(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { showToast('Could not save changes in this browser.'); }
}
let habits = readHabits();
let currentFilter = storageGet(FILTER_KEY, 'all');
let currentView = 'habits';
let activityYear = new Date().getFullYear();
let toastTimer;
function save() { storageSet(STORAGE_KEY, JSON.stringify(habits)); }
function dateForWeekday(index) {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  monday.setDate(monday.getDate() + index);
  return monday;
}
function currentStreak(habit) {
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!habit.completed?.[localDateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (habit.completed?.[localDateKey(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}
function isHabitDoneToday(habit) { return Boolean(habit.completed?.[localDateKey(new Date())]); }
function getVisibleHabits() {
  if (currentFilter === 'active') return habits.filter((h) => !isHabitDoneToday(h));
  if (currentFilter === 'done') return habits.filter(isHabitDoneToday);
  return habits;
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2300);
}
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const toggle = $('#theme-toggle');
  const dark = theme === 'dark';
  toggle.textContent = dark ? 'Light' : 'Dark';
  toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#121814' : '#f7f7f2';
  storageSet(THEME_KEY, theme);
}
function renderWeekHeader() {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayKey = localDateKey(new Date());
  $('#week-header').innerHTML = `<span class="week-spacer">HABIT</span>${names.map((name, i) => {
    const date = dateForWeekday(i);
    return `<span class="day-heading${localDateKey(date) === todayKey ? ' is-today' : ''}"><span>${name}</span><b>${date.getDate()}</b></span>`;
  }).join('')}<span class="streak-heading">STREAK</span>`;
}
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function renderHabits() {
  renderWeekHeader();
  const visible = getVisibleHabits();
  const list = $('#habit-list');
  list.innerHTML = '';
  $('#empty-state').hidden = visible.length !== 0;
  list.hidden = visible.length === 0;
  $('#habit-count').textContent = visible.length;
  $$('.filter-btn').forEach((button) => button.classList.toggle('active', button.dataset.filter === currentFilter));
  const todayKey = localDateKey(new Date());
  const completedToday = habits.filter((h) => h.completed?.[todayKey]).length;
  const percent = habits.length ? Math.round(completedToday / habits.length * 100) : 0;
  $('#today-count').textContent = completedToday;
  $('#today-total').textContent = `/ ${habits.length} completed`;
  $('#today-progress').style.width = `${percent}%`;
  $('#today-message').textContent = !habits.length ? 'Every beginning counts.' : percent === 100 ? 'Amazing, you did it all! ✨' : percent ? 'Nice work, keep going.' : 'One step at a time.';
  $('#best-streak').textContent = habits.reduce((best, habit) => Math.max(best, currentStreak(habit)), 0);
  const weekTotal = habits.reduce((sum, habit) => sum + Array.from({ length: 7 }, (_, i) => habit.completed?.[localDateKey(dateForWeekday(i))] ? 1 : 0).reduce((a, b) => a + b, 0), 0);
  $('#week-count').textContent = weekTotal;
  $('#week-caption').textContent = weekTotal === 0 ? 'The week is waiting for you.' : weekTotal === 1 ? 'A great first step!' : 'Small steps, big progress.';

  visible.forEach((habit, habitIndex) => {
    const row = document.createElement('article');
    row.className = 'habit-row';
    const cells = Array.from({ length: 7 }, (_, i) => {
      const date = dateForWeekday(i);
      const key = localDateKey(date);
      const checked = Boolean(habit.completed?.[key]);
      const future = key > todayKey;
      const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
      return `<button class="day-cell${checked ? ' checked' : ''}${key === todayKey ? ' is-today' : ''}${future ? ' future' : ''}" type="button" data-habit="${escapeHTML(habit.id)}" data-date="${key}" aria-label="${future ? 'Not available yet: ' : checked ? 'Undo ' : 'Mark '}${escapeHTML(habit.name)}, ${dateLabel}" aria-pressed="${checked}"${future ? ' disabled title="This day has not happened yet"' : ''}>${checked ? '<span aria-hidden="true">✓</span>' : ''}</button>`;
    }).join('');
    row.innerHTML = `<div class="habit-info"><span class="habit-icon ${palette[habitIndex % palette.length]}" aria-hidden="true">${icons[habitIndex % icons.length]}</span><span class="habit-name" title="${escapeHTML(habit.name)}">${escapeHTML(habit.name)}</span><button class="delete-button" type="button" data-delete="${escapeHTML(habit.id)}" aria-label="Remove ${escapeHTML(habit.name)}" title="Remove habit">×</button></div><div class="day-cells">${cells}</div><div class="streak-value">${currentStreak(habit) ? `<span aria-hidden="true">🔥</span> ${currentStreak(habit)}` : '<span class="streak-empty">—</span>'}</div>`;
    list.append(row);
  });
}
function renderActivity() {
  const year = activityYear;
  $('#activity-year').textContent = year;
  $('#next-year').disabled = year >= new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const firstMonday = new Date(start);
  firstMonday.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const weeks = [];
  for (let cursor = new Date(firstMonday); cursor <= end; cursor.setDate(cursor.getDate() + 7)) weeks.push(new Date(cursor));
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const monthLabels = [];
  let lastMonth = -1;
  const days = [];
  let completionTotal = 0;
  const active = new Set();
  weeks.forEach((week, weekIndex) => {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(week);
      date.setDate(week.getDate() + day);
      const inYear = date.getFullYear() === year;
      if (inYear && date.getMonth() !== lastMonth) {
        monthLabels.push({ name: date.toLocaleDateString('en-US', { month: 'short' }), week: weekIndex });
        lastMonth = date.getMonth();
      }
      let count = 0;
      if (inYear) {
        const key = localDateKey(date);
        count = habits.reduce((sum, habit) => sum + (habit.completed?.[key] ? 1 : 0), 0);
        if (count) { active.add(key); completionTotal += count; }
      }
      const level = !count ? 0 : count >= Math.max(1, habits.length * 0.75) ? 4 : count >= Math.max(1, habits.length * 0.5) ? 3 : count >= Math.max(1, habits.length * 0.25) ? 2 : 1;
      const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const text = inYear ? `${count} habit${count === 1 ? '' : 's'} completed` : 'Outside this year';
      weekDays.push(`<span class="heat-day level-${level}${inYear ? '' : ' outside-year'}" title="${label}: ${text}" aria-label="${label}: ${text}"></span>`);
    }
    days.push(`<div class="heat-week">${weekDays.join('')}</div>`);
  });
  $('#month-labels').innerHTML = `<span class="weekday-spacer"></span>${monthLabels.map((m) => `<span class="month-label" style="grid-column:${m.week + 1}">${m.name}</span>`).join('')}`;
  $('#heatmap').innerHTML = `<div class="weekday-labels"><span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span></div>${days.join('')}`;
  $('#year-completions').textContent = completionTotal;
  $('#active-days').textContent = active.size;
  $('#tracked-habits').textContent = habits.length;
}
function renderView() {
  const activity = currentView === 'activity';
  $('#habits-view').hidden = activity;
  $('#activity-view').hidden = !activity;
  $('.filter-switch').hidden = activity;
  $$('.view-btn').forEach((button) => button.classList.toggle('active', button.dataset.view === currentView));
  if (activity) renderActivity();
}
function render() { renderHabits(); renderView(); }
function openForm() { $('#habit-form').hidden = false; $('#open-form').hidden = true; $('#habit-name').focus(); }
function closeForm() { $('#habit-form').reset(); $('#habit-form').hidden = true; $('#open-form').hidden = false; }

$('#today-label').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase();
$('#open-form').addEventListener('click', openForm);
$('#empty-add').addEventListener('click', openForm);
$('#cancel-form').addEventListener('click', closeForm);
$('#habit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#habit-name').value.trim();
  if (!name) return;
  habits.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, name, completed: {} });
  save(); closeForm(); render(); showToast('New habit added ✨');
});
$('#habit-list').addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-habit]');
  if (toggle && !toggle.disabled) {
    const habit = habits.find((item) => item.id === toggle.dataset.habit);
    if (!habit) return;
    habit.completed ||= {};
    if (habit.completed[toggle.dataset.date]) delete habit.completed[toggle.dataset.date];
    else habit.completed[toggle.dataset.date] = true;
    save(); render(); return;
  }
  const remove = event.target.closest('[data-delete]');
  if (remove) { habits = habits.filter((habit) => habit.id !== remove.dataset.delete); save(); render(); showToast('Habit removed.'); }
});
$$('.filter-btn').forEach((button) => button.addEventListener('click', () => { currentFilter = button.dataset.filter; storageSet(FILTER_KEY, currentFilter); render(); }));
$$('.view-btn').forEach((button) => button.addEventListener('click', () => { currentView = button.dataset.view; renderView(); }));
$('#theme-toggle').addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
$('#previous-year').addEventListener('click', () => { activityYear--; renderActivity(); });
$('#next-year').addEventListener('click', () => { if (activityYear < new Date().getFullYear()) activityYear++; renderActivity(); });
applyTheme(storageGet(THEME_KEY, 'light') === 'dark' ? 'dark' : 'light');
render();
