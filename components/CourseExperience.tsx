"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileCode2,
  FlaskConical,
  LineChart,
  LockKeyhole,
  Play,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sigma,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProjectWorkspace from "@/components/ProjectWorkspace";
import PythonRunner from "@/components/PythonRunner";
import { allLessons, courseModules, getLesson } from "@/data/course";
import { browserCodeFor, moduleOneStudio } from "@/data/moduleOneStudio";
import ResearchWorkbench from "@/components/ResearchWorkbench";
import ReliabilityCenter from "@/components/ReliabilityCenter";
import PwaCenter from "@/components/PwaCenter";

const iconMap = { "01": Code2, "02": Sigma, "03": FlaskConical, "04": LineChart, "05": ShieldCheck, "06": BookOpen };
const stepLabels = ["理解概念", "完成实践", "检查理解"];
const STORAGE_KEY = "quant-research-course-progress-v1";

function goToLesson() {
  window.location.hash = "lesson";
}

export default function CourseExperience() {
  const [ready, setReady] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState("m1l1");
  const [openModule, setOpenModule] = useState("01");
  const [step, setStep] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [practiceDone, setPracticeDone] = useState(false);
  const [showExpected, setShowExpected] = useState(false);
  const [code, setCode] = useState(getLesson("m1l1").code);
  const [toast, setToast] = useState("");

  const current = getLesson(currentId);
  const currentIndex = allLessons.findIndex((lesson) => lesson.id === current.id);
  const currentModule = courseModules.find((module) => module.id === current.moduleId) ?? courseModules[0];
  const isCompleted = completedIds.includes(current.id);
  const quizCorrect = quizAnswer === current.quiz.answer;
  const nextLesson = allLessons[currentIndex + 1];
  const previousLesson = allLessons[currentIndex - 1];
  const coursePercent = Math.round((completedIds.length / allLessons.length) * 100);
  const dataFile = current.id === "m1l7" ? "minute_ohlcv.csv" : current.moduleId === "03" || current.moduleId === "05" ? "factor_panel.csv" : current.moduleId === "06" || ["m4l7"].includes(current.id) ? "orders.csv" : "daily_ohlcv.csv";
  const enrichment = moduleOneStudio[current.id];
  const setPracticeVerified = useCallback((verified: boolean) => setPracticeDone(verified), []);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const legacy: string[] = [];
    if (window.localStorage.getItem("quant-lab-l01") === "complete") legacy.push("m1l1");
    if (window.localStorage.getItem("quant-lab-l02") === "complete") legacy.push("m1l2");
    let parsed: string[] = [];
    try { parsed = saved ? JSON.parse(saved) : []; } catch { parsed = []; }
    const merged = [...new Set([...parsed, ...legacy])].filter((id) => allLessons.some((lesson) => lesson.id === id));
    setCompletedIds(merged);
    const firstIncomplete = allLessons.find((lesson) => !merged.includes(lesson.id));
    if (firstIncomplete) {
      setCurrentId(firstIncomplete.id);
      setOpenModule(firstIncomplete.moduleId);
      setCode(browserCodeFor(firstIncomplete.id));
    } else {
      setCurrentId(allLessons.at(-1)?.id ?? "m1l1");
      setOpenModule("06");
      setCode(browserCodeFor(allLessons.at(-1)?.id ?? "m1l1"));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
  }, [completedIds, ready]);

  function isUnlocked(index: number) {
    return index === 0 || completedIds.includes(allLessons[index - 1].id);
  }

  function selectLesson(id: string) {
    const index = allLessons.findIndex((lesson) => lesson.id === id);
    if (!isUnlocked(index)) return;
    const selected = getLesson(id);
    setCurrentId(id);
    setOpenModule(selected.moduleId);
    setStep(0);
    setQuizAnswer(null);
    setPracticeDone(false);
    setShowExpected(false);
    setCode(browserCodeFor(selected.id));
    goToLesson();
  }

  function finishLesson() {
    if (!practiceDone || !quizCorrect) return;
    setCompletedIds((ids) => ids.includes(current.id) ? ids : [...ids, current.id]);
    setToast(`第 ${current.number} 课已完成，进度已保存`);
    window.setTimeout(() => setToast(""), 2400);
  }

  function continueCourse() {
    if (nextLesson) selectLesson(nextLesson.id);
  }

  function resetCurrent() {
    setCompletedIds((ids) => ids.filter((id) => id !== current.id));
    setStep(0);
    setQuizAnswer(null);
    setPracticeDone(false);
    setShowExpected(false);
    setCode(browserCodeFor(current.id));
  }

  const moduleStats = useMemo(() => courseModules.map((module) => ({
    id: module.id,
    complete: module.lessons.filter((lesson) => completedIds.includes(lesson.id)).length,
    total: module.lessons.length,
  })), [completedIds]);

  return <>
    <div className={toast ? "save-toast show" : "save-toast"} aria-live="polite"><CheckCircle2 size={17} /> {toast}</div>

    <section className="course-dashboard" aria-label="课程进度">
      <div><span>总进度</span><strong>{completedIds.length}<i>/ {allLessons.length}</i></strong><small>已完成课程</small></div>
      <div><span>当前阶段</span><strong>M{currentModule.id}</strong><small>{currentModule.title}</small></div>
      <div><span>当前课程</span><strong>L{String(current.number).padStart(2, "0")}</strong><small>{current.title}</small></div>
      <button onClick={goToLesson}><Play size={15} fill="currentColor" /> {isCompleted ? "复习当前课程" : "继续学习"}</button>
      <div className="dashboard-progress"><i><b style={{ width: `${coursePercent}%` }} /></i><span>{coursePercent}%</span></div>
    </section>
    <ResearchWorkbench completedIds={completedIds}/>
    <ReliabilityCenter/>
    <PwaCenter/>

    <section className="roadmap" id="roadmap">
      <div className="section-heading"><div><p className="section-kicker">16 周 · 53 节课</p><h2>完整课程路径</h2></div><p>课程按顺序解锁。每节课包括概念、实践和检查题；阶段最后一课是一项可提交项目。</p></div>
      <div className="curriculum-list">
        {courseModules.map((module) => {
          const Icon = iconMap[module.id as keyof typeof iconMap];
          const stats = moduleStats.find((item) => item.id === module.id)!;
          const expanded = openModule === module.id;
          const firstGlobalIndex = allLessons.findIndex((lesson) => lesson.id === module.lessons[0].id);
          const moduleUnlocked = isUnlocked(firstGlobalIndex);
          return <article className={expanded ? "curriculum-module expanded" : "curriculum-module"} key={module.id}>
            <button className="curriculum-header" onClick={() => setOpenModule(expanded ? "" : module.id)} aria-expanded={expanded}>
              <span className="module-no">{module.id}</span><span className={`module-icon ${module.tone}`}><Icon size={20} /></span>
              <span className="module-title"><strong>{module.title}</strong><small>{module.subtitle}</small></span>
              <span className="module-project">项目 · {module.project}</span>
              <span className="module-count"><b>{stats.complete}/{stats.total}</b><small>{module.weeks}</small></span>
              {!moduleUnlocked ? <LockKeyhole size={16} /> : <ChevronDown className="module-chevron" size={20} />}
            </button>
            {expanded && <div className="lesson-catalog">{module.lessons.map((lesson) => {
              const globalIndex = allLessons.findIndex((item) => item.id === lesson.id);
              const unlocked = isUnlocked(globalIndex);
              const done = completedIds.includes(lesson.id);
              const active = current.id === lesson.id;
              return <button key={lesson.id} className={`${active ? "active " : ""}${done ? "done" : ""}`} disabled={!unlocked} onClick={() => selectLesson(lesson.id)}>
                <i>{done ? <Check size={12} /> : unlocked ? String(lesson.number).padStart(2, "0") : <LockKeyhole size={11} />}</i>
                <span><b>{lesson.title}</b><small>{lesson.duration} 分钟{lesson.title.includes("阶段项目") || lesson.title.includes("毕业项目") ? " · 项目课" : ""}</small></span>
                {unlocked && <ChevronRight size={14} />}
              </button>;
            })}</div>}
          </article>;
        })}
      </div>
    </section>

    <section className="today full-course" id="lesson">
      <div className="today-top"><div><p className="section-kicker light">学习器 · M{current.moduleId} / L{String(current.number).padStart(2, "0")}</p><h2>{current.title}</h2></div><div className="lesson-head-actions">{previousLesson && <button onClick={() => selectLesson(previousLesson.id)}><ArrowLeft size={14} /> 上一课</button>}<div className="lesson-time"><Clock3 size={17} /> {current.duration} 分钟 · 自动保存</div></div></div>
      <div className="lesson-workspace">
        <aside className="lesson-sidebar">
          <span className="lesson-sidebar-label">本课路径</span>
          {stepLabels.map((label, index) => <button key={label} className={index === step ? "active" : index < step || isCompleted ? "done" : ""} onClick={() => (index <= step || isCompleted) && setStep(index)} disabled={index > step && !isCompleted}>
            <i>{index < step || isCompleted ? <Check size={13} /> : `0${index + 1}`}</i><span><b>{label}</b><small>{index === 0 ? "概念与关键点" : index === 1 ? "Python / 研究任务" : "1 道检查题"}</small></span>
          </button>)}
          <div className="lesson-progress"><span><b>{isCompleted ? 100 : Math.round(((step + 1) / 3) * 100)}%</b> 本课进度</span><i><b style={{ width: `${isCompleted ? 100 : ((step + 1) / 3) * 100}%` }} /></i></div>
          {isCompleted && <button className="reset-course" onClick={resetCurrent}><RotateCcw size={13} /> 重置本课进度</button>}
        </aside>

        <div className="lesson-stage">
          {step === 0 && <div className="lesson-content concept-step">
            <span className="lesson-label">01 · 核心概念</span><h3>{current.conceptTitle}</h3><p>{current.concept}</p>
            {enrichment && <div className="lesson-objectives"><span>完成本课后，你能够</span>{enrichment.objectives.map((objective, index) => <div key={objective}><i>0{index + 1}</i>{objective}</div>)}</div>}
            <div className="key-points">{current.keyPoints.map((point, index) => <div key={point}><i>0{index + 1}</i><p>{point}</p></div>)}</div>
            {enrichment && <div className="lesson-coaching"><div><b>先想再跑</b><p>{enrichment.checkpoint}</p></div><div><b>常见误区</b><p>{enrichment.mistake}</p></div></div>}
            <a className="lesson-source" href={current.source.href} target="_blank" rel="noreferrer">本课权威来源 · {current.source.label}<ExternalLink size={13} /></a>
          </div>}

          {step === 1 && <div className="lesson-content practice-step">
            <span className="lesson-label">02 · 实践任务</span><h3>{current.labTitle}</h3><p>{current.lab}</p>
            <div className="reproducible-assets">
              <div><PackageCheck size={21} /><span><b>本课提供完整可复现材料</b><small>固定数据、依赖版本、完整入口、实际实现与预期输出。</small></span></div>
              <nav aria-label="本课可复现材料">
                <a href={`/course-assets/lessons/${current.id}.py`} download><FileCode2 size={14} /> 本课入口</a>
                <a href="/course-assets/cases.py" download><Code2 size={14} /> 完整实现</a>
                <a href={`/course-assets/data/${dataFile}`} download><Database size={14} /> 本课数据</a>
                <a href={`/course-assets/outputs/${current.id}.json`} download><CheckCircle2 size={14} /> 预期输出</a>
                <a href="/course-assets/quant-course-reproducible.zip" download><Download size={14} /> 完整实践包</a>
              </nav>
            </div>
            {enrichment && <div className="practice-hint"><b>实践提示</b><p>{enrichment.hint}</p></div>}
            {["m1l8", "m2l10", "m3l9", "m4l11", "m5l8", "m6l7"].includes(current.id) ? <ProjectWorkspace lessonId={current.id} dataFile={dataFile} onVerified={setPracticeVerified} /> : <PythonRunner lessonId={current.id} dataFile={dataFile} initialCode={code.startsWith("import json") ? code : browserCodeFor(current.id)} onVerified={setPracticeVerified} />}
            <p className="code-scope-note">点击“运行并校验”会在浏览器后台执行真实 Python，并将结果与仓库中的固定快照逐字段比较。</p>
            <button className="reveal-result" onClick={() => setShowExpected((value) => !value)}>{showExpected ? "隐藏参考结果" : "查看参考结果"}<ChevronDown size={14} /></button>
            {showExpected && <div className="expected-result"><span>参考结果</span><p>{current.expected}</p></div>}
            <div className={practiceDone ? "practice-check verified" : "practice-check"}><span>{practiceDone ? <CheckCircle2 size={17} /> : <Circle size={17} />}<b>{practiceDone ? "实践已由运行结果验证" : "运行结果通过后自动完成实践"}</b><small>{practiceDone ? "你可以进入检查理解。" : "下载包仍可用于本地复现，但课程解锁需要网页校验通过。"}</small></span></div>
          </div>}

          {step === 2 && <div className="lesson-content quiz-step">
            <span className="lesson-label">03 · 检查理解</span><h3>{current.quiz.question}</h3>
            <div className="quiz-options">{current.quiz.options.map((option, index) => <button key={option} className={quizAnswer === index ? (index === current.quiz.answer ? "selected correct" : "selected wrong") : ""} onClick={() => setQuizAnswer(index)}><i>{String.fromCharCode(65 + index)}</i><span>{option}</span>{quizAnswer === index && (index === current.quiz.answer ? <CheckCircle2 /> : <X />)}</button>)}</div>
            {quizAnswer !== null && <div className={quizCorrect ? "quiz-feedback correct" : "quiz-feedback wrong"}><b>{quizCorrect ? "回答正确" : "再想一下"}</b><p>{current.quiz.explanation}</p></div>}
          </div>}

          <div className="lesson-navigation"><button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft size={16} /> 上一步</button>{step < 2 ? <button className="next-step" onClick={() => setStep((value) => Math.min(2, value + 1))} disabled={step === 1 && !practiceDone}>下一步 <ArrowRight size={16} /></button> : <button className="next-step" onClick={finishLesson} disabled={!practiceDone || !quizCorrect}>{isCompleted ? "已保存完成" : "完成本课"}<Check size={16} /></button>}</div>
        </div>

        <aside className="next-action"><span>下一步</span>{isCompleted ? <><Trophy size={25} /><h4>本课已完成</h4><p>{nextLesson ? `下一课：${nextLesson.title}` : "你已完成全部 53 节课程。"}</p>{nextLesson && <button onClick={continueCourse}>进入下一课 <ArrowRight size={14} /></button>}</> : <><Circle size={25} /><h4>{step === 0 ? "掌握三个关键点" : step === 1 ? "完成实践并勾选" : "通过检查题"}</h4><p>{step === 0 ? "下一步会把概念转成一段可运行或可推演的研究任务。" : step === 1 ? "修改代码、对照参考结果，再确认你已完成实践。" : "回答正确后，本课完成状态与下一课解锁状态会保存在本机。"}</p></>}</aside>
      </div>
    </section>
  </>;
}
