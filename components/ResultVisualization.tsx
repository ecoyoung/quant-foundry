"use client";

type Point = { label: string; value: number };

function numericLeaves(value: unknown, path = "result", result: Point[] = []): Point[] {
  if (typeof value === "number" && Number.isFinite(value)) result.push({ label: path.replace("result.", ""), value });
  else if (Array.isArray(value)) value.forEach((item, index) => numericLeaves(item, `${path}[${index}]`, result));
  else if (value && typeof value === "object") Object.entries(value as Record<string, unknown>).forEach(([key, item]) => numericLeaves(item, `${path}.${key}`, result));
  return result;
}

function compact(value: number) {
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (Math.abs(value) < 0.01 && value !== 0) return value.toExponential(2);
  return value.toFixed(4).replace(/\.?(0+)$/, "");
}

export default function ResultVisualization({ result, baseline, lessonId }: { result: unknown; baseline?: unknown; lessonId?: string }) {
  const record = result && typeof result === "object" && !Array.isArray(result) ? result as Record<string, unknown> : null;
  if (record?.equity_curve && Array.isArray(record.equity_curve)) return <ResearchDashboard record={record} />;
  if (record?.wealth_curve && Array.isArray(record.wealth_curve)) return <CurvePanel title="累计财富曲线" values={record.wealth_curve as number[]} />;
  if (record?.fold_correlations && Array.isArray(record.fold_correlations)) return <FoldScoreChart values={record.fold_correlations as number[]} />;
  if (record?.participation && Array.isArray(record.participation) && Array.isArray(record.slippage_fraction)) return <ImpactCurve x={record.participation as number[]} y={record.slippage_fraction as number[]} />;
  if (record?.return_acf && typeof record.return_acf === "object") return <AcfChart returns={record.return_acf as Record<string, number>} absolute={record.absolute_return_acf as Record<string, number>} />;
  if (record?.gross && record?.net_10bps) return <CostBridge gross={record.gross as Record<string, number>} net={record.net_10bps as Record<string, number>} />;
  if (record?.asset_stats && typeof record.asset_stats === "object") return <AssetComparison assets={record.asset_stats as Record<string, Record<string, number>>} />;
  if (record && hasPerformance(record)) return <PerformanceCard values={record} />;
  const matrix = record && findMatrix(record);
  if (matrix) return <MatrixHeatmap title={matrix.title} matrix={matrix.values} />;
  if (record?.folds && Array.isArray(record.folds) && typeof record.folds[0] === "object") return <FoldTimeline folds={record.folds as Record<string, number>[]} />;
  const points = numericLeaves(result).slice(0, 18);
  const baselineMap = new Map(numericLeaves(baseline).map((item) => [item.label, item.value]));
  if (!points.length) return <div className="evidence-view"><pre>{JSON.stringify(result, null, 2)}</pre></div>;
  const max = Math.max(...points.map((point) => Math.abs(point.value)), 1e-12);
  const sequenceLike = points.length >= 3 && points.every((point) => /\[\d+\]$/.test(point.label));

  return <div className="result-visualization">
    <div className="visual-heading"><span>{sequenceLike ? "数值序列" : lessonId ? "本课证据面板" : "参数对照"}</span><small>{lessonId ? `${lessonId.toUpperCase()} · 按金融语义组织` : "相对标准参数比较"}</small></div>
    {sequenceLike ? <LinePlot points={points} /> : <div className="metric-bars">{points.map((point) => {
      const base = baselineMap.get(point.label);
      return <div key={point.label}><span title={point.label}>{point.label}</span><i><b style={{ width: `${Math.max(2, Math.abs(point.value) / max * 100)}%` }} /></i><strong>{compact(point.value)}</strong>{base !== undefined && <small className={point.value >= base ? "up" : "down"}>{point.value >= base ? "+" : ""}{compact(point.value - base)}</small>}</div>;
    })}</div>}
  </div>;
}

function ResearchDashboard({ record }: { record: Record<string, unknown> }) {
  return <div className="result-visualization semantic-card"><div className="visual-heading"><span>成本后回测研究面板</span><small>净值、回撤与月度收益</small></div><div className="research-curves"><CurveSvg values={record.equity_curve as number[]} tone="teal"/><CurveSvg values={record.drawdown_curve as number[]} tone="loss"/></div>{record.monthly_returns !== undefined && <MonthlyHeatmap values={record.monthly_returns as Record<string, number>}/>}</div>;
}

function CurvePanel({ title, values }: { title: string; values: number[] }) { return <div className="result-visualization semantic-card"><div className="visual-heading"><span>{title}</span><small>固定样本 · 每 30 个交易日抽样</small></div><div className="single-curve"><CurveSvg values={values} tone="teal"/></div></div>; }

function CurveSvg({ values, tone }: { values: number[]; tone: "teal" | "loss" }) {
  const min=Math.min(...values),max=Math.max(...values),range=max-min||1; const points=values.map((value,index)=>`${index/Math.max(values.length-1,1)*100},${92-(value-min)/range*80}`).join(" ");
  return <div className={`curve-svg ${tone}`}><svg viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" x2="100" y1="92" y2="92"/><polyline points={points}/></svg><span><i>{compact(values[0])}</i><b>{min.toFixed(3)} — {max.toFixed(3)}</b><i>{compact(values.at(-1) ?? 0)}</i></span></div>;
}

function MonthlyHeatmap({ values }: { values: Record<string,number> }) { const entries=Object.entries(values); const max=Math.max(...entries.map(([,v])=>Math.abs(v)),.001); return <div className="monthly-heatmap"><b>月度收益热力图</b><div>{entries.map(([month,value])=><span key={month} title={`${month}: ${(value*100).toFixed(2)}%`} style={{background:value>=0?`rgba(64,130,117,${.18+.72*Math.abs(value)/max})`:`rgba(177,101,73,${.18+.72*Math.abs(value)/max})`}}><i>{month.slice(2)}</i>{(value*100).toFixed(1)}%</span>)}</div></div>; }

function FoldScoreChart({ values }: { values:number[] }) { const max=Math.max(...values.map(Math.abs),.001); return <div className="result-visualization semantic-card"><div className="visual-heading"><span>样本外逐折表现</span><small>正负折并列，避免均值掩盖不稳定</small></div><div className="fold-scores">{values.map((value,index)=><div key={index}><b>F{index+1}</b><i><span className={value<0?"negative":""} style={{width:`${Math.abs(value)/max*50}%`,marginLeft:value<0?`${50-Math.abs(value)/max*50}%`:"50%"}}/></i><strong>{compact(value)}</strong></div>)}</div></div>; }

function ImpactCurve({ x,y }: { x:number[];y:number[] }) { return <div className="result-visualization semantic-card"><div className="visual-heading"><span>成交参与率与市场冲击</span><small>凸性成本曲线</small></div><div className="impact-bars">{x.map((value,index)=><div key={value}><b>{(value*100).toFixed(1)}%</b><i><span style={{width:`${y[index]/Math.max(...y)*100}%`}}/></i><strong>{(y[index]*10000).toFixed(2)} bps</strong></div>)}</div></div>; }

function AcfChart({ returns,absolute }: { returns:Record<string,number>;absolute:Record<string,number> }) { return <div className="result-visualization semantic-card"><div className="visual-heading"><span>滞后相关结构</span><small>收益 vs. 绝对收益</small></div><div className="acf-chart">{Object.keys(returns).map((lag)=><div key={lag}><b>L{lag}</b><i><span style={{height:`${Math.abs(returns[lag])*220}px`}}/><em style={{height:`${Math.abs(absolute[lag])*220}px`}}/></i></div>)}</div><div className="chart-legend"><i/>收益 ACF <em/>绝对收益 ACF</div></div>; }

function CostBridge({ gross,net }: { gross:Record<string,number>;net:Record<string,number> }) { const keys=["annual_return","annual_volatility","sharpe","max_drawdown"]; return <div className="result-visualization semantic-card"><div className="visual-heading"><span>交易成本前后对照</span><small>毛绩效 → 10 bps 净绩效</small></div><div className="cost-bridge">{keys.map(key=><div key={key}><b>{key}</b><span>{compact(gross[key])}</span><i>→</i><strong>{compact(net[key])}</strong><em className={net[key]>=gross[key]?"up":"down"}>{compact(net[key]-gross[key])}</em></div>)}</div></div>; }

function hasPerformance(record: Record<string, unknown>) {
  return ["annual_return", "annual_volatility", "sharpe", "max_drawdown", "gross_return", "net_return"].filter((key) => typeof record[key] === "number").length >= 2;
}

function PerformanceCard({ values }: { values: Record<string, unknown> }) {
  const labels: Record<string, [string, "percent" | "number"]> = {
    annual_return: ["年化收益", "percent"], annual_volatility: ["年化波动", "percent"], sharpe: ["夏普率", "number"],
    max_drawdown: ["最大回撤", "percent"], gross_return: ["毛收益", "percent"], net_return: ["净收益", "percent"], estimated_cost: ["成本拖累", "percent"],
  };
  const items = Object.entries(labels).filter(([key]) => typeof values[key] === "number");
  return <div className="result-visualization semantic-card"><div className="visual-heading"><span>策略绩效卡</span><small>收益、风险与成本同屏检查</small></div><div className="performance-grid">{items.map(([key, [label, kind]]) => { const value = values[key] as number; return <div className={value < 0 ? "negative" : ""} key={key}><span>{label}</span><strong>{kind === "percent" ? `${(value * 100).toFixed(2)}%` : value.toFixed(3)}</strong><i>{key === "max_drawdown" ? "越接近 0 越好" : key.includes("cost") ? "净值扣减" : "固定样本结果"}</i></div>; })}</div></div>;
}

function AssetComparison({ assets }: { assets: Record<string, Record<string, number>> }) {
  const rows = Object.entries(assets);
  return <div className="result-visualization semantic-card"><div className="visual-heading"><span>资产横截面对照</span><small>收益 / 波动 / 夏普 / 回撤</small></div><div className="asset-comparison"><div><b>资产</b><b>年化收益</b><b>年化波动</b><b>夏普</b><b>最大回撤</b></div>{rows.map(([asset, item]) => <div key={asset}><strong>{asset}</strong><span>{(item.annual_return*100).toFixed(2)}%</span><span>{(item.annual_volatility*100).toFixed(2)}%</span><span>{item.sharpe.toFixed(2)}</span><span className="negative">{(item.max_drawdown*100).toFixed(2)}%</span></div>)}</div></div>;
}

function findMatrix(record: Record<string, unknown>): { title: string; values: Record<string, Record<string, number>> } | null {
  for (const [key, value] of Object.entries(record)) {
    if (!/(corr|covariance|correlation|matrix)/i.test(key) || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const rows = value as Record<string, unknown>;
    if (Object.values(rows).every((row) => row && typeof row === "object" && !Array.isArray(row))) return { title: key.includes("cov") ? "协方差矩阵" : "相关矩阵", values: rows as Record<string, Record<string, number>> };
  }
  return null;
}

function MatrixHeatmap({ title, matrix }: { title: string; matrix: Record<string, Record<string, number>> }) {
  const columns = Object.keys(matrix); const values = Object.values(matrix).flatMap((row) => Object.values(row)); const max = Math.max(...values.map(Math.abs), 1e-9);
  return <div className="result-visualization semantic-card"><div className="visual-heading"><span>{title}</span><small>颜色深度表示绝对强度</small></div><div className="matrix-grid" style={{ gridTemplateColumns: `62px repeat(${columns.length}, minmax(44px, 1fr))` }}><i />{columns.map((c) => <b key={c}>{c}</b>)}{columns.flatMap((row) => [<b key={`${row}-label`}>{row}</b>, ...columns.map((column) => { const value = matrix[row]?.[column] ?? 0; return <span key={`${row}-${column}`} style={{ background: value >= 0 ? `rgba(56,126,114,${.12+.72*Math.abs(value)/max})` : `rgba(177,101,73,${.12+.72*Math.abs(value)/max})` }}>{compact(value)}</span>; })])}</div></div>;
}

function FoldTimeline({ folds }: { folds: Record<string, number>[] }) {
  const max = Math.max(...folds.flatMap((fold) => [fold.test_end ?? 0, fold.train_end ?? 0]), 1);
  return <div className="result-visualization semantic-card"><div className="visual-heading"><span>Walk-forward 时序切分</span><small>训练、隔离区与测试严格按时间排列</small></div><div className="fold-timeline">{folds.map((fold, index) => <div key={index}><b>F{index+1}</b><i><span style={{ width: `${((fold.train_end-fold.train_start+1)/max)*100}%` }} /><em style={{ left: `${(fold.test_start/max)*100}%`, width: `${((fold.test_end-fold.test_start+1)/max)*100}%` }} /></i><small>{fold.train_start}–{fold.train_end} / {fold.test_start}–{fold.test_end}</small></div>)}</div></div>;
}

function LinePlot({ points }: { points: Point[] }) {
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const range = max - min || 1;
  const polyline = points.map((point, index) => `${(index / Math.max(1, points.length - 1)) * 100},${90 - ((point.value - min) / range) * 75}`).join(" ");
  return <div className="auto-line"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="结果序列折线图"><line x1="0" x2="100" y1="90" y2="90" /><polyline points={polyline} /></svg><div><span>{points[0]?.label}</span><b>{compact(min)} — {compact(max)}</b><span>{points.at(-1)?.label}</span></div></div>;
}
