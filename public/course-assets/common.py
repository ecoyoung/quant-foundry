from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "outputs"
SEED = 20260812


def load_daily() -> pd.DataFrame:
    frame = pd.read_csv(DATA_DIR / "daily_ohlcv.csv", parse_dates=["date"])
    return frame.sort_values(["date", "asset"]).reset_index(drop=True)


def load_minute() -> pd.DataFrame:
    frame = pd.read_csv(DATA_DIR / "minute_ohlcv.csv", parse_dates=["timestamp"])
    return frame.sort_values("timestamp").reset_index(drop=True)


def load_factors() -> pd.DataFrame:
    frame = pd.read_csv(DATA_DIR / "factor_panel.csv", parse_dates=["date"])
    return frame.sort_values(["date", "asset"]).reset_index(drop=True)


def load_orders() -> pd.DataFrame:
    frame = pd.read_csv(DATA_DIR / "orders.csv", parse_dates=["timestamp"])
    return frame.sort_values("timestamp").reset_index(drop=True)


def close_matrix(adjusted: bool = True) -> pd.DataFrame:
    field = "adjusted_close" if adjusted else "close"
    return load_daily().pivot(index="date", columns="asset", values=field).sort_index()


def return_matrix() -> pd.DataFrame:
    return close_matrix().pct_change().dropna(how="all")


def max_drawdown(returns: pd.Series) -> float:
    wealth = (1.0 + returns.fillna(0.0)).cumprod()
    return float((wealth / wealth.cummax() - 1.0).min())


def annualized_stats(returns: pd.Series) -> dict[str, float]:
    clean = returns.dropna()
    annual_return = float(clean.mean() * 252)
    annual_vol = float(clean.std(ddof=1) * np.sqrt(252))
    return {
        "annual_return": annual_return,
        "annual_volatility": annual_vol,
        "sharpe": annual_return / annual_vol if annual_vol else 0.0,
        "max_drawdown": max_drawdown(clean),
    }


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def jsonable(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [jsonable(item) for item in value]
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return round(float(value), 10)
    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()
    if isinstance(value, np.ndarray):
        return jsonable(value.tolist())
    if pd.isna(value):
        return None
    if isinstance(value, float):
        return round(value, 10)
    return value


def write_output(case_id: str, result: dict[str, Any]) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"{case_id}.json"
    path.write_text(json.dumps(jsonable(result), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path

