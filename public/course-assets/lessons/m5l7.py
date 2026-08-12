"""量研课 m5l7：完整可运行案例。

数据：courseware/data；实现：courseware/cases.py。
"""
from pathlib import Path
import sys

COURSEWARE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(COURSEWARE))

from cases import run_case  # noqa: E402

if __name__ == "__main__":
    run_case("m5l7", print_result=True)
