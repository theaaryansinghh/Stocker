from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, r2_score
import finnhub
import os
import json
from datetime import datetime

app = Flask(__name__)

# ─── CORS — allow requests from Vite dev server ───────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.route("/api/<path:path>", methods=["OPTIONS"])
def options_handler(path):
    return "", 204

# ─── Config ───────────────────────────────────────────────
FINNHUB_API_KEY = "d1ehu79r01qjssrk8570d1ehu79r01qjssrk857g"
DATA_PATH = "all_stocks_5yr.csv"

finnhub_client  = finnhub.Client(api_key=FINNHUB_API_KEY)

# ─── Load & train model on historical data ────────────────
def load_and_train(ticker: str):
    """Load Parquet dataset, filter by ticker, train Neural Network."""
    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.lower().str.strip()

    df = df[df["name"].str.upper() == ticker.upper()].copy()
    if df.empty:
        return None, None, None, None, f"Ticker '{ticker}' not found in dataset."

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    df = df.dropna(subset=["close"])

    df["day_index"] = np.arange(len(df))
    feature_cols = ["day_index", "open", "high", "low", "volume"]
    df = df.dropna(subset=feature_cols)

    X = df[feature_cols].values
    y = df["close"].values

    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # ── Neural Network (MLP) ───────────────────────────────
    model = MLPRegressor(
        hidden_layer_sizes=(128, 64, 32),
        activation="relu",
        solver="adam",
        max_iter=500,
        early_stopping=True,
        validation_fraction=0.1,
        random_state=42,
        verbose=False,
    )
    model.fit(X_scaled, y)

    y_pred = model.predict(X_scaled)
    r2  = round(r2_score(y, y_pred), 4)
    mse = round(mean_squared_error(y, y_pred), 4)

    last_row = df.iloc[-1]
    meta = {
        "ticker":       ticker.upper(),
        "r2":           r2,
        "mse":          mse,
        "data_points":  len(df),
        "date_range":   f"{df['date'].iloc[0].date()} → {df['date'].iloc[-1].date()}",
        "last_close":   round(float(last_row["close"]), 2),
        "last_index":   int(last_row["day_index"]),
        "feature_cols": feature_cols,
        "model_type":   "Neural Network (MLP 128→64→32)",
    }
    return model, scaler, df, meta, None


def predict_next(model, scaler, df, meta, live_price=None):
    """Predict the next closing price given current features."""
    last = df.iloc[-1]
    next_index = meta["last_index"] + 1

    open_est = live_price if live_price else last["close"]
    high_est = open_est * 1.005
    low_est  = open_est * 0.995
    vol_est  = float(last["volume"])

    X_new = np.array([[next_index, open_est, high_est, low_est, vol_est]])
    X_new_scaled = scaler.transform(X_new)
    predicted = float(model.predict(X_new_scaled)[0])
    return round(predicted, 2)


# ─── Routes ───────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/wstoken")
def wstoken():
    return jsonify({"token": FINNHUB_API_KEY})


@app.route("/api/train", methods=["POST"])
def train():
    data   = request.get_json(force=True, silent=True) or {}
    ticker = data.get("ticker", "AAPL").upper()

    model, scaler, df, meta, err = load_and_train(ticker)
    if err:
        return jsonify({"error": err}), 400

    app.config["MODEL"]  = model
    app.config["SCALER"] = scaler
    app.config["DF"]     = df
    app.config["META"]   = meta

    hist = df[["date", "close"]].tail(100).copy()
    hist["date"] = hist["date"].dt.strftime("%Y-%m-%d")

    return jsonify({
        "success": True,
        "meta":    meta,
        "history": hist.to_dict(orient="records"),
    })


@app.route("/api/quote", methods=["GET"])
def quote():
    ticker = request.args.get("ticker", "AAPL").upper()
    try:
        q = finnhub_client.quote(ticker)
        return jsonify({
            "ticker":     ticker,
            "price":      q["c"],
            "change":     round(q["d"], 2),
            "change_pct": round(q["dp"], 2),
            "high":       q["h"],
            "low":        q["l"],
            "open":       q["o"],
            "prev_close": q["pc"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict", methods=["POST"])
def predict():
    model  = app.config.get("MODEL")
    scaler = app.config.get("SCALER")
    df     = app.config.get("DF")
    meta   = app.config.get("META")

    if model is None:
        return jsonify({"error": "Model not trained yet."}), 400

    data       = request.get_json(force=True, silent=True) or {}
    live_price = data.get("live_price")
    ticker     = data.get("ticker", "AAPL").upper()

    predicted = predict_next(model, scaler, df, meta, live_price)
    current   = live_price or meta["last_close"]
    diff      = round(predicted - current, 2)
    diff_pct  = round((diff / current) * 100, 2)

    if diff_pct > 0.3:
        signal = "BUY"
    elif diff_pct < -0.3:
        signal = "SELL"
    else:
        signal = "HOLD"

    return jsonify({
        "ticker":    ticker,
        "current":   round(current, 2),
        "predicted": predicted,
        "diff":      diff,
        "diff_pct":  diff_pct,
        "signal":    signal,
        "r2":        meta["r2"],
        "mse":       meta["mse"],
    })


@app.route("/api/candles", methods=["GET"])
def candles():
    ticker     = request.args.get("ticker", "AAPL").upper()
    resolution = request.args.get("resolution", "D")
    try:
        import time
        now   = int(time.time())
        start = now - 60 * 60 * 24 * 90
        c = finnhub_client.stock_candles(ticker, resolution, start, now)
        if c["s"] != "ok":
            return jsonify({"error": "No candle data"}), 400
        result = [
            {"t": datetime.fromtimestamp(t).strftime("%Y-%m-%d"), "c": c_}
            for t, c_ in zip(c["t"], c["c"])
        ]
        return jsonify({"candles": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)