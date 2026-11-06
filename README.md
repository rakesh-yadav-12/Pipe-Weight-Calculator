# Pipe Weight Calculator

A small Flask web app for **Shreeji SteelTubes Pvt. Ltd.** that calculates pipe
rate and weight for **Round Pipes** and **Hollow Sections**. All calculations
run on the server in Python (`app.py` -> `calc_weight()`); the browser only
sends the numbers and shows the result.

## Features
- Round Pipe and Hollow Section modes
- **Rate view:** enter Rate per Kg, get Rate / MTR and Rate / Foot
- **Weight view:** get Kg / MTR and Weight / Pipe (6 m)
- Results update live while typing
- Responsive, mobile-friendly UI with an animated background
- Ready to deploy on Render (`render.yaml`, `Procfile`, `gunicorn`)

## Formulas
```
Round Pipe     : (OD - Thickness) x Thickness x 0.0246615 = Kg/Metre
Hollow Section : Equivalent OD = (Side A + Side B) x 0.6363
                 (Equivalent OD - Thickness) x Thickness x 0.0246615 = Kg/Metre
Weight / Pipe  : Kg/Metre x 6.00 (standard 6 m length)
Rate / Metre   : Kg/Metre x Rate per Kg
Rate / Foot    : Rate / Metre / 3.281
```

## Run locally
Requires Python 3.9+.
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000 (on the same Wi-Fi, other devices can use `http://<your-PC-IP>:5000`).

## Deploy on Render
1. Push this repo to GitHub (files at the repo root).
2. In Render choose **New + -> Blueprint** and select the repo (reads `render.yaml`),
   or **New + -> Web Service** with:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Health Check Path: `/healthz`
3. Every `git push` to the connected branch redeploys automatically.

Free instances sleep when idle, so the first request after a while can take ~30 s.

## Project structure
```
.
├── app.py             Flask server + calculation logic
├── requirements.txt   Flask, gunicorn
├── render.yaml        Render blueprint
├── Procfile           start command (gunicorn)
├── templates/
│   └── index.html     page markup
└── static/
    ├── style.css      styling and animated background
    └── script.js      reads inputs, calls the API, shows results
```

## API
`POST /api/calculate` (JSON). `view` is `"rate"` (default) or `"weight"`; `mode` is `"round"` or `"hollow"`.

Rate view:
```json
{ "mode": "round", "view": "rate", "od": "60", "t": "3.2", "rate": "85" }
```
returns
```json
{ "ok": true, "message": "", "view": "rate", "rate_ok": true,
  "rate_per_kg": 85.0, "rate_per_metre": 381.01, "rate_per_foot": 116.13 }
```
Weight view:
```json
{ "mode": "hollow", "view": "weight", "a": "40", "b": "20", "t": "3" }
```
returns `kg_per_metre`, `weight_per_pipe`, `length_m` and `equivalent_od`.

`GET /healthz` returns `{"ok": true}` for health checks.

## Customizing
- Pipe length: `DEFAULT_LENGTH_M` in `app.py`
- Colours: CSS variables at the top of `static/style.css`
- Title / company name: `templates/index.html`
