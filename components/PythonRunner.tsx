"use client";

import { AlertTriangle, Check, CheckCircle2, ChevronDown, Code2, Copy, Database, ExternalLink, LoaderCircle, MapPin, Play, RotateCcw, Save, Square, Table2, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCallback } from "react";
import GuidedPractice from "@/components/GuidedPractice";
import ParameterExperiment from "@/components/ParameterExperiment";
import ResultVisualization from "@/components/ResultVisualization";
import CodeEditor from "@/components/CodeEditor";
import { saveCodeRun } from "@/data/researchStore";

type Phase = "idle" | "loading" | "running" | "complete" | "error";
type CodeView = "wrapper" | "source" | "data";
type DependencySource = { file: string; start: number; end: number; source: string };
type Implementation = { title: string; source: string; location: { file: string; function: string; start: number; end: number }; dependencies: string[]; dependencySources: Record<string, DependencySource> };
type DataPreview = { filename: string; rows: number; columns: string[]; dictionary: Record<string, string>; preview: Record<string, string>[] };

type PythonRunnerProps = {
  lessonId: string;
  initialCode: string;
  dataFile?: string;
  onVerified: (verified: boolean) => void;
};

function equalResult(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "number" && typeof expected === "number") return Math.abs(actual - expected) <= 1e-8 * Math.max(1, Math.abs(expected));
  if (Array.isArray(actual) && Array.isArray(expected)) return actual.length === expected.length && actual.every((value, index) => equalResult(value, expected[index]));
  if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    const a = actual as Record<string, unknown>;
    const b = expected as Record<string, unknown>;
    const keys = Object.keys(b);
    return keys.length === Object.keys(a).length && keys.every((key) => key in a && equalResult(a[key], b[key]));
  }
  return actual === expected;
}

function firstDifference(actual: unknown, expected: unknown, path = "result"): string | null {
  if (typeof actual === "number" && typeof expected === "number") return equalResult(actual, expected) ? null : `${path}: 期望 ${expected}，实际 ${actual}`;
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return `${path}: 期望 ${expected.length} 项，实际 ${actual.length} 项`;
    for (let index = 0; index < expected.length; index += 1) { const found = firstDifference(actual[index], expected[index], `${path}[${index}]`); if (found) return found; }
    return null;
  }
  if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    const a = actual as Record<string, unknown>; const b = expected as Record<string, unknown>;
    for (const key of Object.keys(b)) { if (!(key in a)) return `${path}.${key}: 输出缺少该字段`; const found = firstDifference(a[key], b[key], `${path}.${key}`); if (found) return found; }
    const extra = Object.keys(a).find((key) => !(key in b)); return extra ? `${path}.${extra}: 标准输出中没有该字段` : null;
  }
  return actual === expected ? null : `${path}: 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`;
}

export default function PythonRunner({ lessonId, initialCode, dataFile = "daily_ohlcv.csv", onVerified }: PythonRunnerProps) {
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const [wrapperCode, setWrapperCode] = useState(initialCode);
  const [implementation, setImplementation] = useState<Implementation | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [view, setView] = useState<CodeView>("wrapper");
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState("等待运行。首次启动需下载约 20 MB 的 Python、NumPy 与 pandas 运行环境。");
  const [verified, setVerified] = useState(false);
  const [guidedPassed, setGuidedPassed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [diagnostic, setDiagnostic] = useState("");
  const [parsedResult, setParsedResult] = useState<unknown>(null);
  const [errorLine,setErrorLine]=useState<number|null>(null);
  const [runtimeProgress,setRuntimeProgress]=useState(0);
  const [runtimeLabel,setRuntimeLabel]=useState("");
  const draftKey = `quant-course-code-draft-v1-${lessonId}`;
  const modified = wrapperCode !== initialCode;

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftKey);
    setWrapperCode(savedDraft ?? initialCode);
    setImplementation(null);
    setDataPreview(null);
    setView("wrapper");
    setPhase("idle");
    setVerified(false);
    setDiagnostic("");
    setParsedResult(null);
    setErrorLine(null);
    const savedRuntime=window.localStorage.getItem(`quant-last-runtime-v1-${lessonId}`);
    if(savedRuntime){try{const last=JSON.parse(savedRuntime);setOutput(last.output);setParsedResult(last.result??null);setPhase(last.phase??"complete");}catch{setOutput("等待运行。首次启动需下载约 20 MB 的 Python、NumPy 与 pandas 运行环境。");}}else setOutput("等待运行。首次启动需下载约 20 MB 的 Python、NumPy 与 pandas 运行环境。");
    setGuidedPassed(window.localStorage.getItem(`quant-guided-pass-v1-${lessonId}`) === "true");
    fetch("/course-assets/implementations.json").then((response) => response.json()).then((items: Record<string, Implementation>) => {
      const item = items[lessonId] ?? null;
      setImplementation(item);
    }).catch(() => setImplementation(null));
    fetch("/course-assets/data-previews.json").then((response) => response.json()).then((items: Record<string, DataPreview>) => setDataPreview(items[dataFile] ?? null)).catch(() => setDataPreview(null));
  }, [dataFile, draftKey, initialCode, lessonId, onVerified]);

  useEffect(() => onVerified(verified && guidedPassed), [guidedPassed, onVerified, verified]);
  const handleGuidedPassed = useCallback((passed: boolean) => setGuidedPassed(passed), []);

  useEffect(() => () => { workerRef.current?.terminate(); if(timeoutRef.current)window.clearTimeout(timeoutRef.current); }, []);

  async function verify(text: string) {
    try {
      const expected = await fetch(`/course-assets/outputs/${lessonId}.json`).then((response) => response.json());
      const actual = JSON.parse(text);
      setParsedResult(actual);
      const passed = equalResult(actual, expected);
      setVerified(passed);
      setDiagnostic(passed ? "所有字段、数组长度与数值均通过固定快照校验。" : firstDifference(actual, expected) ?? semanticDiagnostic(wrapperCode) ?? "输出结构与标准结果不同。");
      saveCodeRun({lessonId,code:wrapperCode,result:actual,verified:passed});
    } catch {
      setVerified(false);
      setParsedResult(null);
      setDiagnostic("输出不是有效 JSON。请确保最后只打印一次 json.dumps(result)。");
    }
  }

  function run() {
    const runCode = wrapperCode;
    workerRef.current ??= new Worker("/python-worker.mjs", { type: "module" });
    const id = ++requestRef.current;
    setPhase("loading");
    setVerified(false);
    setDiagnostic("");
    setParsedResult(null);
    setErrorLine(null);
    setOutput("正在准备运行环境…");
    setRuntimeProgress(4);setRuntimeLabel("准备运行环境");
    if(timeoutRef.current)window.clearTimeout(timeoutRef.current);
    timeoutRef.current=window.setTimeout(()=>cancelRun("运行超过 45 秒，已自动终止。可重新启动环境后再试。"),45000);
    workerRef.current.onmessage = (event) => {
      if (event.data.id !== id) return;
      const next = event.data.phase as Phase;
      setPhase(next);
      if (next === "loading") {setOutput(event.data.label??"正在加载 Python 与科学计算包…");setRuntimeLabel(event.data.label??"加载运行环境");setRuntimeProgress(event.data.progress??15);}
      if (next === "running") {setOutput("运行当前编辑器中的代码…");setRuntimeLabel("执行 Python");setRuntimeProgress(100);}
      if (next === "complete") { if(timeoutRef.current)window.clearTimeout(timeoutRef.current);setOutput(event.data.output);setRuntimeLabel("运行完成"); void verify(event.data.output); try{window.localStorage.setItem(`quant-last-runtime-v1-${lessonId}`,JSON.stringify({phase:"complete",output:event.data.output,result:JSON.parse(event.data.output)}));}catch{/* 非 JSON 输出不缓存结果 */} }
      if (next === "error") { if(timeoutRef.current)window.clearTimeout(timeoutRef.current);const message=String(event.data.error); setOutput(message); setErrorLine(extractErrorLine(message,wrapperCode)); setDiagnostic(classifyError(message,wrapperCode)); saveCodeRun({lessonId,code:wrapperCode,result:{error:message},verified:false}); }
    };
    workerRef.current.postMessage({ id, code: runCode });
  }

  function cancelRun(message="本次运行已取消。") { if(timeoutRef.current)window.clearTimeout(timeoutRef.current);workerRef.current?.terminate();workerRef.current=null;requestRef.current+=1;setPhase("idle");setRuntimeProgress(0);setRuntimeLabel("");setOutput(message);setDiagnostic("运行环境已释放。点击“运行封装代码”会建立一个干净的新环境。"); }

  const busy = phase === "loading" || phase === "running";

  async function copyVisibleCode() {
    await navigator.clipboard.writeText(view === "source" ? implementation?.source ?? "" : wrapperCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return <div className="python-lab">
    <div className="code-view-tabs" role="tablist" aria-label="代码与数据视图">
      <button className={view === "wrapper" ? "active" : ""} onClick={() => setView("wrapper")} role="tab"><b>封装调用</b><small>可编辑、可直接运行</small></button>
      <button className={view === "source" ? "active" : ""} onClick={() => setView("source")} role="tab"><b>源码定位</b><small>{implementation?.location.function ?? "cases.py 分支"}</small></button>
      <button className={view === "data" ? "active" : ""} onClick={() => setView("data")} role="tab"><b>本课数据</b><small>{dataFile}</small></button>
      <a href="/course-assets/common.py" target="_blank"><b>共享工具</b><small>加载器与指标函数</small><ExternalLink size={11} /></a>
    </div>
    <div className="python-toolbar">
      <span><i /><i /><i /><b>{view === "wrapper" ? "封装调用 · Pyodide 314.0.3" : view === "source" ? implementation?.title ?? "正在定位源码…" : `数据预览 · ${dataFile}`}</b></span>
      {view !== "data" && <button onClick={copyVisibleCode}>{copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "已复制" : "复制"}</button>}
      {view === "wrapper" && <button onClick={() => setWrapperCode(initialCode)} disabled={busy}><RotateCcw size={12} /> 重置</button>}
      {view === "wrapper" && busy && <button onClick={()=>cancelRun()}><Square size={12} fill="currentColor"/>取消</button>}
      {view === "wrapper" && <button className="run-python" onClick={run} disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : <Play size={14} fill="currentColor" />} {busy ? "运行中" : "运行封装代码"}</button>}
    </div>
    {busy&&<div className="runtime-progress"><span><b>{runtimeLabel}</b><i>{runtimeProgress}%</i></span><em><b style={{width:`${runtimeProgress}%`}}/></em><small>最长运行 45 秒 · 可随时取消并释放环境</small></div>}
    {view === "wrapper" && <div className={`draft-status ${modified ? "modified" : "standard"}`}><span>{modified ? <Save size={12} /> : <CheckCircle2 size={12} />}<b>{modified ? "我的版本" : "标准版本"}</b><small>{modified ? "修改已自动保存到本机" : "当前代码与课程标准入口一致"}</small></span>{modified && <button onClick={() => { setWrapperCode(initialCode); window.localStorage.removeItem(draftKey); }}>恢复标准版本</button>}</div>}
    {view === "wrapper" && <CodeEditor label="封装调用代码" lessonId={lessonId} standardValue={initialCode} onRun={run} value={wrapperCode} errorLine={errorLine} onChange={(value)=>{setWrapperCode(value);window.localStorage.setItem(draftKey,value);setErrorLine(null);}}/>}
    {view === "source" && <SourceInspector implementation={implementation} />}
    {view === "data" && <DataInspector data={dataPreview} />}
    <div className="code-relationship"><i>{view === "wrapper" ? "可编辑" : view === "source" ? "只读源码" : "固定数据"}</i><p>{view === "wrapper" ? `run_case(\"${lessonId}\") 会沿路由进入“源码定位”展示的唯一分支。` : view === "source" ? "这里展示封装调用实际执行的模块初始化与课程分支，不再需要在整个 cases.py 中搜索。" : "预览显示前 5 行；完整 CSV 可下载，字段含义来自本地数据字典。"}</p></div>
    <div className={`python-output ${phase} ${verified ? "verified" : ""}`}>
      <div><Terminal size={14} /><b>输出</b><span>{verified ? <><CheckCircle2 size={13} /> 与固定快照一致</> : phase === "complete" ? <><AlertTriangle size={13} /> 输出已变化，请检查</> : null}</span></div>
      <pre>{output}</pre>
    </div>
    {diagnostic && <div className={`run-diagnostic ${verified ? "passed" : "attention"}`}><b>{verified ? "校验说明" : phase === "error" ? "错误诊断" : "首个差异"}</b><p>{diagnostic}</p></div>}
    {parsedResult !== null && <ResultVisualization result={parsedResult} lessonId={lessonId} />}
    {phase === "error" && <p className="runtime-fallback">代码执行失败。输出区保留了 Python 错误类型与行号；可重置代码，或下载实践包在本机调试。</p>}
    <div className="practice-gate"><span className={verified ? "done" : ""}>{verified ? <Check size={11} /> : "1"} 标准案例</span><i /><span className={guidedPassed ? "done" : ""}>{guidedPassed ? <Check size={11} /> : "2"} 分步练习</span><i /><b>{verified && guidedPassed ? "实践完成" : "两项通过后解锁"}</b></div>
    <GuidedPractice lessonId={lessonId} onPassed={handleGuidedPassed} />
    <ParameterExperiment lessonId={lessonId} />
  </div>;
}

function SourceInspector({ implementation }: { implementation: Implementation | null }) {
  const [openDependency, setOpenDependency] = useState("");
  if (!implementation) return <div className="source-inspector loading"><LoaderCircle className="spin" size={16} /> 正在解析 cases.py…</div>;
  return <div className="source-inspector">
    <div className="source-route"><MapPin size={14} /><span><b>{implementation.location.file}</b><small>{implementation.location.function} · 第 {implementation.location.start}–{implementation.location.end} 行</small></span><i>run_case → {implementation.location.function} → 本课分支</i></div>
    <pre>{implementation.source}</pre>
    <div className="dependency-map"><Code2 size={13} /><b>本分支依赖</b>{implementation.dependencies.map((name) => <button className={openDependency === name ? "active" : ""} onClick={() => setOpenDependency((current) => current === name ? "" : name)} key={name}>{name}<ChevronDown size={9} /></button>)}<a href="/course-assets/common.py" target="_blank">打开完整文件 <ExternalLink size={10} /></a></div>
    {openDependency && <DependencyDrawer name={openDependency} dependency={implementation.dependencySources[openDependency]} />}
  </div>;
}

function DependencyDrawer({ name, dependency }: { name: string; dependency?: DependencySource }) {
  if (!dependency) return null;
  return <div className="dependency-drawer"><div><b>{name}</b><span>{dependency.file}{dependency.start ? ` · 第 ${dependency.start}–${dependency.end} 行` : ""}</span></div><pre>{dependency.source}</pre></div>;
}

function extractErrorLine(message:string,code:string):number|null {
  const matches=[...message.matchAll(/line (\d+)/g)].map(match=>Number(match[1])).filter(line=>line<=code.split("\n").length); return matches.at(-1)??null;
}

function classifyError(message: string, code = ""): string {
  if (message.includes("SyntaxError")) return "语法错误：查看 Traceback 最后一行和箭头位置，通常是括号、引号或缩进未闭合。";
  if (message.includes("NameError")) return "名称错误：使用了尚未定义或未导入的变量，请核对拼写与执行顺序。";
  if (message.includes("FileNotFoundError")) return "数据路径错误：本课固定数据未在预期目录找到，可切换到“本课数据”确认文件名。";
  if (message.includes("ModuleNotFoundError")) return "依赖错误：当前浏览器环境没有找到导入模块，请恢复标准版本后重试。";
  if (/shift\s*\(\s*-\d+/.test(code)) return "未来信息风险：负数 shift 会把未来数据移动到当前行。若这是特征，请改用正滞后；若是标签，请确保只在训练目标中使用。";
  if (/fillna\s*\(\s*0/.test(code) && /price|close/i.test(code)) return "价格口径风险：把价格缺失直接填零会制造巨大虚假收益。先解释停牌、上市日期或数据缺口，再选择处理规则。";
  if (/std\s*\(\s*\)/.test(code) && /np\.|numpy/.test(code)) return "自由度检查：NumPy 的 std() 默认 ddof=0；估计样本波动时通常需要显式写 ddof=1。";
  if (/sort_values|sort_index/.test(code)===false && /pct_change|rolling|shift/.test(code)) return "时间顺序检查：时间序列运算前没有看到显式排序。请确认索引按交易时间升序且没有重复时间键。";
  if (/weights/.test(code) && !/sum|div|normalize/.test(code)) return "权重约束检查：代码中出现权重，但没有看到归一化或权重和审计。请检查净敞口与总敞口。";
  if (/cost/.test(code) && /gross\s*\+/.test(code)) return "成本方向风险：交易成本应从毛收益中扣减，而不是相加。";
  return "Python 已返回异常。请从 Traceback 最后一行读取错误类型，再向上找到你的代码行号。";
}

function semanticDiagnostic(code:string):string|null {
  if (/shift\s*\(\s*-\d+/.test(code)) return "未来信息风险：负数 shift 会把未来数据移动到当前行；只有构造训练标签时才应这样使用。";
  if (/fillna\s*\(\s*0/.test(code) && /price|close/i.test(code)) return "价格口径风险：价格缺失直接填零会制造虚假跳跃。";
  if (/gross\s*\+.*cost|cost.*\+.*gross/.test(code)) return "成本方向风险：交易成本应从毛收益中扣减。";
  if (/pct_change|rolling|shift/.test(code) && !/sort_values|sort_index|run_case/.test(code)) return "时间顺序检查：时间序列运算前请显式确认索引升序且无重复。";
  return null;
}

function DataInspector({ data }: { data: DataPreview | null }) {
  if (!data) return <div className="data-inspector loading"><LoaderCircle className="spin" size={16} /> 正在读取本课数据…</div>;
  const visible = data.columns.slice(0, 7);
  return <div className="data-inspector">
    <div className="data-summary"><span><Database size={15} /><b>{data.filename}</b></span><i>{data.rows.toLocaleString()} 行</i><i>{data.columns.length} 列</i><a href={`/course-assets/data/${data.filename}`} download>下载完整 CSV <ExternalLink size={11} /></a></div>
    <div className="data-table-wrap"><table><thead><tr>{visible.map((column) => <th key={column}>{column}<small>{data.dictionary[column]}</small></th>)}</tr></thead><tbody>{data.preview.map((row, index) => <tr key={index}>{visible.map((column) => <td key={column}>{row[column]}</td>)}</tr>)}</tbody></table></div>
    {data.columns.length > visible.length && <p className="hidden-columns"><Table2 size={12} /> 另有 {data.columns.length - visible.length} 个字段：{data.columns.slice(visible.length).join("、")}</p>}
  </div>;
}
