# Pipe Weight Calculator (Python / Flask)

Same "Pipe Weight Calculator" tool as the Shreeji SteelTubes chatbot, but as its
own small **Python web app**. All the weight math runs on the **server in
Python** (`app.py` → `calc_weight()`); the browser just sends your numbers and
shows back the result.

## Formulas used
```
Round Pipe    : (OD - Thickness) x Thickness x 0.0246615  = Kg/Metre
                Weight/Pipe = Kg/Metre x 6.00   (standard 6 m pipe length)

Hollow Section: Equivalent OD = (Side A + Side B) x 0.6363
                (Equivalent OD - Thickness) x Thickness x 0.0246615 = Kg/Metre
                Weight/Pipe = Kg/Metre x 6.00
```

## Setup (step by step)

1. **Install Python 3.9+** if you don't already have it: https://www.python.org/downloads/
   (On Windows, during install, tick "Add Python to PATH".)

2. **Open a terminal / Command Prompt in this folder**
   (the one containing `app.py`).

3. **Create a virtual environment** (keeps this app's packages separate from everything else):
   ```
   python -m venv venv
   ```

4. **Activate it:**
   - Windows (cmd):   `venv\Scripts\activate`
   - Windows (PowerShell): `venv\Scripts\Activate.ps1`
   - Mac / Linux:     `source venv/bin/activate`

   You should now see `(venv)` at the start of your terminal line.

5. **Install the one dependency (Flask):**
   ```
   pip install -r requirements.txt
   ```

6. **Run the app:**
   ```
   python app.py
   ```
   Terminal should show something like:
   `Running on http://0.0.0.0:5000`

7. **Open it:**
   - On the same PC: http://127.0.0.1:5000
   - On your phone / another device (same Wi-Fi as the PC): find your PC's
     LAN IP (Windows: run `ipconfig`, look at "IPv4 Address") and open
     `http://<that-IP>:5000` — e.g. `http://192.168.0.163:5000`
     (If it doesn't open on the phone, same checklist as before applies:
     same Wi-Fi, correct/current IP, and your PC firewall/antivirus must
     allow port 5000.)

## Deploy for free, permanently (Render.com)

Render has a free "Web Service" plan — no credit card needed, gives you a
real public HTTPS link like `https://pipe-weight-calculator.onrender.com`
that works on any phone/PC, anywhere, not just your Wi-Fi.
**One catch:** on the free plan, if nobody opens the app for 15 minutes it
goes to sleep; the next person to open it waits ~30-60 seconds for it to
wake up. After that it runs normally. This never costs money and never
expires — it's not a trial.

This project already includes everything Render needs (`Procfile`,
`render.yaml`, `gunicorn` in requirements.txt). Steps:

### 1. Put this code on GitHub
1. Go to https://github.com → **New repository** (e.g. name it `pipe-weight-calculator`) → Create.
2. On your PC, inside this `pipe_weight_calculator_python` folder, run:
   ```
   git init
   git add .
   git commit -m "Pipe weight calculator"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/pipe-weight-calculator.git
   git push -u origin main
   ```
   (Replace `YOUR-USERNAME` with your GitHub username. If `git` isn't
   installed, get it from https://git-scm.com/downloads , or upload the
   folder's files through GitHub's website "Add file → Upload files" instead.)

### 2. Create a free Render account
Go to https://render.com → **Get Started** → sign up (you can use your
GitHub account to sign up, which also makes step 3 faster) — no card needed.

### 3. Create the Web Service
1. Render dashboard → **New +** → **Web Service**.
2. Connect your GitHub account if asked, then pick the `pipe-weight-calculator`
   repo you just pushed.
3. Render reads `render.yaml` automatically and should already show:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Plan:** Free
   If it doesn't auto-fill, type those in yourself and choose the **Free** plan.
4. Click **Create Web Service** / **Deploy**.

### 4. Wait and open your link
First deploy takes 2-5 minutes (watch the build log on screen). When it
says "Live", your app is at the `.onrender.com` URL shown at the top of
the page — open that on your phone, share it with anyone, it just works.

### Updating later
Any time you want to change the app: edit the files, then
```
git add .
git commit -m "update"
git push
```
Render redeploys automatically within a minute or two.

## Mobile / responsive
The page is a **full responsive web app**, not just a small widget:
- On a **phone**, it fills the whole screen (full-bleed, like a native app),
  with a sticky header and safe-area padding (works fine on notched phones).
- On a **tablet / desktop**, it shows as a centred app panel with rounded
  corners, so it doesn't look like a tiny stretched box on a big screen.
- You can also **"Add to Home Screen"** from your phone's browser menu — the
  page includes a web manifest (`static/manifest.webmanifest`) so it opens
  full-screen like an installed app (no browser address bar).

## Project structure
```
pipe_weight_calculator_python/
├── app.py                 <- Flask server + all the weight calculation logic
├── requirements.txt       <- just Flask
├── templates/
│   └── index.html         <- the page markup
└── static/
    ├── style.css           <- dark-theme styling (matches the chatbot's calculator)
    └── script.js           <- sends your inputs to the server and shows the result
```

## Customizing
- **Default pipe length** (used for "Weight / Pipe", currently 6.00 m):
  edit `DEFAULT_LENGTH_M` near the top of `app.py`.
- **Colours / branding:** edit the CSS variables at the top of `static/style.css`.
- **Company name shown under the title:** edit the text in `templates/index.html`.
- **Run on a different port:** `PORT=8080 python app.py` (Linux/Mac) or
  `set PORT=8080 && python app.py` (Windows cmd).

## API (if you want to use the calculator from other code)
`POST /api/calculate` with JSON body:
```json
{ "mode": "round", "od": "60", "t": "3.2" }
```
or for a hollow section:
```json
{ "mode": "hollow", "a": "40", "b": "20", "t": "3" }
```
Returns:
```json
{
  "ok": true,
  "message": "",
  "equivalent_od": null,
  "kg_per_metre": 4.333,
  "weight_per_pipe": 26.0,
  "length_m": 6.0
}
```
