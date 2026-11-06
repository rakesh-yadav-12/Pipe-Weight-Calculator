"""
Pipe Weight Calculator - standalone Flask app
-----------------------------------------------
Run:  python app.py
Then open:  http://127.0.0.1:5000        (on this PC)
        or  http://<YOUR-PC-LAN-IP>:5000 (on a phone / another device, same Wi-Fi)

All the weight math happens here in Python (see calc_weight below).
The web page just sends the numbers you type and shows back what this
function returns - nothing is calculated in JavaScript.
"""
import os
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ---- constants used by Shreeji SteelTubes' pipe-weight formula ----
K = 0.0246615   # weight constant (mild steel)
EQ = 0.6363     # converts (SideA + SideB) of a hollow section into an equivalent OD
DEFAULT_LENGTH_M = 6.0   # standard pipe length used for "Weight / Pipe"


def to_float(v):
    """Safely turn whatever the browser sent into a positive float, else 0."""
    try:
        n = float(str(v).replace(",", "."))
        return n if n > 0 else 0.0
    except (TypeError, ValueError):
        return 0.0


def calc_weight(mode, od, a, b, t, length=DEFAULT_LENGTH_M):
    """
    mode: 'round' or 'hollow'
    od, a, b, t, length: numbers in mm (length in metres)
    Returns a dict with ok / message / the equivalent OD (hollow only) / kg-per-metre / weight-per-pipe
    """
    ok = False
    msg = ""
    eq_od = 0.0

    if mode == "round":
        eq_od = od
        started = bool(od or t)
        if od and t:
            if t * 2 >= od:
                msg = "Thickness must be less than half of the OD"
            else:
                ok = True
        else:
            msg = "Enter both OD and thickness" if started else "Enter OD and thickness - the weight appears instantly"
    else:  # hollow section
        eq_od = (a + b) * EQ
        started = bool(a or b or t)
        if a and b and t:
            if t * 2 >= eq_od:
                msg = "Thickness is too large for this section"
            else:
                ok = True
        else:
            msg = "Enter both sides and thickness" if started else "Enter both sides and thickness - the weight appears instantly"

    kg_per_m = (eq_od - t) * t * K if ok else 0.0
    weight_per_pipe = kg_per_m * length

    return {
        "ok": ok,
        "message": msg,
        "equivalent_od": round(eq_od, 2) if mode == "hollow" else None,
        "kg_per_metre": round(kg_per_m, 3),
        "weight_per_pipe": round(weight_per_pipe, 2),
        "length_m": length,
    }


@app.get("/")
def index():
    return render_template("index.html", default_length=DEFAULT_LENGTH_M)


@app.post("/api/calculate")
def api_calculate():
    data = request.get_json(silent=True) or {}
    mode = "hollow" if data.get("mode") == "hollow" else "round"
    od = to_float(data.get("od"))
    a = to_float(data.get("a"))
    b = to_float(data.get("b"))
    t = to_float(data.get("t"))
    length = to_float(data.get("length")) or DEFAULT_LENGTH_M

    result = calc_weight(mode, od, a, b, t, length)
    return jsonify(result)


@app.get("/healthz")
def healthz():
    return jsonify(ok=True)


if __name__ == "__main__":
    # host="0.0.0.0" so phones on the same Wi-Fi can open it via your PC's LAN IP
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG", "0") == "1")
