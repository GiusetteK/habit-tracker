# Habit Tracker

A small web app for tracking daily habits. It runs directly in the browser and stores data in `localStorage`, so there is no account, backend, or dependency setup required.

## Run it

Open `index.html` in your browser. Alternatively, start a local static server from the project folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Features

- Add and remove habits.
- Mark completed days for each habit.
- Track streaks and weekly progress.
- Keep data saved on the device in `localStorage`.
- Responsive layout for desktop and mobile.

## Stack

HTML, CSS, and vanilla JavaScript.

## Data

Your progress stays in the browser and is not sent to any server. If you clear your browser data, the saved habits will also be removed.
