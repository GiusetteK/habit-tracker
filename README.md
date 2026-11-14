# Streaks 🔥

A lightweight habit tracker focused on consistency. Streaks runs in your browser and saves habits and progress locally with `localStorage`—no account or backend required.

## Try it online

[Open Streaks on GitHub Pages](https://giusettek.github.io/habit-tracker/)

## Run locally

Open `index.html` in a browser, or start a static server from the project directory:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Features

- Create and remove habits.
- Track completions through today; future dates cannot be checked off.
- View current streaks and weekly progress.
- Browse the yearly activity heatmap and cumulative completion chart.
- Switch between light and dark themes.
- Filter habits by all, active, or done.
- Responsive layout for desktop and mobile.

## Built with

HTML, CSS, and vanilla JavaScript. No build step or dependencies required.

## Your data

Habit data, theme, and filter preferences are stored in this browser only. They are not synced between devices or sent to a server. Clearing this site's browser storage removes saved progress.
