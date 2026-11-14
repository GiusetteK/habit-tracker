# Streaks

Streaks is a simple habit tracker focused on consistency. It runs entirely in the browser and stores progress in `localStorage`, so there is no backend or account setup required.

## Run it

Open `index.html` in a browser, or start a local static server:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Features

- Add and remove habits.
- Mark daily completions.
- Track streaks and weekly progress.
- Switch between light and dark mode.
- Filter habits by status.
- Save your data locally in the browser.

## Stack

HTML, CSS, and vanilla JavaScript.

## Data

Progress stays on the device only. If you clear the browser storage, the saved habits are removed.
