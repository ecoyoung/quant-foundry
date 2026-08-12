"use client";

import {
  ArrowRight,
  ExternalLink,
  Github,
  Library,
  Menu,
  Play,
  X,
} from "lucide-react";
import { useState } from "react";
import CourseExperience from "@/components/CourseExperience";

const sources = [
  { kind: "公开课", name: "MIT Analytics of Finance", meta: "金融计量、Monte Carlo、随机过程", mark: "MIT", href: "https://ocw.mit.edu/courses/15-450-analytics-of-finance-fall-2010/" },
  { kind: "官方文档", name: "NumPy User Guide", meta: "数组、广播与科学计算基础", mark: "PY", href: "https://numpy.org/doc/stable/user/" },
  { kind: "研究论文", name: "Probability of Backtest Overfitting", meta: "识别策略选择偏差", mark: "PBO", href: "https://papers.ssrn.com/sol3/Papers.cfm?abstract_id=2326253" },
  { kind: "开源引擎", name: "QuantConnect LEAN", meta: "研究、回测与实盘的工程范式", mark: "LEAN", href: "https://github.com/QuantConnect/Lean" },
];

function goToHash(id: string) {
  window.location.hash = id;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return <main>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="量研课首页"><span className="brand-seal">研</span><span><b>量研课</b><small>QUANT RESEARCH LAB</small></span></a>
      <nav className={menuOpen ? "nav open" : "nav"} aria-label="主导航">
        <a href="#roadmap" onClick={() => setMenuOpen(false)}>课程路径</a><a href="#lesson" onClick={() => setMenuOpen(false)}>学习器</a><a href="#workbench" onClick={() => setMenuOpen(false)}>研究工作台</a><a href="#offline" onClick={() => setMenuOpen(false)}>离线安装</a><a href="#library" onClick={() => setMenuOpen(false)}>资料库</a>
        <a className="nav-cta" href="#lesson">继续学习 <ArrowRight size={15} /></a>
      </nav>
      <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="切换菜单">{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <section className="hero" id="top">
      <div className="eyebrow"><span /> 从零开始的完整量化研究课程</div>
      <h1>把市场直觉，<br />变成<span>可检验</span>的研究。</h1>
      <p className="hero-copy">从第一行 Python 开始，经过概率、时间序列、回测、机器学习与风险，最终完成一份可复现的策略研究。少一点神秘指标，多一点诚实证据。</p>
      <div className="hero-actions"><button className="primary-button" onClick={() => goToHash("lesson")}><Play size={16} fill="currentColor" /> 继续学习</button><button className="text-button" onClick={() => goToHash("roadmap")}>查看完整路径 <ArrowRight size={16} /></button></div>
      <div className="hero-aside curriculum-aside"><span>课程已经完整建立</span><blockquote>53 节课<br />12 项实践<br />6 个阶段项目</blockquote><p>每节课包含概念、代码实践、检查题和权威来源，并按顺序保存学习进度。</p><button onClick={() => goToHash("roadmap")}>展开课程目录 <ArrowRight size={14} /></button></div>
      <div className="ticker" aria-label="课程关键词"><span>PYTHON 3</span><i /><span>53 LESSONS</span><i /><span>6 PROJECTS</span><i /><span>0 REAL-MONEY REQUIRED</span></div>
    </section>

    <section className="principles"><p className="section-kicker">学习方法</p><div className="principle-grid"><article><b>01</b><h3>先建立假设</h3><p>从经济直觉出发，写下可证伪的命题，再触碰数据。</p></article><article><b>02</b><h3>再面对证据</h3><p>使用时间外验证、交易成本和稳健性检查约束结论。</p></article><article><b>03</b><h3>最后讨论交易</h3><p>研究通过审查后才进入模拟盘；课程不构成投资建议。</p></article></div></section>

    <CourseExperience />

    <section className="library" id="library">
      <div className="section-heading"><div><p className="section-kicker">经核验的资料底座</p><h2>从原始资料开始阅读</h2></div><a href="https://github.com/QuantConnect/Lean" target="_blank" rel="noreferrer">查看开源项目 <Github size={16} /></a></div>
      <div className="source-grid">{sources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.name}><article><div className="source-mark">{source.mark}</div><span>{source.kind}</span><h3>{source.name}</h3><p>{source.meta}</p><b>打开原始资料 <ExternalLink size={14} /></b></article></a>)}</div>
      <a className="library-note" href="/resources/catalog.md" target="_blank"><Library size={20} /><div><b>本地资料库</b><p>公开 PDF、课程索引、论文链接与开源项目清单保存在 resources 目录。</p></div><ArrowRight size={20} /></a>
    </section>

    <footer><div className="brand"><span className="brand-seal">研</span><span><b>量研课</b><small>QUANT RESEARCH LAB</small></span></div><p>研究市场，也研究自己的判断。</p><span>EDUCATION ONLY · 2026</span></footer>
  </main>;
}
