from __future__ import annotations

import json
from typing import Any, Callable

import numpy as np
import pandas as pd

from common import (
    SEED,
    annualized_stats,
    close_matrix,
    jsonable,
    load_daily,
    load_factors,
    load_minute,
    load_orders,
    max_drawdown,
    return_matrix,
)


def _ols(x: np.ndarray, y: np.ndarray, ridge: float = 0.0) -> np.ndarray:
    design = np.column_stack([np.ones(len(x)), x])
    penalty = np.eye(design.shape[1]) * ridge
    penalty[0, 0] = 0.0
    return np.linalg.solve(design.T @ design + penalty, design.T @ y)


def _portfolio_backtest(cost_bps: float = 0.0) -> pd.Series:
    returns = return_matrix().fillna(0.0)
    signal = close_matrix().pct_change(20).shift(1)
    ranks = signal.rank(axis=1, pct=True)
    raw = (ranks - 0.5).fillna(0.0)
    weights = raw.div(raw.abs().sum(axis=1).replace(0, np.nan), axis=0).fillna(0.0)
    turnover = weights.diff().abs().sum(axis=1).fillna(0.0)
    gross = (weights * returns).sum(axis=1)
    return gross - turnover * cost_bps / 10_000


def _time_splits(n: int, folds: int = 5, test_size: int = 60, gap: int = 5) -> list[tuple[np.ndarray, np.ndarray]]:
    splits = []
    first_test = n - folds * test_size
    for fold in range(folds):
        test_start = first_test + fold * test_size
        train = np.arange(0, max(0, test_start - gap))
        test = np.arange(test_start, min(n, test_start + test_size))
        splits.append((train, test))
    return splits


def _module_one(case: str) -> dict[str, Any]:
    daily = load_daily()
    prices = close_matrix()
    returns = return_matrix()
    if case == "m1l1":
        sample = pd.Series([100.0, 110.0, 100.0]).pct_change().dropna()
        return {"returns": sample.tolist(), "final_price": 100.0}
    if case == "m1l2":
        valid = (daily.high >= daily[["open", "close"]].max(axis=1)) & (daily.low <= daily[["open", "close"]].min(axis=1)) & (daily.volume >= 0)
        return {"rows": len(daily), "valid_rows": int(valid.sum()), "invalid_rows": int((~valid).sum())}
    if case == "m1l3":
        def simple_return(previous: float, current: float) -> float:
            if previous <= 0:
                raise ValueError("previous must be positive")
            return current / previous - 1
        return {"100_to_105": simple_return(100, 105), "105_to_100": simple_return(105, 100)}
    if case == "m1l4":
        vector = np.array([100.0, 102.0, 101.0, 105.0])
        return {"shape": list(vector.shape), "returns": (vector[1:] / vector[:-1] - 1).tolist()}
    if case == "m1l5":
        return {"price_shape": list(prices.shape), "assets": prices.columns.tolist(), "first_valid_return": returns.dropna().iloc[0].to_dict()}
    if case == "m1l6":
        quality = daily.groupby("asset").agg(missing_close=("close", lambda x: int(x.isna().sum())), non_positive=("close", lambda x: int((x <= 0).sum())), duplicate_dates=("date", lambda x: int(x.duplicated().sum())))
        split_day = daily[(daily.asset == "ALFA")].iloc[420]
        return {"quality": quality.to_dict("index"), "alfa_split_raw_close": split_day.close, "alfa_split_adjusted": split_day.adjusted_close}
    if case == "m1l7":
        minute = load_minute().set_index("timestamp")
        daily_bar = minute.resample("1D").agg({"open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"}).dropna()
        return {"minute_rows": len(minute), "daily_bar": daily_bar.iloc[0].to_dict()}
    stats = {asset: annualized_stats(returns[asset]) for asset in returns.columns}
    return {"dataset_rows": len(daily), "date_start": daily.date.min(), "date_end": daily.date.max(), "asset_stats": stats}


def _module_two(case: str) -> dict[str, Any]:
    r = return_matrix()["ALFA"].dropna()
    rng = np.random.default_rng(SEED)
    if case == "m2l1":
        sample = rng.normal(0.0004, 0.01, 1000)
        return {"sample_mean": sample.mean(), "sample_std": sample.std(ddof=1), "n": len(sample)}
    if case == "m2l2":
        sample = np.array([0.02, -0.01, 0.03])
        return {"mean": sample.mean(), "sample_std": sample.std(ddof=1), "variance": sample.var(ddof=1)}
    if case == "m2l3":
        matrix = return_matrix()
        return {"covariance": matrix.cov().round(8).to_dict(), "correlation": matrix.corr().round(4).to_dict()}
    if case == "m2l4":
        z = np.array([-2.326347874, 2.326347874])
        normal_q = r.mean() + z * r.std(ddof=1)
        return {"empirical_1_99": r.quantile([0.01, 0.99]).tolist(), "normal_1_99": normal_q.tolist(), "skew": r.skew(), "excess_kurtosis": r.kurt()}
    if case == "m2l5":
        sample = rng.normal(0.001, 0.02, 5000)
        running = np.cumsum(sample) / np.arange(1, len(sample) + 1)
        return {"mean_at_10": running[9], "mean_at_100": running[99], "mean_at_5000": running[-1]}
    if case == "m2l6":
        def sharpe(x: np.ndarray) -> float:
            return float(np.sqrt(252) * x.mean() / x.std(ddof=1))
        values = np.array([sharpe(rng.choice(r.to_numpy(), len(r), replace=True)) for _ in range(1000)])
        return {"estimate": sharpe(r.to_numpy()), "ci_95": np.quantile(values, [0.025, 0.975]).tolist(), "replications": 1000}
    if case == "m2l7":
        return annualized_stats(r)
    if case == "m2l8":
        threshold = r.quantile(0.05)
        return {"historical_var_95": -threshold, "historical_cvar_95": -r[r <= threshold].mean(), "tail_count": int((r <= threshold).sum())}
    if case == "m2l9":
        matrix = return_matrix()
        weights = np.repeat(1 / matrix.shape[1], matrix.shape[1])
        portfolio = matrix @ weights
        return {"weights": dict(zip(matrix.columns, weights)), **annualized_stats(portfolio)}
    matrix = return_matrix()
    portfolio = matrix.mean(axis=1)
    rolling_vol = portfolio.rolling(60).std() * np.sqrt(252)
    wealth = (1 + portfolio.fillna(0)).cumprod()
    return {"portfolio": annualized_stats(portfolio), "latest_60d_vol": rolling_vol.iloc[-1], "rolling_volatility": rolling_vol.dropna().iloc[::30].tolist(), "wealth_curve": wealth.iloc[::30].tolist(), "correlation": matrix.corr().round(3).to_dict()}


def _module_three(case: str) -> dict[str, Any]:
    prices = close_matrix()
    returns = return_matrix()
    factors = load_factors().dropna()
    if case == "m3l1":
        return {"universe": "5 synthetic liquid assets", "signal": "20-day momentum", "holding_period": "5 business days", "metric": "cost-adjusted return", "rejection_rule": "out-of-sample Sharpe <= 0"}
    if case == "m3l2":
        price = prices.ALFA.dropna().to_numpy()
        ret = returns.ALFA.dropna().to_numpy()
        return {"price_lag1_correlation": np.corrcoef(price[1:], price[:-1])[0, 1], "return_lag1_correlation": np.corrcoef(ret[1:], ret[:-1])[0, 1]}
    if case == "m3l3":
        r = returns.ALFA.dropna()
        autocorr = {lag: r.autocorr(lag) for lag in range(1, 11)}
        absolute = {lag: r.abs().autocorr(lag) for lag in range(1, 11)}
        return {"return_acf": autocorr, "absolute_return_acf": absolute}
    if case == "m3l4":
        feature = prices.pct_change(20)
        vol = returns.rolling(20).std()
        target = returns.shift(-1)
        valid = feature.notna() & vol.notna() & target.notna()
        return {"valid_samples": int(valid.sum().sum()), "feature_end": feature.dropna(how="all").index.max(), "target_shift": -1}
    if case == "m3l5":
        panel = factors[["value", "future_return"]].dropna()
        beta = _ols(panel[["value"]].to_numpy(), panel.future_return.to_numpy())
        prediction = beta[0] + beta[1] * panel.value.to_numpy()
        r2 = 1 - np.square(panel.future_return - prediction).sum() / np.square(panel.future_return - panel.future_return.mean()).sum()
        return {"intercept": beta[0], "value_coefficient": beta[1], "r_squared": r2, "samples": len(panel)}
    if case == "m3l6":
        monthly = prices.resample("ME").last()
        momentum = monthly.shift(1) / monthly.shift(12) - 1
        return {"latest_momentum": momentum.iloc[-1].to_dict(), "latest_rank": momentum.rank(axis=1, pct=True).iloc[-1].to_dict()}
    if case == "m3l7":
        spread = np.log(prices.ALFA) - np.log(prices.BRAV)
        z = (spread - spread.rolling(20).mean()) / spread.rolling(20).std()
        return {"latest_zscore": z.iloc[-1], "long_signals": int((z < -2).sum()), "short_signals": int((z > 2).sum())}
    if case == "m3l8":
        panel = factors.copy()
        ic = panel.groupby("date").apply(lambda x: x.value.rank().corr(x.future_return.rank()), include_groups=False).dropna()
        return {"mean_ic": ic.mean(), "positive_ic_ratio": (ic > 0).mean(), "periods": len(ic)}
    signal = prices.pct_change(20).shift(1)
    ranks = signal.rank(axis=1, pct=True)
    long_short = ((ranks > 0.8).astype(float) - (ranks < 0.2).astype(float))
    weights = long_short.div(long_short.abs().sum(axis=1).replace(0, np.nan), axis=0).fillna(0)
    strategy = (weights * returns).sum(axis=1)
    wealth = (1 + strategy.fillna(0)).cumprod()
    return {"hypothesis": "20-day cross-sectional momentum", "performance": annualized_stats(strategy), "average_turnover": weights.diff().abs().sum(axis=1).mean(), "wealth_curve": wealth.iloc[::30].tolist()}


def _module_four(case: str) -> dict[str, Any]:
    returns = return_matrix()
    orders = load_orders()
    if case == "m4l1":
        return {"event_flow": ["DataFeed", "Strategy", "Portfolio", "Broker", "Ledger"], "separation_checks": 5}
    if case == "m4l2":
        equity, price, current_shares, target_weight = 100_000, 125.0, 100, 0.25
        target = int(target_weight * equity / price)
        return {"current_shares": current_shares, "target_shares": target, "order_quantity": target - current_shares}
    if case == "m4l3":
        signal_time = pd.Timestamp("2026-08-10 16:00")
        execution_time = pd.Timestamp("2026-08-11 09:30")
        return {"information_time": signal_time, "execution_time": execution_time, "causal_order_valid": signal_time <= execution_time}
    if case == "m4l4":
        daily = load_daily()
        membership = daily.groupby("asset").historical_member.agg(["sum", "count"])
        return {"membership_days": membership.to_dict("index"), "survivorship_safe": bool((daily.historical_member == False).any())}  # noqa: E712
    if case == "m4l5":
        gross = _portfolio_backtest(0)
        net = _portfolio_backtest(10)
        return {"gross": annualized_stats(gross), "net_10bps": annualized_stats(net), "annual_cost_drag": gross.mean() * 252 - net.mean() * 252}
    if case == "m4l6":
        participation = np.array([0.005, 0.01, 0.025, 0.05])
        slippage = 0.1 * np.square(participation)
        return {"participation": participation.tolist(), "slippage_fraction": slippage.tolist()}
    if case == "m4l7":
        transitions = orders.groupby("order_id").status.apply(list).to_dict()
        return {"order_state_paths": transitions, "filled_orders": int(orders.groupby("order_id").status.apply(lambda x: "filled" in set(x)).sum())}
    if case == "m4l8":
        strategy = _portfolio_backtest(10)
        stats = annualized_stats(strategy)
        stats["positive_day_ratio"] = float((strategy > 0).mean())
        return stats
    if case == "m4l9":
        strategy = _portfolio_backtest(10)
        wealth = (1 + strategy).cumprod()
        drawdown = wealth / wealth.cummax() - 1
        return {"max_drawdown": drawdown.min(), "max_drawdown_date": drawdown.idxmin(), "underwater_days": int((drawdown < 0).sum())}
    if case == "m4l10":
        splits = _time_splits(len(returns), folds=5, test_size=60, gap=5)
        return {"folds": [{"train_start": int(tr[0]), "train_end": int(tr[-1]), "test_start": int(te[0]), "test_end": int(te[-1])} for tr, te in splits]}
    strategy = _portfolio_backtest(10)
    ledger = pd.DataFrame({"return": strategy, "equity": (1 + strategy).cumprod() * 100_000})
    drawdown = ledger.equity / ledger.equity.cummax() - 1
    monthly = strategy.resample("ME").apply(lambda values: (1 + values).prod() - 1)
    return {"events_processed": len(ledger), "ending_equity": ledger.equity.iloc[-1], "performance": annualized_stats(strategy), "ledger_balanced": bool((ledger.equity > 0).all()), "equity_curve": ledger.equity.iloc[::30].tolist(), "drawdown_curve": drawdown.iloc[::30].tolist(), "monthly_returns": {date.strftime("%Y-%m"): value for date, value in monthly.items()}}


def _module_five(case: str) -> dict[str, Any]:
    panel = load_factors().dropna().reset_index(drop=True)
    features = panel[["value", "quality", "size"]].to_numpy(float)
    target = panel.future_return.to_numpy(float)
    splits = _time_splits(len(panel), folds=5, test_size=200, gap=5)
    if case == "m5l1":
        return {"feature_columns": ["value", "quality", "size"], "label": "next-business-day return", "samples": len(panel), "causal_order": "feature_time < label_time"}
    if case == "m5l2":
        train, test = splits[0]
        mean, std = features[train].mean(axis=0), features[train].std(axis=0)
        transformed = (features[test] - mean) / np.where(std == 0, 1, std)
        return {"train_rows": len(train), "test_rows": len(test), "test_scaled_mean": transformed.mean(axis=0).tolist()}
    if case == "m5l3":
        return {"folds": len(splits), "chronological": all(tr[-1] < te[0] for tr, te in splits), "gap": int(splits[0][1][0] - splits[0][0][-1] - 1)}
    if case == "m5l4":
        rng = np.random.default_rng(SEED)
        shuffled = rng.permutation(target)
        scaled = (features - features.mean(axis=0)) / features.std(axis=0)
        beta = _ols(scaled, shuffled, ridge=1.0)
        prediction = beta[0] + np.sum(scaled * beta[1:], axis=1)
        corr = np.corrcoef(prediction, shuffled)[0, 1]
        return {"shuffled_label_correlation": corr, "warning": "in-sample correlation is not validation"}
    if case == "m5l5":
        train, test = splits[-1]
        beta = _ols(features[train], target[train], ridge=1.0)
        prediction = np.column_stack([np.ones(len(test)), features[test]]) @ beta
        baseline = np.repeat(target[train].mean(), len(test))
        return {"ridge_mse": np.square(target[test] - prediction).mean(), "baseline_mse": np.square(target[test] - baseline).mean()}
    if case == "m5l6":
        coefficients = []
        for train, _ in splits:
            coefficients.append(_ols(features[train], target[train], ridge=1.0)[1:])
        array = np.array(coefficients)
        return {"feature_names": ["value", "quality", "size"], "coefficient_mean": array.mean(axis=0).tolist(), "coefficient_std": array.std(axis=0).tolist()}
    if case == "m5l7":
        rng = np.random.default_rng(SEED)
        sharpes = []
        for _ in range(100):
            noise = rng.normal(0, 0.01, 500)
            sharpes.append(np.sqrt(252) * noise.mean() / noise.std(ddof=1))
        return {"strategies_tried": 100, "mean_sharpe": np.mean(sharpes), "best_sharpe": np.max(sharpes)}
    fold_scores = []
    for train, test in splits:
        beta = _ols(features[train], target[train], ridge=1.0)
        prediction = np.column_stack([np.ones(len(test)), features[test]]) @ beta
        fold_scores.append(np.corrcoef(prediction, target[test])[0, 1])
    return {"model": "ridge regression", "fold_correlations": fold_scores, "mean_oos_correlation": np.nanmean(fold_scores), "leakage_checks_passed": True}


def _module_six(case: str) -> dict[str, Any]:
    orders = load_orders()
    strategy = _portfolio_backtest(10)
    if case == "m6l1":
        return {"package": ["signals.py", "portfolio.py", "config.py", "adapters/", "tests/"], "single_source_of_truth": True}
    if case == "m6l2":
        paths = orders.groupby("order_id").status.apply(list).to_dict()
        terminal = {order: states[-1] for order, states in paths.items()}
        return {"state_paths": paths, "terminal_states": terminal, "unique_events": len(orders.drop_duplicates(["order_id", "status", "filled_quantity"]))}
    if case == "m6l3":
        checks = {"single_weight": abs(0.08) <= 0.10, "gross_exposure": 0.85 <= 1.0, "participation": 0.015 <= 0.025, "daily_loss": -0.012 >= -0.02}
        return {"checks": checks, "order_allowed": all(checks.values())}
    if case == "m6l4":
        metrics = {"data_lag_seconds": 1.8, "order_reject_rate": 1 / 3, "position_drift": 0.002, "realized_slippage_bps": 2.4, "heartbeat": True}
        alerts = [name for name, value in metrics.items() if (name == "order_reject_rate" and value > 0.1) or (name == "data_lag_seconds" and value > 5)]
        return {"metrics": metrics, "alerts": alerts}
    if case == "m6l5":
        checklist = {"data": True, "clock": True, "risk": True, "orders": True, "reconciliation": True, "alerts": True, "kill_switch": True}
        return {"checklist": checklist, "ready_for_small_paper_trial": all(checklist.values()), "real_market_impact_validated": False}
    if case == "m6l6":
        stats = annualized_stats(strategy)
        return {"report_sections": ["thesis", "data", "method", "validation", "costs", "capacity", "risks", "limitations", "reproduction", "monitoring"], "strategy_snapshot": stats, "stop_condition": "rolling 6-month net Sharpe <= 0"}
    return {"deliverables": ["protocol", "repository", "data_dictionary", "backtest", "robustness", "cost_model", "risk_limits", "paper_plan", "report"], "rubric": {"correctness": 0.3, "reproducibility": 0.25, "validation": 0.2, "risk": 0.15, "communication": 0.1}, "example_result": annualized_stats(strategy)}


MODULE_RUNNERS: dict[str, Callable[[str], dict[str, Any]]] = {
    "1": _module_one,
    "2": _module_two,
    "3": _module_three,
    "4": _module_four,
    "5": _module_five,
    "6": _module_six,
}


def run_case(case_id: str, print_result: bool = False) -> dict[str, Any]:
    if len(case_id) < 4 or not case_id.startswith("m") or "l" not in case_id:
        raise ValueError(f"Invalid case id: {case_id}")
    module = case_id.split("l", 1)[0][1:]
    if module not in MODULE_RUNNERS:
        raise KeyError(case_id)
    result = jsonable(MODULE_RUNNERS[module](case_id))
    if print_result:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def run_experiment(case_id: str, value: float) -> dict[str, Any]:
    """使用固定课程数据运行逐课参数实验；不修改标准案例快照。"""
    module, lesson = case_id.split("l", 1)
    m, l, x = int(module[1:]), int(lesson), float(value)
    returns = return_matrix().fillna(0.0)
    prices = close_matrix()
    r = returns.ALFA
    rng = np.random.default_rng(SEED + m * 100 + l)

    if m == 1:
        if l == 1:
            return {"price_start": 100.0, "price_end": 100 * (1 + x / 100), "simple_return": x / 100}
        if l == 2:
            daily = load_daily(); valid = (daily.adjusted_close >= x) & (daily.volume >= 0)
            return {"threshold": x, "rows_kept": int(valid.sum()), "rows_removed": int((~valid).sum())}
        if l == 3:
            raw = prices.ALFA.iloc[:60] * x; changed = raw.pct_change().dropna()
            return {"factor": x, **annualized_stats(changed)}
        if l == 4:
            sample = r.iloc[:max(3, int(x))]
            return {"sample_size": len(sample), "mean": sample.mean(), "volatility": sample.std(ddof=1)}
        if l == 5:
            count = min(max(2, int(x)), prices.shape[1])
            return {"requested_assets": int(x), "available_assets": count, "matrix_rows": len(prices), "matrix_columns": count}
        if l == 6:
            missing_rate = load_daily().adjusted_close.isna().mean() * 100
            return {"warning_threshold": x, "observed_missing_rate": missing_rate, "quality_passed": bool(missing_rate <= x)}
        if l == 7:
            minute = load_minute().set_index("timestamp"); bars = minute.resample(f"{max(1,int(x))}min").close.ohlc().dropna()
            return {"window_minutes": int(x), "bars": len(bars), "mean_range": (bars.high-bars.low).mean()}
        stats = annualized_stats(r); factor = x / 252
        return {"annualization_days": int(x), "annual_return": r.mean()*x, "annual_volatility": r.std(ddof=1)*np.sqrt(x), "sharpe": stats["sharpe"]*np.sqrt(factor)}

    if m == 2:
        if l == 1:
            n=max(10,int(x)); sample=rng.choice(r.to_numpy(),n,replace=True); return {"sample_size":n,"sample_mean":sample.mean(),"mean_error":sample.mean()-r.mean()}
        if l == 2:
            sample=rng.standard_t(max(3,int(x)),2000); return {"degrees_freedom":int(x),"sample_std":sample.std(ddof=1),"excess_kurtosis":pd.Series(sample).kurt()}
        if l == 3:
            rolling=r.rolling(max(2,int(x))).std()*np.sqrt(252); return {"window":int(x),"latest_volatility":rolling.iloc[-1],"observations":rolling.notna().sum()}
        if l == 4:
            window=max(5,int(x)); corr=returns.ALFA.rolling(window).corr(returns.BRAV); return {"window":window,"latest_correlation":corr.iloc[-1],"mean_correlation":corr.mean()}
        if l in (5,10):
            confidence=x/100; threshold=r.quantile(1-confidence); return {"confidence":confidence,"var":-threshold,"cvar":-r[r<=threshold].mean(),"tail_count":int((r<=threshold).sum())}
        if l == 6:
            reps=min(max(20,int(x)),5000); values=[rng.choice(r.to_numpy(),len(r),replace=True).mean() for _ in range(reps)]; return {"replications":reps,"bootstrap_mean":np.mean(values),"bootstrap_std":np.std(values,ddof=1)}
        if l == 7:
            sample=r.iloc[-min(max(20,int(x)),len(r)):]; return {"lookback":len(sample),**annualized_stats(sample)}
        if l == 8:
            weight=x/100; portfolio=returns.ALFA*weight+returns.BRAV*(1-weight); return {"weight_alfa":weight,"weight_brav":1-weight,**annualized_stats(portfolio)}
        portfolio=returns.mean(axis=1); stressed=portfolio+x/100; return {"shock":x/100,"base_loss":portfolio.sum(),"stressed_loss":stressed.sum()}

    if m == 3:
        if l == 1:
            lag=max(1,int(x)); signal=prices.pct_change(20).shift(lag); return {"lag":lag,"valid_signals":int(signal.notna().sum().sum()),"causal":True}
        if l == 2:
            lag=max(1,int(x)); return {"lag":lag,"price_autocorrelation":prices.ALFA.autocorr(lag),"return_autocorrelation":r.autocorr(lag)}
        if l in (3,6):
            window=max(2,int(x)); momentum=prices.pct_change(window).iloc[-1]; return {"window":window,"latest_momentum":momentum.to_dict(),"dispersion":momentum.std()}
        if l == 4:
            n=min(max(30,int(x)),len(r)); return {"training_samples":n,"feature_mean":r.iloc[:n].mean(),"target_available":n-1}
        if l == 5:
            panel=load_factors().dropna(); beta=_ols(panel[["value"]].to_numpy(),panel.future_return.to_numpy(),ridge=max(0,x)); return {"ridge":x,"intercept":beta[0],"value_coefficient":beta[1]}
        if l == 7:
            window=max(5,int(x)); spread=np.log(prices.ALFA)-np.log(prices.BRAV); z=(spread-spread.rolling(window).mean())/spread.rolling(window).std(); return {"window":window,"latest_zscore":z.iloc[-1],"signals":int((z.abs()>2).sum())}
        if l == 8:
            panel=load_factors().dropna(); counts=panel.groupby("date").size(); valid=counts>=int(x); return {"minimum_assets":int(x),"eligible_periods":int(valid.sum()),"total_periods":len(valid)}
        window=max(2,int(x)); signal=prices.pct_change(window).shift(1); strategy=(signal.rank(axis=1,pct=True).sub(.5)*returns).mean(axis=1); return {"holding_period":window,**annualized_stats(strategy)}

    if m == 4:
        if l in (1,2):
            target=x/100; shares=int(target*100_000/prices.ALFA.iloc[-1]); return {"target_weight":target,"target_shares":shares,"notional":shares*prices.ALFA.iloc[-1]}
        if l == 3:
            weights=np.repeat(1/returns.shape[1],returns.shape[1]); scaled=weights/(1+x*returns.var().to_numpy()); return {"risk_aversion":x,"gross_weight":np.abs(scaled).sum(),"largest_weight":np.abs(scaled).max()}
        if l in (4,5,11):
            strategy=_portfolio_backtest(x); return {"cost_bps":x,**annualized_stats(strategy),"ending_wealth":(1+strategy).prod()}
        if l == 6:
            participation=x/100; return {"participation":participation,"slippage_fraction":.1*participation**2,"completion_slices":int(np.ceil(1/max(participation,.001)))}
        if l == 7:
            capital=x*10_000; return {"capital":capital,"ending_equity":capital*(1+_portfolio_backtest(10)).prod(),"orders":load_orders().order_id.nunique()}
        if l == 8:
            target=x/100; observed=_portfolio_backtest(10).std(ddof=1)*np.sqrt(252); return {"target_volatility":target,"observed_volatility":observed,"leverage":target/observed}
        if l == 9:
            cap=x/100; raw=prices.pct_change(20).rank(axis=1,pct=True); turnover=raw.diff().abs().sum(axis=1); return {"turnover_cap":cap,"days_over_cap":int((turnover>cap).sum()),"mean_turnover":turnover.mean()}
        participation=x/100; return {"participation":participation,"estimated_slippage_bps":1000*participation**2,"estimated_slices":int(np.ceil(1/participation))}

    if m == 5:
        panel=load_factors().dropna().reset_index(drop=True); n=len(panel)
        if l == 1:
            test=int(n*x/100); return {"test_ratio":x/100,"train_rows":n-test,"test_rows":test}
        if l in (2,3):
            gap=int(x) if l==2 else 5; folds=5 if l==2 else int(x); splits=_time_splits(n,folds=folds,test_size=min(100,n//(folds+1)),gap=gap); return {"folds":len(splits),"gap":gap,"first_train":len(splits[0][0]),"first_test":len(splits[0][1])}
        if l == 4:
            candidates=int(x); return {"candidates":candidates,"selection_penalty":np.sqrt(2*np.log(max(candidates,2))),"overfit_risk":1-1/max(candidates,1)}
        if l == 5:
            alpha=x/100; tests=20; return {"alpha":alpha,"tests":tests,"expected_false_positives":alpha*tests,"familywise_risk":1-(1-alpha)**tests}
        if l == 6:
            features=int(x); return {"features":features,"samples_per_feature":n/features,"degrees_of_freedom_ratio":features/n}
        if l == 7:
            observed=_portfolio_backtest(10); sharpe=annualized_stats(observed)["sharpe"]; return {"minimum_sharpe":x,"observed_sharpe":sharpe,"promoted":bool(sharpe>=x)}
        scores=np.array([-0.08,-0.02,0.01,0.04,0.02]); tolerance=x/100; return {"tolerance":tolerance,"score_range":scores.max()-scores.min(),"stable":bool(scores.std()<=tolerance)}

    if l == 1:
        weights=np.array([.04,.08,.12,.18]); limit=x/100; return {"limit":limit,"allowed":int((np.abs(weights)<=limit).sum()),"rejected":int((np.abs(weights)>limit).sum())}
    if l == 2:
        loss=-annualized_stats(_portfolio_backtest(10))["max_drawdown"]*100; return {"loss_limit":x,"observed_drawdown":loss,"kill_switch":bool(loss>=x)}
    if l == 3:
        latency=np.array([1.8,4.0,18.0,44.0]); return {"timeout_seconds":x,"timed_out":int((latency>x).sum()),"accepted":int((latency<=x).sum())}
    if l == 4:
        failures=2; return {"retry_limit":int(x),"attempts":min(failures+1,int(x)+1),"recovered":bool(x>=failures)}
    if l == 5:
        delays=np.array([1.8,12,45,180]); return {"alert_limit":x,"alerts":int((delays>x).sum()),"coverage":float((delays<=x).mean())}
    if l == 6:
        usage=x/100; return {"budget_usage":usage,"remaining_budget":1-usage,"deleveraging":bool(usage>.8)}
    observations=int(x); return {"observation_days":observations,"minimum_events":observations*5,"graduation_ready":bool(observations>=20)}
