from __future__ import annotations

import json
from pathlib import Path

from cases import run_case, run_experiment
from common import DATA_DIR, OUTPUT_DIR, sha256, write_output

CASES = [
    *[f"m1l{i}" for i in range(1, 9)],
    *[f"m2l{i}" for i in range(1, 11)],
    *[f"m3l{i}" for i in range(1, 10)],
    *[f"m4l{i}" for i in range(1, 12)],
    *[f"m5l{i}" for i in range(1, 9)],
    *[f"m6l{i}" for i in range(1, 8)],
]


def main() -> None:
    manifest = json.loads((DATA_DIR / "manifest.json").read_text(encoding="utf-8"))
    for filename, expected in manifest["files"].items():
        actual = sha256(DATA_DIR / filename)
        if actual != expected["sha256"]:
            raise AssertionError(f"Checksum mismatch: {filename}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    first_pass = {}
    for case_id in CASES:
        result = run_case(case_id)
        if not result:
            raise AssertionError(f"Empty result: {case_id}")
        first_pass[case_id] = result
        write_output(case_id, result)

    for case_id in CASES:
        if run_case(case_id) != first_pass[case_id]:
            raise AssertionError(f"Non-deterministic output: {case_id}")

    experiment_values = {
        1: [2, 1, 1, 100, 5, 5, 5, 252],
        2: [1000, 8, 20, 60, 95, 1000, 252, 50, -10, 95],
        3: [1, 5, 20, 250, 1, 60, 60, 20, 20],
        4: [50, 30, 5, 10, 20, 20, 100, 10, 50, 10, 10],
        5: [20, 5, 5, 20, 5, 10, .5, 20],
        6: [10, 5, 30, 3, 30, 70, 20],
    }
    experiments = 0
    for module, values in experiment_values.items():
        for lesson, value in enumerate(values, 1):
            case_id = f"m{module}l{lesson}"
            first = run_experiment(case_id, value)
            second = run_experiment(case_id, value)
            if not first or first != second:
                raise AssertionError(f"Invalid experiment: {case_id}")
            experiments += 1

    summary = {"cases": len(CASES), "experiments": experiments, "data_files": len(manifest["files"]), "deterministic": True, "status": "passed"}
    (OUTPUT_DIR / "verification_summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
