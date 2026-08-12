"use client";

import { Check, GitCompareArrows, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ResultVisualization from "@/components/ResultVisualization";
import { ExperimentRecord, readExperiments, removeExperiment, renameExperiment, RESEARCH_EVENT } from "@/data/researchStore";

export default function ExperimentHistory({ lessonId, onRestore }: { lessonId: string; onRestore: (value:number,result:unknown,baseline:unknown)=>void }) {
  const [items,setItems]=useState<ExperimentRecord[]>([]); const [selected,setSelected]=useState<string[]>([]);
  const reload=()=>setItems(readExperiments().filter(item=>item.lessonId===lessonId));
  useEffect(()=>{ reload(); window.addEventListener(RESEARCH_EVENT,reload); return()=>window.removeEventListener(RESEARCH_EVENT,reload); },[lessonId]);
  const compared=useMemo(()=>items.filter(item=>selected.includes(item.id)),[items,selected]);
  if (!items.length) return null;
  return <div className="experiment-history"><div className="history-heading"><span><GitCompareArrows size={14}/><b>实验档案</b><small>{items.length} 次运行 · 最多选择 2 项比较</small></span></div><div className="history-list">{items.slice(0,8).map(item=><article className={selected.includes(item.id)?"selected":""} key={item.id}><button className="history-check" onClick={()=>setSelected(current=>current.includes(item.id)?current.filter(id=>id!==item.id):current.length<2?[...current,item.id]:[current[1],item.id])}>{selected.includes(item.id)&&<Check size={10}/>}</button><div><b>{item.name}</b><small>{new Date(item.createdAt).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})} · {item.parameter} {item.unit}</small></div><button title="重命名" onClick={()=>{const name=window.prompt("实验名称",item.name);if(name?.trim())renameExperiment(item.id,name.trim());}}><Pencil size={11}/></button><button title="恢复" onClick={()=>onRestore(item.parameter,item.result,item.baseline)}><RotateCcw size={11}/></button><button title="删除" onClick={()=>removeExperiment(item.id)}><Trash2 size={11}/></button></article>)}</div>{compared.length===2&&<div className="history-comparison"><div><span>{compared[0].name}</span><b>{compared[0].parameter} {compared[0].unit}</b><i>VS</i><b>{compared[1].parameter} {compared[1].unit}</b><span>{compared[1].name}</span></div><ResultVisualization result={compared[1].result} baseline={compared[0].result}/></div>}</div>;
}
