"use client";

import { Check, CheckCircle2, FileText, Link2, Save, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PythonRunner from "@/components/PythonRunner";
import { browserCodeFor } from "@/data/moduleOneStudio";

type Draft = { thesis: string; method: string; risk: string };
type ProjectConfig = { number: string; title: string; subtitle: string; fields: [string, string, number, string][] };

const projects: Record<string, ProjectConfig> = {
  m1l8:{number:"01",title:"价格研究笔记",subtitle:"把数据口径、指标与局限连成第一份可复现研究记录。",fields:[["研究问题","提出清晰、可证伪的问题。",30,"例：复权后，五只资产的风险收益差异是否稳定？"],["方法与证据","交代数据、计算和比较方法。",60,"写清数据文件、日期范围、收益率定义和评估指标。"],["局限与下一步","主动说明偏差及后续验证。",40,"讨论合成数据、样本长度、成本或幸存者偏差。"]]},
  m2l10:{number:"02",title:"组合风险报告",subtitle:"用分布、相关性与尾部指标解释风险来自哪里。",fields:[["风险结论","给出可被数据推翻的核心判断。",30,"哪项风险主导组合，证据是什么？"],["估计与压力方法","说明波动、相关、VaR 与压力情景口径。",60,"写明置信水平、窗口、分布假设和组合权重。"],["模型风险","说明估计误差与厚尾局限。",40,"哪些假设失效会让风险被低估？"]]},
  m3l9:{number:"03",title:"因子研究报告",subtitle:"把特征、信号、IC 与经济解释组织成研究证据链。",fields:[["因子假设","解释信号为何可能获得溢价。",30,"给出机制和可证伪预测。"],["构造与验证","说明特征滞后、标准化、IC 和分组检验。",60,"明确如何避免未来信息。"],["失效条件","记录拥挤、换手和结构变化风险。",40,"在哪些市场状态下信号可能失效？"]]},
  m4l11:{number:"04",title:"成本后策略回测",subtitle:"从信号、仓位到成交成本，完成可交易性闭环。",fields:[["策略规则","精确定义入场、持有与退出。",30,"规则必须能直接转成代码。"],["回测与执行","说明权重、约束、成本和调仓机制。",60,"区分毛收益、换手、成本与净收益。"],["容量与偏差","讨论冲击、流动性和回测偏差。",40,"指出何种资金规模会让策略失效。"]]},
  m5l8:{number:"05",title:"样本外验证档案",subtitle:"用时序切分和稳健性检查决定策略是否晋级。",fields:[["晋级标准","在看结果前定义通过门槛。",30,"明确样本外收益、风险与稳定性阈值。"],["验证设计","交代隔离窗口、滚动折与参数冻结。",60,"说明训练、验证、测试各自职责。"],["过拟合审计","记录尝试次数与失败结果。",40,"讨论多重检验和研究者自由度。"]]},
  m6l7:{number:"06",title:"上线运行手册",subtitle:"把限制、订单状态、监控和应急响应变成操作清单。",fields:[["上线条件","定义允许启动与必须停止的条件。",30,"列出风险预算、数据和执行健康阈值。"],["运行与监控","说明订单状态机、指标和告警责任。",60,"覆盖拒单、部分成交、延迟和对账。"],["事故预案","给出降级、熔断、恢复和复盘步骤。",40,"确保每种异常都有明确责任与证据。"]]},
};

const emptyDraft: Draft = { thesis: "", method: "", risk: "" };

export default function ProjectWorkspace({ lessonId, dataFile, onVerified }: { lessonId: string; dataFile: string; onVerified: (verified: boolean) => void }) {
  const config = projects[lessonId] ?? projects.m1l8;
  const storageKey = `quant-stage-project-v2-${lessonId}`;
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [codePassed, setCodePassed] = useState(false);
  const [priorProjects, setPriorProjects] = useState<{ id: string; title: string; draft: Draft }[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey); if (saved) setDraft({ ...emptyDraft, ...JSON.parse(saved) });
      const projectIds = Object.keys(projects); const currentIndex = projectIds.indexOf(lessonId);
      setPriorProjects(projectIds.slice(0, currentIndex).flatMap((id) => { const raw=window.localStorage.getItem(`quant-stage-project-v2-${id}`); if (!raw) return []; try { return [{ id, title: projects[id].title, draft: { ...emptyDraft, ...JSON.parse(raw) } }]; } catch { return []; } }));
    } catch { /* 保留空草稿 */ }
    setReady(true);
  }, [storageKey]);
  useEffect(() => { if (ready) window.localStorage.setItem(storageKey, JSON.stringify(draft)); }, [draft, ready, storageKey]);

  const values = [draft.thesis, draft.method, draft.risk];
  const criteria = useMemo(() => [
    ...config.fields.map((field, index) => ({ label: field[1], passed: values[index].trim().length >= field[2], score: [20,25,20][index] })),
    { label: "标准案例与分步练习均通过", passed: codePassed, score: 35 },
  ], [codePassed, config, values]);
  const score = criteria.reduce((total, item) => total + (item.passed ? item.score : 0), 0);
  const passed = score >= 80 && codePassed;
  useEffect(() => onVerified(passed), [onVerified, passed]);

  function update(field: keyof Draft, value: string) { setDraft((current) => ({ ...current, [field]: value })); }
  const fieldKeys: (keyof Draft)[] = ["thesis", "method", "risk"];

  return <div className="project-workspace">
    <div className="project-intro"><div><FileText size={22}/><span><b>阶段项目 {config.number} · {config.title}</b><small>{config.subtitle}</small></span></div><span className="autosave"><Save size={12}/> {ready ? "已自动保存" : "读取草稿…"}</span></div>
    {priorProjects.length > 0 && <div className="project-continuity"><div><Link2 size={14}/><span><b>研究链已承接 {priorProjects.length} 个阶段成果</b><small>前序命题与风险边界只读展示，用于保持研究口径一致。</small></span></div><div>{priorProjects.map((item) => <article key={item.id}><i>{item.id.toUpperCase()}</i><b>{item.title}</b><p>{item.draft.thesis || "尚未填写研究结论"}</p><small>{item.draft.risk || "尚未记录风险边界"}</small></article>)}</div></div>}
    <div className="research-form">{config.fields.map(([label,, minimum, placeholder], index) => <label key={label}><span>0{index+1} / {label} <i>{values[index].trim().length}/{minimum}+</i></span><textarea value={values[index]} onChange={(event) => update(fieldKeys[index], event.target.value)} placeholder={placeholder}/></label>)}</div>
    <PythonRunner lessonId={lessonId} dataFile={dataFile} initialCode={browserCodeFor(lessonId)} onVerified={setCodePassed}/>
    <div className="project-grade"><div className="grade-score"><span>当前评分</span><strong>{score}<i>/100</i></strong><small>{passed ? "阶段项目已通过" : "80 分且实践通过后完成"}</small></div><div className="grade-rubric">{criteria.map((item) => <div className={item.passed ? "passed" : ""} key={item.label}><i>{item.passed ? <Check size={12}/> : <ShieldAlert size={12}/>}</i><span>{item.label}</span><b>+{item.score}</b></div>)}</div>{passed && <div className="project-pass"><CheckCircle2 size={17}/> 研究叙事、风险边界与可复现代码已形成闭环。</div>}</div>
    {lessonId === "m6l7" && <div className="strategy-dossier"><span>毕业策略档案</span><strong>{priorProjects.length + 1}<i>/6</i></strong><p>{priorProjects.length === 5 ? "六阶段研究证据已完整连接：数据、风险、因子、回测、验证与上线。" : `还缺 ${5-priorProjects.length} 个前序阶段项目；返回相应模块补齐后，这里会自动汇总。`}</p><div>{[...priorProjects.map(item=>item.title),config.title].map((title,index)=><i key={title}><Check size={10}/> 0{index+1} · {title}</i>)}</div></div>}
  </div>;
}
