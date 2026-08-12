from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from common import DATA_DIR, ROOT, SEED, sha256

ASSETS = ["ALFA", "BRAV", "CRUX", "DUNE", "ECHO"]
SECTORS = {"ALFA": "technology", "BRAV": "finance", "CRUX": "industry", "DUNE": "consumer", "ECHO": "health"}


def generate_data() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(SEED)
    dates = pd.bdate_range("2023-01-02", periods=756)
    common = rng.normal(0.00025, 0.008, len(dates))
    rows: list[dict[str, object]] = []
    factor_rows: list[dict[str, object]] = []

    for asset_index, asset in enumerate(ASSETS):
        idio = rng.normal(0.00005 * (asset_index - 2), 0.009 + asset_index * 0.001, len(dates))
        returns = 0.55 * common + 0.45 * idio
        adjusted = (70 + asset_index * 18) * np.cumprod(1 + returns)
        split_factor = np.ones(len(dates))
        if asset == "ALFA":
            split_factor[420:] = 0.5
        raw_close = adjusted * split_factor
        open_ = raw_close * (1 + rng.normal(0, 0.0025, len(dates)))
        high = np.maximum(open_, raw_close) * (1 + rng.uniform(0.0005, 0.012, len(dates)))
        low = np.minimum(open_, raw_close) * (1 - rng.uniform(0.0005, 0.012, len(dates)))
        volume = rng.integers(300_000, 4_000_000, len(dates)) * (1 + asset_index)
        value = np.linspace(0.2, 0.9, len(dates)) + rng.normal(0, 0.12, len(dates))
        quality = 0.6 - value * 0.25 + rng.normal(0, 0.1, len(dates))
        size = np.log(raw_close * volume)

        for i, date in enumerate(dates):
            rows.append({
                "date": date.date().isoformat(), "asset": asset,
                "open": round(float(open_[i]), 6), "high": round(float(high[i]), 6),
                "low": round(float(low[i]), 6), "close": round(float(raw_close[i]), 6),
                "adjusted_close": round(float(adjusted[i]), 6), "volume": int(volume[i]),
                "sector": SECTORS[asset], "historical_member": bool(not (asset == "ECHO" and i < 120)),
            })
            future = float(returns[i + 1]) if i + 1 < len(dates) else np.nan
            factor_rows.append({
                "date": date.date().isoformat(), "asset": asset,
                "value": round(float(value[i]), 6), "quality": round(float(quality[i]), 6),
                "size": round(float(size[i]), 6), "future_return": round(future, 8) if not np.isnan(future) else "",
            })

    daily = pd.DataFrame(rows)
    factors = pd.DataFrame(factor_rows)
    daily.to_csv(DATA_DIR / "daily_ohlcv.csv", index=False)
    factors.to_csv(DATA_DIR / "factor_panel.csv", index=False)

    timestamps = pd.date_range("2026-08-10 09:30", periods=390, freq="min")
    minute_returns = rng.normal(0.000002, 0.0007, len(timestamps))
    minute_close = 125 * np.cumprod(1 + minute_returns)
    minute_open = np.r_[125.0, minute_close[:-1]]
    minute_high = np.maximum(minute_open, minute_close) * (1 + rng.uniform(0, 0.0008, len(timestamps)))
    minute_low = np.minimum(minute_open, minute_close) * (1 - rng.uniform(0, 0.0008, len(timestamps)))
    minute = pd.DataFrame({
        "timestamp": timestamps, "asset": "ALFA", "open": minute_open,
        "high": minute_high, "low": minute_low, "close": minute_close,
        "volume": rng.integers(100, 5000, len(timestamps)),
    }).round({"open": 6, "high": 6, "low": 6, "close": 6})
    minute.to_csv(DATA_DIR / "minute_ohlcv.csv", index=False)

    orders = pd.DataFrame([
        ["2026-08-10 09:31:00", "O001", "ALFA", "buy", 500, 125.05, "submitted", 0],
        ["2026-08-10 09:31:02", "O001", "ALFA", "buy", 500, 125.07, "partial", 200],
        ["2026-08-10 09:31:05", "O001", "ALFA", "buy", 500, 125.08, "filled", 500],
        ["2026-08-10 10:15:00", "O002", "BRAV", "sell", 300, 88.40, "submitted", 0],
        ["2026-08-10 10:15:04", "O002", "BRAV", "sell", 300, 88.37, "filled", 300],
        ["2026-08-10 11:00:00", "O003", "CRUX", "buy", 1000, 101.20, "rejected", 0],
    ], columns=["timestamp", "order_id", "asset", "side", "quantity", "price", "status", "filled_quantity"])
    orders.to_csv(DATA_DIR / "orders.csv", index=False)

    files = [DATA_DIR / name for name in ["daily_ohlcv.csv", "minute_ohlcv.csv", "factor_panel.csv", "orders.csv"]]
    manifest = {
        "seed": SEED,
        "generator": "courseware/generate_assets.py",
        "data_kind": "deterministic synthetic educational market data",
        "files": {path.name: {"rows": sum(1 for _ in path.open(encoding="utf-8")) - 1, "sha256": sha256(path)} for path in files},
    }
    (DATA_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def generate_wrappers() -> None:
    lesson_dir = ROOT / "lessons"
    lesson_dir.mkdir(parents=True, exist_ok=True)
    for module, count in [(1, 8), (2, 10), (3, 9), (4, 11), (5, 8), (6, 7)]:
        for lesson_number in range(1, count + 1):
            case_id = f"m{module}l{lesson_number}"
            content = f'''"""量研课 {case_id}：完整可运行案例。\n\n数据：courseware/data；实现：courseware/cases.py。\n"""\nfrom pathlib import Path\nimport sys\n\nCOURSEWARE = Path(__file__).resolve().parents[1]\nsys.path.insert(0, str(COURSEWARE))\n\nfrom cases import run_case  # noqa: E402\n\nif __name__ == "__main__":\n    run_case("{case_id}", print_result=True)\n'''
            (lesson_dir / f"{case_id}.py").write_text(content, encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-only", action="store_true")
    args = parser.parse_args()
    generate_data()
    if not args.data_only:
        generate_wrappers()
    print(f"Generated reproducible assets in {ROOT}")
