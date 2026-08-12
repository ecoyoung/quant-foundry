"use client";

import { FlaskConical, LoaderCircle, Play, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ResultVisualization from "@/components/ResultVisualization";
import { lessonExperiments } from "@/data/lessonExperiments";
import ExperimentHistory from "@/components/ExperimentHistory";
import { saveExperiment } from "@/data/researchStore";

export default function ParameterExperiment({ lessonId }: { lessonId: string }) {
  const config = lessonExperiments[lessonId];
  const workerRef = useRef<Worker | null>(null);
  const [value, setValue] = useState(config?.standard ?? 0);
  const [result, setResult] = useState<unknown>(null);
  const [baseline, setBaseline] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (config) setValue(config.standard); setResult(null); setBaseline(null); }, [config]);
  useEffect(() => () => workerRef.current?.terminate(), []);

  function runCode(code: string, callback: (value: unknown) => void, id: number) {
    workerRef.current ??= new Worker("/python-worker.mjs", { type: "module" });
    workerRef.current.addEventListener("message", function listener(event) {
      if (event.data.id !== id || event.data.phase !== "complete") return;
      workerRef.current?.removeEventListener("message", listener);
      try { callback(JSON.parse(event.data.output)); } catch { callback(null); }
    });
    workerRef.current.postMessage({ id, code });
  }

  function runExperiment() {
    if (!config) return;
    setBusy(true);
    const stamp = Date.now();
    runCode(config.code(config.standard), setBaseline, stamp);
    runCode(config.code(value), (next) => { setResult(next); setBusy(false); }, stamp + 1);
  }

  function archiveExperiment() {
    if (result === null || !config) return;
    saveExperiment({ lessonId, name: `${config.label} · ${value} ${config.unit}`, parameter:value, unit:config.unit, label:config.label, result, baseline });
    setSaved(true); window.setTimeout(()=>setSaved(false),1400);
  }

  if (!config) return null;
  return <section className="parameter-experiment">
    <div className="experiment-heading"><FlaskConical size={17} /><span><b>本课参数实验 · {config.label}</b><small>{config.question}</small></span></div>
    <div className="experiment-control"><label><span>{config.label}</span><output>{value} {config.unit}</output><input type="range" min={config.min} max={config.max} step={config.step} value={value} onChange={(event) => setValue(Number(event.target.value))} /><small>标准：{config.standard} {config.unit}</small></label><button onClick={runExperiment} disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : <Play size={14} fill="currentColor" />} 运行个人实验</button></div>
    {result !== null && <><div className="experiment-result"><div><span>个人参数</span><b>{value} {config.unit}</b><small>条目旁的差值相对标准参数</small><button className="archive-experiment" onClick={archiveExperiment}><Save size={11}/>{saved?"已保存":"保存到实验档案"}</button></div><ResultVisualization result={result} baseline={baseline} lessonId={lessonId} /></div></>}
    <ExperimentHistory lessonId={lessonId} onRestore={(parameter,nextResult,nextBaseline)=>{setValue(parameter);setResult(nextResult);setBaseline(nextBaseline);}}/>
  </section>;
}
