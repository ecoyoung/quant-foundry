"use client";

import { Archive, Code2, Download, FileText, FlaskConical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { allLessons } from "@/data/course";
import { CodeRunRecord, ExperimentRecord, readCodeRuns, readExperiments, RESEARCH_EVENT } from "@/data/researchStore";

type ProjectDraft = { thesis:string; method:string; risk:string };
const projectIds=["m1l8","m2l10","m3l9","m4l11","m5l8","m6l7"];

function download(name:string,content:string,type:string) { const url=URL.createObjectURL(new Blob([content],{type})); const anchor=document.createElement("a");anchor.href=url;anchor.download=name;anchor.click();URL.revokeObjectURL(url); }

export default function ResearchWorkbench({ completedIds }: { completedIds:string[] }) {
  const [runs,setRuns]=useState<CodeRunRecord[]>([]); const [experiments,setExperiments]=useState<ExperimentRecord[]>([]); const [projects,setProjects]=useState<{id:string;draft:ProjectDraft}[]>([]);
  const refresh=()=>{setRuns(readCodeRuns());setExperiments(readExperiments());setProjects(projectIds.flatMap(id=>{const raw=localStorage.getItem(`quant-stage-project-v2-${id}`);if(!raw)return[];try{return[{id,draft:JSON.parse(raw) as ProjectDraft}]}catch{return[]}}));};
  useEffect(()=>{refresh();window.addEventListener(RESEARCH_EVENT,refresh);return()=>window.removeEventListener(RESEARCH_EVENT,refresh);},[]);
  const verified=runs.filter(run=>run.verified).length; const latest=experiments[0];
  const markdown=useMemo(()=>buildMarkdown(completedIds,runs,experiments,projects),[completedIds,runs,experiments,projects]);
  return <section className="research-workbench" id="workbench"><div className="workbench-head"><div><p className="section-kicker">个人量化研究工作台</p><h2>把每次运行，沉淀成研究证据。</h2><p>代码、参数实验与阶段项目只保存在当前浏览器，可随时导出为独立研究档案。</p></div><div><button onClick={()=>download("quant-research-dossier.md",markdown,"text/markdown;charset=utf-8")}><Download size={14}/> 导出 Markdown</button><button onClick={()=>download("quant-research-dossier.html",buildHtml(markdown),"text/html;charset=utf-8")}><FileText size={14}/> 导出 HTML</button></div></div><div className="workbench-stats"><article><Code2/><span>代码运行</span><strong>{runs.length}</strong><small>{verified} 次通过固定快照</small></article><article><FlaskConical/><span>参数实验</span><strong>{experiments.length}</strong><small>{latest?`最近：${latest.name}`:"运行实验后自动形成记录"}</small></article><article><Archive/><span>阶段档案</span><strong>{projects.length}<i>/6</i></strong><small>{completedIds.length}/53 节课程完成</small></article></div>{experiments.length>0&&<div className="workbench-recent"><span>最近实验</span>{experiments.slice(0,5).map(item=><div key={item.id}><b>{item.lessonId.toUpperCase()}</b><p>{item.name}</p><i>{item.parameter} {item.unit}</i><small>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</small></div>)}</div>}</section>;
}

function buildMarkdown(completed:string[],runs:CodeRunRecord[],experiments:ExperimentRecord[],projects:{id:string;draft:ProjectDraft}[]) {
  const lines=["# 个人量化研究档案","",`生成时间：${new Date().toLocaleString("zh-CN")}`,`课程进度：${completed.length} / ${allLessons.length}`,`代码运行：${runs.length} 次；通过：${runs.filter(item=>item.verified).length} 次`,`参数实验：${experiments.length} 次`,"","## 六阶段研究记录",""];
  for(const id of projectIds){const project=projects.find(item=>item.id===id);const lesson=allLessons.find(item=>item.id===id);lines.push(`### ${lesson?.title??id}`,project?`**命题**：${project.draft.thesis}\n\n**方法**：${project.draft.method}\n\n**风险与限制**：${project.draft.risk}`:"尚未完成。","");}
  lines.push("## 参数实验日志","");for(const item of experiments){lines.push(`### ${item.name}`,`- 课程：${item.lessonId}` ,`- 参数：${item.parameter} ${item.unit}`,`- 时间：${item.createdAt}`,"```json",JSON.stringify(item.result,null,2),"```","");}
  lines.push("## 最近代码运行","");for(const item of runs.slice(0,20)){lines.push(`### ${item.lessonId} · ${item.verified?"已验证":"未通过"}`,"```python",item.code,"```","```json",JSON.stringify(item.result,null,2),"```","");}
  lines.push("---","教育用途，不构成投资建议。");return lines.join("\n");
}
function buildHtml(markdown:string){const escaped=markdown.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>个人量化研究档案</title><style>body{max-width:900px;margin:60px auto;padding:0 28px;color:#252823;background:#f2efe7;font:16px/1.75 Georgia,serif}pre{padding:24px;white-space:pre-wrap;border:1px solid #bbb5a7;background:#fff}</style><pre>${escaped}</pre></html>`;}
