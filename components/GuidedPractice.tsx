"use client";

import { CheckCircle2, ChevronDown, Eye, FlaskConical, LoaderCircle, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Lab = { title: string; task: string; starter: string; answer: string; solution: string; hints: string[] };

export default function GuidedPractice({ lessonId, onPassed }: { lessonId: string; onPassed?: (passed: boolean) => void }) {
  const workerRef = useRef<Worker | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);
  const [code, setCode] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "passed" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const passed = window.localStorage.getItem(`quant-guided-pass-v1-${lessonId}`) === "true";
    setStatus(passed ? "passed" : "idle"); onPassed?.(passed);
    fetch("/course-assets/guided-labs.json").then((response) => response.json()).then((items: Record<string, Lab>) => { const next = items[lessonId]; setLab(next); setCode(window.localStorage.getItem(`quant-guided-lab-v1-${lessonId}`) ?? next.starter); });
  }, [lessonId, onPassed]);
  useEffect(() => () => workerRef.current?.terminate(), []);

  function run() {
    workerRef.current ??= new Worker("/python-worker.mjs", { type: "module" });
    setStatus("running"); setMessage("正在执行断言测试…");
    const id = Date.now();
    workerRef.current.onmessage = (event) => {
      if (event.data.id !== id) return;
      if (event.data.phase === "complete") { setStatus("passed"); setMessage("测试通过：你的代码准确复现了本课证据。"); window.localStorage.setItem(`quant-guided-pass-v1-${lessonId}`, "true"); onPassed?.(true); }
      if (event.data.phase === "error") { setStatus("error"); setMessage(event.data.error.includes("AssertionError") ? "断言没有通过。先查看运行结果，再按需打开下一条提示。" : event.data.error); }
    };
    workerRef.current.postMessage({ id, code });
  }

  if (!lab) return null;
  return <section className="guided-practice">
    <div className="lab-heading"><FlaskConical size={17} /><span><b>分步练习 · {lab.title}</b><small>{lab.task}</small></span><i>{status === "passed" ? "已通过" : "独立练习"}</i></div>
    <textarea spellCheck={false} value={code} onChange={(event) => { setCode(event.target.value); window.localStorage.setItem(`quant-guided-lab-v1-${lessonId}`, event.target.value); setStatus("idle"); window.localStorage.removeItem(`quant-guided-pass-v1-${lessonId}`); onPassed?.(false); }} />
    <div className="lab-actions"><button onClick={() => setHintCount((count) => Math.min(3, count + 1))}><ChevronDown size={12} /> {hintCount ? "下一条提示" : "需要提示"}</button>{hintCount >= 3 && <button onClick={() => { setCode(lab.solution); setStatus("idle"); }}><Eye size={12} /> 载入参考实现</button>}<button onClick={() => { setCode(lab.starter); setStatus("idle"); }}><RotateCcw size={12} /> 重置</button><button className="test-lab" onClick={run} disabled={status === "running"}>{status === "running" ? <LoaderCircle className="spin" size={13} /> : <Play size={13} fill="currentColor" />} 运行测试</button></div>
    {hintCount > 0 && <div className="hint-stack">{lab.hints.slice(0, hintCount).map((hint, index) => <p key={hint}><i>提示 {index + 1}</i>{hint}</p>)}</div>}
    {status !== "idle" && <div className={`lab-result ${status}`}>{status === "passed" && <CheckCircle2 size={15} />}<p>{message}</p></div>}
  </section>;
}
