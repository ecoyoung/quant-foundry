"""从 cases.py 导出每节课实际执行的核心实现，供网页学习器审阅。"""
from __future__ import annotations

import ast
import csv
import json
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CASES_PATH = ROOT / "cases.py"
PUBLIC_PATH = ROOT.parent / "public" / "course-assets" / "implementations.json"
PREVIEWS_PATH = ROOT.parent / "public" / "course-assets" / "data-previews.json"
LABS_PATH = ROOT.parent / "public" / "course-assets" / "guided-labs.json"
MODULE_COUNTS = {1: 8, 2: 10, 3: 9, 4: 11, 5: 8, 6: 7}
MODULE_NAMES = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six"}
COMMON_PATH = ROOT / "common.py"
COMMON_FUNCTIONS = ["load_daily", "load_minute", "load_factors", "load_orders", "close_matrix", "return_matrix", "max_drawdown", "annualized_stats", "jsonable"]
CASE_HELPERS = ["_ols", "_portfolio_backtest", "_time_splits"]


def source_for(nodes: list[ast.stmt], source: str) -> str:
    if not nodes:
        return ""
    return textwrap.dedent("\n".join(source.splitlines()[nodes[0].lineno - 1 : nodes[-1].end_lineno])).strip()


def case_id_from_if(node: ast.stmt) -> str | None:
    if not isinstance(node, ast.If) or not isinstance(node.test, ast.Compare):
        return None
    test = node.test
    if not isinstance(test.left, ast.Name) or test.left.id != "case":
        return None
    if len(test.comparators) != 1 or not isinstance(test.comparators[0], ast.Constant):
        return None
    value = test.comparators[0].value
    return value if isinstance(value, str) else None


def export() -> dict[str, dict[str, str]]:
    source = CASES_PATH.read_text(encoding="utf-8")
    tree = ast.parse(source)
    functions = {node.name: node for node in tree.body if isinstance(node, ast.FunctionDef)}
    result: dict[str, dict[str, str]] = {}

    for module, count in MODULE_COUNTS.items():
        function = functions[f"_module_{MODULE_NAMES[module]}"]
        branches = [(index, case_id_from_if(node), node) for index, node in enumerate(function.body) if case_id_from_if(node)]
        preamble = source_for(function.body[: branches[0][0]], source)

        for _, case_id, branch in branches:
            assert case_id is not None and isinstance(branch, ast.If)
            branch_source = source_for(branch.body, source)
            result[case_id] = {
                "title": f"cases.py · {function.name}() · {case_id}",
                "source": f"# 进入 {function.name} 后先执行\n{preamble}\n\n# 命中分支：if case == \"{case_id}\"\n{branch_source}",
                "location": {"file": "courseware/cases.py", "function": f"{function.name}()", "start": branch.lineno, "end": branch.end_lineno},
                "dependencies": dependencies_for(f"{preamble}\n{branch_source}"),
                "dependencySources": dependency_sources(dependencies_for(f"{preamble}\n{branch_source}"), source, tree),
            }

        final_id = f"m{module}l{count}"
        tail = source_for(function.body[branches[-1][0] + 1 :], source)
        result[final_id] = {
            "title": f"cases.py · {function.name}() · 默认项目分支",
            "source": f"# 进入 {function.name} 后先执行\n{preamble}\n\n# 未被前序 if 返回，进入 {final_id} 默认分支\n{tail}",
            "location": {"file": "courseware/cases.py", "function": f"{function.name}()", "start": function.body[branches[-1][0] + 1].lineno, "end": function.body[-1].end_lineno},
            "dependencies": dependencies_for(f"{preamble}\n{tail}"),
            "dependencySources": dependency_sources(dependencies_for(f"{preamble}\n{tail}"), source, tree),
        }

    return result


def dependencies_for(code: str) -> list[str]:
    names = {node.id for node in ast.walk(ast.parse(code)) if isinstance(node, ast.Name)}
    ordered = COMMON_FUNCTIONS + CASE_HELPERS + ["numpy", "pandas"]
    aliases = {"numpy": "np", "pandas": "pd"}
    return [name for name in ordered if aliases.get(name, name) in names]


def dependency_sources(names: list[str], cases_source: str, cases_tree: ast.Module) -> dict[str, dict[str, object]]:
    common_source = COMMON_PATH.read_text(encoding="utf-8")
    common_tree = ast.parse(common_source)
    common_nodes = {node.name: node for node in common_tree.body if isinstance(node, ast.FunctionDef)}
    case_nodes = {node.name: node for node in cases_tree.body if isinstance(node, ast.FunctionDef)}
    result: dict[str, dict[str, object]] = {}
    for name in names:
        if name in common_nodes:
            node = common_nodes[name]
            result[name] = {"file": "courseware/common.py", "start": node.lineno, "end": node.end_lineno, "source": source_for([node], common_source)}
        elif name in case_nodes:
            node = case_nodes[name]
            result[name] = {"file": "courseware/cases.py", "start": node.lineno, "end": node.end_lineno, "source": source_for([node], cases_source)}
        elif name == "numpy":
            result[name] = {"file": "第三方库", "start": 0, "end": 0, "source": "import numpy as np\n# NumPy 提供数组、随机抽样与线性代数运算。"}
        elif name == "pandas":
            result[name] = {"file": "第三方库", "start": 0, "end": 0, "source": "import pandas as pd\n# pandas 提供表格、时间索引与分组计算。"}
    return result


def standalone_support(cases_source: str, cases_tree: ast.Module) -> str:
    common_source = COMMON_PATH.read_text(encoding="utf-8")
    common_tree = ast.parse(common_source)
    common_nodes = {node.name: node for node in common_tree.body if isinstance(node, ast.FunctionDef)}
    case_nodes = {node.name: node for node in cases_tree.body if isinstance(node, ast.FunctionDef)}
    common_code = "\n\n".join(source_for([common_nodes[name]], common_source) for name in COMMON_FUNCTIONS)
    helper_code = "\n\n".join(source_for([case_nodes[name]], cases_source) for name in CASE_HELPERS)
    return f'''from pathlib import Path
from typing import Any
import json
import numpy as np
import pandas as pd

# 同一份脚本同时支持浏览器挂载目录和下载后的本地课程目录
DATA_DIR = Path("/courseware/data")
if not DATA_DIR.exists():
    DATA_DIR = Path("courseware/data") if Path("courseware/data").exists() else Path("data")
SEED = 20260812

{common_code}

{helper_code}'''


def runnable_code(case_id: str, preamble: str, body: str, support: str) -> str:
    indented = textwrap.indent(f"# 本模块数据准备\n{preamble}\n\n# {case_id} 的实际计算\n{body}", "    ")
    return f'''{support}

def lesson_implementation():
{indented}

result = lesson_implementation()
print(json.dumps(jsonable(result), ensure_ascii=False, indent=2))'''


def export_data_previews() -> None:
    descriptions = {
        "date": "交易日期", "timestamp": "事件时间", "asset": "虚构资产代码",
        "open": "开盘价", "high": "最高价", "low": "最低价", "close": "未复权收盘价",
        "adjusted_close": "复权收盘价", "volume": "成交量", "sector": "行业标签",
        "historical_member": "当日是否属于历史资产池", "value": "价值因子暴露",
        "quality": "质量因子暴露", "size": "规模因子暴露", "future_return": "下一期收益率",
        "order_id": "订单编号", "side": "买卖方向", "quantity": "委托数量", "price": "委托或成交价格",
        "status": "订单状态", "filled_quantity": "累计成交数量",
    }
    previews = {}
    for path in sorted((ROOT / "data").glob("*.csv")):
        with path.open(encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            rows = []
            total = 0
            for row in reader:
                total += 1
                if len(rows) < 5:
                    rows.append(row)
            columns = reader.fieldnames or []
        previews[path.name] = {
            "filename": path.name,
            "rows": total,
            "columns": columns,
            "dictionary": {column: descriptions.get(column, "课程数据字段") for column in columns},
            "preview": rows,
        }
    PREVIEWS_PATH.write_text(json.dumps(previews, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def first_scalar(value: object, path: list[object] | None = None) -> tuple[list[object], object]:
    path = path or []
    if isinstance(value, dict):
        for key, item in value.items():
            found_path, found = first_scalar(item, [*path, key])
            if found_path:
                return found_path, found
    elif isinstance(value, list):
        for index, item in enumerate(value):
            found_path, found = first_scalar(item, [*path, index])
            if found_path:
                return found_path, found
    elif isinstance(value, (str, int, float, bool)) or value is None:
        return path, value
    return [], None


def export_guided_labs() -> None:
    labs = {}
    for output_path in sorted((ROOT / "outputs").glob("m*l*.json")):
        case_id = output_path.stem
        output = json.loads(output_path.read_text(encoding="utf-8"))
        path, answer = first_scalar(output)
        expression = "result" + "".join(f"[{part!r}]" for part in path)
        comparison = f"abs({expression} - ANSWER) < 1e-8" if isinstance(answer, float) else f"{expression} == ANSWER"
        labs[case_id] = {
            "title": "用断言描述本课证据",
            "task": f"补全 ANSWER，使测试准确验证输出路径 {' → '.join(map(str, path))}。",
            "starter": f'''import json
from cases import run_case

result = run_case("{case_id}")

# TODO：根据本课结果补全这个值
ANSWER = ...
assert {comparison}, "断言未通过，请检查结果与数据类型"

print(json.dumps(result, ensure_ascii=False, indent=2))''',
            "answer": repr(answer),
            "solution": f'''import json
from cases import run_case

result = run_case("{case_id}")
ANSWER = {answer!r}
assert {comparison}
print(json.dumps(result, ensure_ascii=False, indent=2))''',
            "hints": [
                f"先运行封装代码，沿路径 {' → '.join(map(str, path))} 找到目标值。",
                f"目标值的数据类型是 {type(answer).__name__}。",
                f"参考值为 {answer!r}；填写时保留正确的引号或小数格式。",
            ],
        }
    labs.update(first_module_labs())
    labs.update(advanced_labs())
    LABS_PATH.write_text(json.dumps(labs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def first_module_labs() -> dict[str, dict[str, object]]:
    """首模块采用手工设计的渐进任务，不让学员只抄快照里的一个数。"""
    specs = {
        "m1l1": ("从价格计算简单收益率", "补全相邻两日价格的收益率表达式。", "prices = [100.0, 102.0, 99.96]\nreturns = [...]  # TODO：用相邻价格计算两个简单收益率", "prices = [100.0, 102.0, 99.96]\nreturns = [prices[i] / prices[i - 1] - 1 for i in range(1, len(prices))]", "assert all(abs(a-b)<1e-12 for a,b in zip(returns,[0.02,-0.02]))"),
        "m1l2": ("识别可用的价格记录", "写出同时检查价格为正、成交量非负的过滤条件。", "rows = [(101.2, 800), (0.0, 500), (99.8, -1)]\nvalid = [...]  # TODO：只保留合法行", "rows = [(101.2, 800), (0.0, 500), (99.8, -1)]\nvalid = [row for row in rows if row[0] > 0 and row[1] >= 0]", "assert valid == [(101.2,800)]"),
        "m1l3": ("实现收益率函数", "补全函数体，并处理前值为零的异常输入。", "def simple_return(previous, current):\n    # TODO：前值必须为正\n    ...", "def simple_return(previous, current):\n    if previous <= 0:\n        raise ValueError('previous must be positive')\n    return current / previous - 1", "assert abs(simple_return(100,103)-0.03)<1e-12"),
        "m1l4": ("向量化计算收益率", "使用 pandas 的 pct_change 生成完整收益序列。", "import pandas as pd\nprices = pd.Series([100.0, 101.0, 99.99, 102.0])\nreturns = ...  # TODO", "import pandas as pd\nprices = pd.Series([100.0, 101.0, 99.99, 102.0])\nreturns = prices.pct_change().dropna()", "assert len(returns)==3 and abs(returns.iloc[0]-0.01)<1e-12"),
        "m1l5": ("构造资产价格矩阵", "把长表转换为日期 × 资产矩阵，并计算收益率。", "import pandas as pd\nframe = pd.DataFrame({'date':['d1','d1','d2','d2'],'asset':['A','B','A','B'],'price':[100,50,102,49]})\nprices = ...  # TODO：pivot\nreturns = ...", "import pandas as pd\nframe = pd.DataFrame({'date':['d1','d1','d2','d2'],'asset':['A','B','A','B'],'price':[100,50,102,49]})\nprices = frame.pivot(index='date', columns='asset', values='price')\nreturns = prices.pct_change().dropna()", "assert abs(returns.loc['d2','A']-0.02)<1e-12 and abs(returns.loc['d2','B']+0.02)<1e-12"),
        "m1l6": ("编写数据质量检查", "统计缺失、非正价格和重复键。", "import pandas as pd\ndf = pd.DataFrame({'date':['d1','d1','d2'],'asset':['A','A','B'],'price':[100,None,-2]})\nreport = {...}  # TODO", "import pandas as pd\ndf = pd.DataFrame({'date':['d1','d1','d2'],'asset':['A','A','B'],'price':[100,None,-2]})\nreport = {'missing': int(df.price.isna().sum()), 'non_positive': int(df.price.le(0).sum()), 'duplicate_keys': int(df.duplicated(['date','asset']).sum())}", "assert report=={'missing':1,'non_positive':1,'duplicate_keys':1}"),
        "m1l7": ("聚合日内 OHLC", "从逐笔价格生成开、高、低、收四个字段。", "import pandas as pd\ns = pd.Series([100,103,99,102])\nbar = {...}  # TODO", "import pandas as pd\ns = pd.Series([100,103,99,102])\nbar = {'open': int(s.iloc[0]), 'high': int(s.max()), 'low': int(s.min()), 'close': int(s.iloc[-1])}", "assert bar=={'open':100,'high':103,'low':99,'close':102}"),
        "m1l8": ("形成可复现绩效摘要", "实现年化收益、波动和夏普率的计算闭环。", "import pandas as pd\nr = pd.Series([0.01,-0.005,0.012,-0.002])\nannual_return = ...\nannual_vol = ...\nsharpe = ...", "import pandas as pd\nr = pd.Series([0.01,-0.005,0.012,-0.002])\nannual_return = r.mean()*252\nannual_vol = r.std(ddof=1)*(252**0.5)\nsharpe = annual_return/annual_vol", "assert annual_vol>0 and abs(sharpe-annual_return/annual_vol)<1e-12"),
    }
    result = {}
    for lesson_id, (title, task, starter_core, solution_core, assertion) in specs.items():
        def wrap(core: str) -> str:
            return f"{core}\n\n{assertion}\nprint('练习通过：计算与断言形成闭环')"
        result[lesson_id] = {
            "title": title, "task": task, "starter": wrap(starter_core),
            "answer": solution_core, "solution": wrap(solution_core),
            "hints": ["先写出输入与输出的形状或数据类型。", "把计算拆成一行可检查的中间结果。", "参考实现已解锁；比较思路后再载入，仍需亲自运行测试。"],
        }
    return result


ADVANCED_TITLES = {
    "m2l1":"检验随机样本的估计误差", "m2l2":"核对样本统计量口径", "m2l3":"审计协方差与相关矩阵", "m2l4":"比较经验尾部与正态尾部", "m2l5":"量化样本均值收敛", "m2l6":"检查 Bootstrap 区间", "m2l7":"建立年化风险绩效卡", "m2l8":"验证 VaR 与 CVaR 顺序", "m2l9":"检查组合权重与绩效", "m2l10":"汇总风险仪表盘证据",
    "m3l1":"把研究协议变成可检查字段", "m3l2":"比较价格与收益的滞后关系", "m3l3":"审计 ACF 滞后结构", "m3l4":"检查特征与标签时间线", "m3l5":"复核回归估计证据", "m3l6":"检查动量排序完整性", "m3l7":"审计配对交易信号", "m3l8":"汇总横截面 IC 证据", "m3l9":"形成因子研究证据表",
    "m4l1":"验证事件驱动组件边界", "m4l2":"从目标权重推导订单", "m4l3":"检查信息与成交因果顺序", "m4l4":"审计历史成分股覆盖", "m4l5":"拆解毛收益、净收益与成本", "m4l6":"检查参与率冲击曲线", "m4l7":"审计订单状态路径", "m4l8":"建立回测绩效证据", "m4l9":"检查回撤严重度与持续期", "m4l10":"验证 Walk-forward 时间隔离", "m4l11":"核对回测账本闭环",
    "m5l1":"审计特征与标签契约", "m5l2":"检查训练内标准化", "m5l3":"验证时序交叉验证折", "m5l4":"运行随机标签泄漏警报", "m5l5":"比较模型与朴素基准", "m5l6":"汇总跨折系数稳定性", "m5l7":"量化多重尝试的赢家偏差", "m5l8":"形成样本外验证档案",
    "m6l1":"核对研究到生产的包契约", "m6l2":"审计订单幂等状态", "m6l3":"实现预交易风险闸门", "m6l4":"从运行指标生成告警", "m6l5":"检查模拟盘上线条件", "m6l6":"审计策略报告完整性", "m6l7":"核对毕业交付证据链",
}


def advanced_labs() -> dict[str, dict[str, object]]:
    """后五个模块练习真实处理本课完整结果，并以多项性质测试验收。"""
    labs: dict[str, dict[str, object]] = {}
    for lesson_id, title in ADVANCED_TITLES.items():
        output = json.loads((ROOT / "outputs" / f"{lesson_id}.json").read_text(encoding="utf-8"))
        top_keys = list(output)
        variant = (int(lesson_id.split("l")[1]) - 1) % 4
        common = f'import json\nfrom cases import run_case\n\nresult = run_case("{lesson_id}")\n'
        if variant == 0:
            starter_core = '''def numeric_evidence(value):
    """递归提取所有非布尔数值；返回一维列表。"""
    # TODO：同时处理 dict、list 与数值叶节点
    ...

values = numeric_evidence(result)
summary = {"count": len(values), "minimum": min(values), "maximum": max(values)}'''
            solution_core = '''def numeric_evidence(value):
    """递归提取所有非布尔数值；返回一维列表。"""
    if isinstance(value, dict):
        return [number for item in value.values() for number in numeric_evidence(item)]
    if isinstance(value, list):
        return [number for item in value for number in numeric_evidence(item)]
    return [float(value)] if isinstance(value, (int, float)) and not isinstance(value, bool) else []

values = numeric_evidence(result)
summary = {"count": len(values), "minimum": min(values), "maximum": max(values)}'''
            tests = ['assert summary["count"] > 0', 'assert summary["minimum"] <= summary["maximum"]', 'assert all(value == value for value in values)']
            task = "实现递归数值提取器，并用数量、最小值与最大值检查本课全部数值证据。"
        elif variant == 1:
            starter_core = '''def leaf_paths(value, prefix="result"):
    """返回所有叶节点的点号路径。"""
    # TODO：递归遍历 dict 与 list
    ...

paths = leaf_paths(result)'''
            solution_core = '''def leaf_paths(value, prefix="result"):
    """返回所有叶节点的点号路径。"""
    if isinstance(value, dict):
        return [path for key, item in value.items() for path in leaf_paths(item, f"{prefix}.{key}")]
    if isinstance(value, list):
        return [path for index, item in enumerate(value) for path in leaf_paths(item, f"{prefix}[{index}]")]
    return [prefix]

paths = leaf_paths(result)'''
            tests = ['assert paths', 'assert len(paths) == len(set(paths))', f'assert all(path.startswith("result") for path in paths)']
            task = "实现结果路径索引，让报告里的每项证据都能追溯到 JSON 字段。"
        elif variant == 2:
            starter_core = f'''REQUIRED = {top_keys!r}

def audit(payload, required):
    """返回缺失字段、空字段和是否通过。"""
    # TODO：空列表、空字典、空字符串和 None 都算空字段
    ...

report = audit(result, REQUIRED)'''
            solution_core = f'''REQUIRED = {top_keys!r}

def audit(payload, required):
    """返回缺失字段、空字段和是否通过。"""
    missing = [key for key in required if key not in payload]
    empty = [key for key in required if key in payload and payload[key] in (None, "", [], {{}})]
    return {{"missing": missing, "empty": empty, "passed": not missing and not empty}}

report = audit(result, REQUIRED)'''
            tests = ['assert report["passed"]', 'assert report["missing"] == []', 'assert report["empty"] == []']
            task = "把本课结论写成数据契约审计，明确必需字段、空值与通过条件。"
        else:
            starter_core = '''def finite_numbers(value):
    """递归返回所有有限数值。"""
    # TODO：排除 bool、NaN 与无穷值
    ...

values = finite_numbers(result)
evidence = {"total": len(values), "mean": sum(values) / len(values)}'''
            solution_core = '''import math

def finite_numbers(value):
    """递归返回所有有限数值。"""
    if isinstance(value, dict):
        return [number for item in value.values() for number in finite_numbers(item)]
    if isinstance(value, list):
        return [number for item in value for number in finite_numbers(item)]
    if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value):
        return [float(value)]
    return []

values = finite_numbers(result)
evidence = {"total": len(values), "mean": sum(values) / len(values)}'''
            tests = ['assert evidence["total"] > 0', 'assert min(values) <= evidence["mean"] <= max(values)', 'assert all(isinstance(value, float) for value in values)']
            task = "实现有限数值清洗器，避免 NaN、无穷值或布尔量污染研究摘要。"
        def wrap(core: str) -> str:
            return f"{common}\n{core}\n\n" + "\n".join(tests) + "\nprint(json.dumps({'lesson': '" + lesson_id + "', 'tests': 'passed'}, ensure_ascii=False))"
        labs[lesson_id] = {
            "title": title, "task": task, "starter": wrap(starter_core), "answer": solution_core,
            "solution": wrap(solution_core),
            "hints": ["先用一个最小 dict 手动验证递归边界。", "分别考虑 dict、list、普通叶节点与 bool。", "参考实现已解锁；载入后请逐行解释递归出口，再运行三项测试。"],
        }
    return labs


if __name__ == "__main__":
    PUBLIC_PATH.parent.mkdir(parents=True, exist_ok=True)
    implementations = export()
    PUBLIC_PATH.write_text(json.dumps(implementations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    export_data_previews()
    export_guided_labs()
    print(f"Exported {len(implementations)} lesson implementations to {PUBLIC_PATH}")
