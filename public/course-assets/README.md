# 量研课：完整可复现实践包

本目录对应网页课程的 53 节课。所有示例使用随项目保存的确定性合成数据，不依赖运行时网络请求。

## 环境

- Python 3.11+
- NumPy 1.26.4
- pandas 3.0.3

```bash
cd /Users/ethan/quantitative
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r courseware/requirements.txt
```

## 生成并验证数据

仓库已经包含生成后的 CSV。下面的命令可从固定随机种子重新生成完全相同的数据：

```bash
python courseware/generate_assets.py --data-only
python courseware/verify_all.py
```

运行单课：

```bash
python courseware/lessons/m1l1.py
python courseware/lessons/m4l11.py
```

运行全部 53 课并核对输出：

```bash
python courseware/verify_all.py
```

## 数据说明

- `data/daily_ohlcv.csv`：5 个虚构资产、756 个工作日的日线 OHLCV 与复权收盘价。
- `data/minute_ohlcv.csv`：单个虚构资产的一日分钟线。
- `data/factor_panel.csv`：横截面估值、质量、规模和未来收益标签。
- `data/orders.csv`：用于订单状态、成交和滑点课程的事件样本。
- `data/manifest.json`：文件行数、SHA-256 与生成参数。

资产代码 `ALFA`、`BRAV`、`CRUX`、`DUNE`、`ECHO` 均为虚构。数据只能用于教育、测试和复现，不可解释为真实市场证据或投资建议。

## 代码组织

- `lessons/*.py`：每节课可直接运行的完整入口。
- `cases.py`：53 个案例的实际计算实现。
- `common.py`：数据加载、指标和序列化工具。
- `outputs/*.json`：固定环境下的预期输出快照。
- `verify_all.py`：全量运行、确定性和输出结构检查。

