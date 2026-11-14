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
    return Array.isArray(saved) ? saved.filter((habit) => habit && typeof habit.id === 'string' && typeof habit.name === 'string') : [];
  } catch {
    return [];
  }
}

function storageGet(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    showToast('Could not save changes in this browser.');
  }
}

let habits = readHabits();
let currentFilter = storageGet(FILTER_KEY, 'all');
let currentView = 'habits';
let activityYear = new Date().getFullYear();
let toastTimer;

function save() {
  storageSet(STORAGE_KEY, JSON.stringify(habits));
}

function getWeekDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  }).filter((date) => date <= today);
}

function currentStreak(habit) {
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!habit.completed?.[localDateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (habit.completed?.[localDateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function isHabitDoneToday(habit) {
  return Boolean(habit.completed?.[localDateKey(new Date())]);
}

function getVisibleHabits() {
  if (currentFilter === 'active') return habits.filter((habit) => !isHabitDoneToday(habit));
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
  const isDark = theme === 'dark';
  toggle.textContent = isDark ? 'Light' : 'Dark';
  toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#121814' : '#f7f7f2';
  storageSet(THEME_KEY, theme);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function renderWeekHeader() {
  const weekDates = getWeekDates();
  const todayKey = localDateKey(new Date());
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  $('#week-header').innerHTML = `<span class="week-spacer">HABIT</span>${weekDates.map((date) => {
    const label = names[(date.getDay() + 6) % 7];
    const isToday = localDateKey(date) === todayKey;
    return `<span class="day-heading${isToday ? ' is-today' : ''}"><span>${label}</span><b>${date.getDate()}</b></span>`;
  }).join('')}<span class="streak-heading">STREAK</span>`;
}

function renderHabits() {
  renderWeekHeader();
  const visible = getVisibleHabits();
  const list = $('#habit-list');
  list.innerHTML = '';
  $('#empty-state').hidden = visible.length !== 0;
  list.hidden = visible.length === 0;
  $('#habit-count').textContent = visible.length;

  $$('.filter-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });

  const todayKey = localDateKey(new Date());
  const weekDates = getWeekDates();
  const completedToday = habits.filter((habit) => habit.completed?.[todayKey]).length;
  const percent = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;

  $('#today-count').textContent = completedToday;
  $('#today-total').textContent = `/ ${habits.length} completed`;
  $('#today-progress').style.width = `${percent}%`;
  $('#today-message').textContent = !habits.length
    ? 'Every beginning counts.'
    : percent === 100
      ? 'Amazing, you did it all! ✨'
      : percent > 0
        ? 'Nice work, keep going.'
        : 'One step at a time.';

  $('#best-streak').textContent = habits.reduce((best, habit) => Math.max(best, currentStreak(habit)), 0);

  const weekTotal = habits.reduce((sum, habit) => {
    return sum + weekDates.reduce((count, date) => count + (habit.completed?.[localDateKey(date)] ? 1 : 0), 0);
  }, 0);

  $('#week-count').textContent = weekTotal;
  $('#week-caption').textContent = weekTotal === 0
    ? 'The week is waiting for you.'
    : weekTotal === 1
      ? 'A great first step!'
      : 'Small steps, big progress.';

  visible.forEach((habit, index) => {
    const row = document.createElement('article');
    row.className = 'habit-row';

    const cells = weekDates.map((date) => {
      const key = localDateKey(date);
      const checked = Boolean(habit.completed?.[key]);
      const isToday = key === todayKey;
      const label = date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
      return `<button class="day-cell${checked ? ' checked' : ''}${isToday ? ' is-today' : ''}" type="button" data-habit="${escapeHTML(habit.id)}" data-date="${key}" aria-label="${checked ? 'Undo ' : 'Mark '}${escapeHTML(habit.name)}, ${label}" aria-pressed="${checked}">${checked ? '<span aria-hidden="true">✓</span>' : ''}</button>`;
    }).join('');

    const streak = currentStreak(habit);
    row.innerHTML = `
      <div class="habit-info">
        <span class="habit-icon ${palette[index % palette.length]}" aria-hidden="true">${icons[index % icons.length]}</span>
        <span class="habit-name" title="${escapeHTML(habit.name)}">${escapeHTML(habit.name)}</span>
        <button class="delete-button" type="button" data-delete="${escapeHTML(habit.id)}" aria-label="Remove ${escapeHTML(habit.name)}" title="Remove habit">×</button>
      </div>
      <div class="day-cells">${cells}</div>
      <div class="streak-value">${streak ? `<span aria-hidden="true">🔥</span> ${streak}` : '<span class="streak-empty">—</span>'}</div>
    `;

    list.appendChild(row);
  });
}

function getMonthlyContributionCounts(year) {
  const monthly = new Array(12).fill(0);
  habits.forEach((habit) => {
    Object.entries(habit.completed || {}).forEach(([dateKey, isDone]) => {
      if (!isDone) return;
      const [yearValue, monthValue] = dateKey.split('-').map(Number);
      if (yearValue === year) {
        monthly[monthValue - 1] += 1;
      }
    });
  });
  return monthly;
}

function renderProgressChart() {
  const monthlyCounts = getMonthlyContributionCounts(activityYear);
  const cumulative = monthlyCounts.reduce((accumulator, monthValue) => {
    const total = accumulator[accumulator.length - 1] + monthValue;
    accumulator.push(total);
    return accumulator;
  }, [0]);

  const total = cumulative[cumulative.length - 1];
  const maxValue = Math.max(total, 1);
  const width = 960;
  const height = 260;
  const left = 48;
  const right = 18;
  const top = 18;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const points = cumulative.map((value, index) => {
    const x = left + (plotWidth * index) / 11;
    const y = top + plotHeight * (1 - value / maxValue);
    return { x, y, value };
  });

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(top + plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(top + plotHeight).toFixed(1)} Z`;

  const monthNames = Array.from({ length: 12 }, (_, monthIndex) => new Date(activityYear, monthIndex, 1).toLocaleDateString('en-US', { month: 'short' }));

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = top + plotHeight * ratio;
    const value = Math.round(maxValue * (1 - ratio));
    return `<g class="chart-grid"><line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line><text x="${left - 8}" y="${y + 4}" text-anchor="end">${value}</text></g>`;
  }).join('');

  const monthLabels = monthNames.map((month, index) => {
    const x = left + (plotWidth * index) / 11 + plotWidth / 22;
    return `<text class="chart-month" x="${x}" y="${height - 12}" text-anchor="middle">${month}</text>`;
  }).join('');

  const markers = points.slice(1).map((point, index) => {
    const monthIndex = index + 1;
    return `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4"><title>${monthNames[monthIndex - 1]}: ${monthlyCounts[monthIndex - 1]} completions, total ${point.value}</title></circle>`;
  }).join('');

  const svg = `
    <svg class="progress-chart" viewBox="0 0 ${width} ${height}" aria-label="Cumulative habit completion chart for ${activityYear}">
      ${gridLines}
      <path class="chart-area" d="${areaPath}"></path>
      <path class="chart-line" d="${linePath}"></path>
      ${markers}
      ${monthLabels}
    </svg>
  `;

  $('#progress-chart').innerHTML = svg;
  $('#chart-total').textContent = `${total} ${total === 1 ? 'completion' : 'completions'}`;
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
  for (let cursor = new Date(firstMonday); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
    weeks.push(new Date(cursor));
  }

  const monthLabels = [];
  let lastMonth = -1;
  const heatmapWeeks = [];
  let completionTotal = 0;
  const activeDays = new Set();

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
        if (count > 0) {
          completionTotal += count;
          activeDays.add(key);
        }
      }

      const level = !inYear || count === 0 ? 0 : count >= Math.max(1, Math.ceil(habits.length * 0.75)) ? 4 : count >= Math.max(1, Math.ceil(habits.length * 0.5)) ? 3 : count >= Math.max(1, Math.ceil(habits.length * 0.25)) ? 2 : 1;
      const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const text = inYear ? `${count} habit${count === 1 ? '' : 's'} completed` : 'Outside this year';
      weekDays.push(`<span class="heat-day level-${level}${inYear ? '' : ' outside-year'}" title="${label}: ${text}" aria-label="${label}: ${text}"></span>`);
    }
    heatmapWeeks.push(`<div class="heat-week">${weekDays.join('')}</div>`);
  });

  $('#month-labels').innerHTML = `<span class="weekday-spacer"></span>${monthLabels.map((month) => `<span class="month-label" style="grid-column:${month.week + 1}">${month.name}</span>`).join('')}`;
  $('#heatmap').innerHTML = `
    <div class="weekday-labels">
      <span></span>
      <span>Mon</span>
      <span></span>
      <span>Wed</span>
      <span></span>
      <span>Fri</span>
      <span></span>
    </div>
    <div class="heat-weeks">${heatmapWeeks.join('')}</div>
  `;

  $('#year-completions').textContent = completionTotal;
  $('#active-days').textContent = activeDays.size;
  $('#tracked-habits').textContent = habits.length;
  renderProgressChart();
}

function renderView() {
  const isActivity = currentView === 'activity';
  $('#habits-view').hidden = isActivity;
  $('#activity-view').hidden = !isActivity;
  $('.filter-switch').hidden = isActivity;
  $$('.view-btn').forEach((button) => button.classList.toggle('active', button.dataset.view === currentView));

  if (isActivity) {
    renderActivity();
  }
}

function render() {
  renderHabits();
  renderView();
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

$('#today-label').textContent = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
}).format(new Date()).toUpperCase();

$('#open-form').addEventListener('click', openForm);
$('#empty-add').addEventListener('click', openForm);
$('#cancel-form').addEventListener('click', closeForm);

$('#habit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#habit-name').value.trim();
  if (!name) return;

  habits.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    completed: {}
  });

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
    if (habit.completed[toggle.dataset.date]) delete habit.completed[toggle.dataset.date];
    else habit.completed[toggle.dataset.date] = true;

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

$$('.filter-btn').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    storageSet(FILTER_KEY, currentFilter);
    render();
  });
});

$$('.view-btn').forEach((button) => {
  button.addEventListener('click', () => {
    currentView = button.dataset.view;
    renderView();
  });
});

$('#theme-toggle').addEventListener('click', () => {
  applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
});

$('#previous-year').addEventListener('click', () => {
  activityYear -= 1;
  renderActivity();
});

$('#next-year').addEventListener('click', () => {
  if (activityYear < new Date().getFullYear()) {
    activityYear += 1;
    renderActivity();
  }
});

applyTheme(storageGet(THEME_KEY, 'light') === 'dark' ? 'dark' : 'light');
render();
