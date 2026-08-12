import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.3/full/pyodide.mjs";

const ASSETS = [
  "common.py",
  "cases.py",
  "data/daily_ohlcv.csv",
  "data/minute_ohlcv.csv",
  "data/factor_panel.csv",
  "data/orders.csv",
];

let runtimePromise;
let queue = Promise.resolve();

async function prepareRuntime(report = () => {}) {
  report("正在下载 Python 核心", 12);
  const pyodide = await loadPyodide();
  report("正在加载 NumPy 与 pandas", 38);
  await pyodide.loadPackage(["numpy", "pandas"]);
  pyodide.FS.mkdirTree("/courseware/data");

  report("正在挂载课程代码与固定数据", 68);
  await Promise.all(ASSETS.map(async (asset) => {
    const response = await fetch(`/course-assets/${asset}`);
    if (!response.ok) throw new Error(`无法读取课程资源：${asset}`);
    pyodide.FS.writeFile(`/courseware/${asset}`, new Uint8Array(await response.arrayBuffer()));
  }));

  pyodide.runPython("import sys\nif '/courseware' not in sys.path: sys.path.insert(0, '/courseware')");
  report("运行环境已就绪", 100);
  return pyodide;
}

async function execute(event) {
  const { id, code } = event.data;
  try {
    runtimePromise ??= prepareRuntime((label, progress) => self.postMessage({ id, phase: "loading", label, progress }));
    self.postMessage({ id, phase: "loading", label: "准备可复现环境", progress: runtimePromise ? 8 : 0 });
    const pyodide = await runtimePromise;
    const output = [];
    pyodide.setStdout({ batched: (text) => output.push(text) });
    pyodide.setStderr({ batched: (text) => output.push(text) });
    self.postMessage({ id, phase: "running", label: "正在执行 Python", progress: 100 });
    const value = await pyodide.runPythonAsync(code);
    self.postMessage({
      id,
      phase: "complete",
      output: output.join("\n") || (value == null ? "运行完成（无输出）" : String(value)),
    });
  } catch (error) {
    self.postMessage({
      id,
      phase: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

self.onmessage = (event) => {
  queue = queue.then(() => execute(event));
};
