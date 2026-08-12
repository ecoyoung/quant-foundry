export type CourseSource = { label: string; href: string };

export type Quiz = {
  question: string;
  options: [string, string, string];
  answer: number;
  explanation: string;
};

export type Lesson = {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  duration: number;
  conceptTitle: string;
  concept: string;
  keyPoints: [string, string, string];
  labTitle: string;
  lab: string;
  code: string;
  expected: string;
  quiz: Quiz;
  source: CourseSource;
};

export type CourseModule = {
  id: string;
  title: string;
  subtitle: string;
  weeks: string;
  project: string;
  tone: string;
  lessons: Lesson[];
};

const S = {
  numpy: { label: "NumPy User Guide", href: "https://numpy.org/doc/stable/user/" },
  pandas: { label: "pandas User Guide", href: "https://pandas.pydata.org/docs/user_guide/" },
  mitProb: { label: "MIT 18.05 Probability and Statistics", href: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/" },
  mitFinance: { label: "MIT 15.450 Analytics of Finance", href: "https://ocw.mit.edu/courses/15-450-analytics-of-finance-fall-2010/" },
  mitTs: { label: "MIT 18.642 Time Series", href: "https://ocw.mit.edu/courses/18-642-topics-in-mathematics-with-applications-in-finance-fall-2024/" },
  scipy: { label: "SciPy Statistics", href: "https://docs.scipy.org/doc/scipy/reference/stats.html" },
  statsmodels: { label: "statsmodels Time Series", href: "https://www.statsmodels.org/stable/tsa.html" },
  sklearn: { label: "scikit-learn User Guide", href: "https://scikit-learn.org/stable/user_guide.html" },
  tss: { label: "scikit-learn TimeSeriesSplit", href: "https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html" },
  sec: { label: "SEC Trading Basics", href: "https://www.sec.gov/file/trading101basicspdf" },
  lean: { label: "QuantConnect LEAN Documentation", href: "https://www.quantconnect.com/docs/v2/writing-algorithms" },
  leanEngine: { label: "LEAN Algorithm Engine", href: "https://www.quantconnect.com/docs/v2/writing-algorithms/key-concepts/algorithm-engine" },
  leanReality: { label: "LEAN Reality Modeling", href: "https://www.quantconnect.com/docs/v2/writing-algorithms/reality-modeling/key-concepts" },
  pbo: { label: "The Probability of Backtest Overfitting", href: "https://papers.ssrn.com/sol3/Papers.cfm?abstract_id=2326253" },
};

function lesson(
  id: string,
  moduleId: string,
  number: number,
  title: string,
  duration: number,
  conceptTitle: string,
  concept: string,
  keyPoints: [string, string, string],
  labTitle: string,
  lab: string,
  code: string,
  expected: string,
  quiz: Quiz,
  source: CourseSource,
): Lesson {
  return { id, moduleId, number, title, duration, conceptTitle, concept, keyPoints, labTitle, lab, code, expected, quiz, source };
}

const m1 = [
  lesson("m1l1", "01", 1, "价格不等于收益率", 12, "用相对变化比较资产", "不同资产的价格尺度不同，收益率把价格变化转化为可比较的比例。连续复利与简单收益率服务于不同分析目的。", ["简单收益率等于价格变化除以前一期价格", "相同百分比的上涨与下跌不会互相抵消", "计算收益前先确认价格是否经过复权"], "计算第一组收益率", "比较 100→110 与 110→100，观察正负收益为什么不对称。", "prices = pd.Series([100, 110, 100])\nreturns = prices.pct_change().dropna()\nprint(returns.round(4))", "0.1000, -0.0909", { question: "100 元上涨 20% 后再下跌 20%，最终是多少？", options: ["100 元", "96 元", "80 元"], answer: 1, explanation: "100 × 1.2 × 0.8 = 96；两次百分比作用于不同基数。" }, S.pandas),
  lesson("m1l2", "01", 2, "认识 OHLCV 数据", 15, "一根价格柱的五个字段", "OHLCV 记录同一时间窗口内的开盘、最高、最低、收盘与成交量。字段含义固定，但时间粒度和成交量单位取决于数据源。", ["High 不应低于 Open 或 Close", "Low 不应高于 Open 或 Close", "Volume 的单位必须查阅数据字典"], "校验一根价格柱", "写出布尔条件，检查最高价、最低价和成交量是否合理。", "valid = (high >= max(open_, close)\n         and low <= min(open_, close)\n         and volume >= 0)", "合法价格柱返回 True", { question: "日线 OHLCV 中的 Volume 通常表示什么？", options: ["开盘价格", "该日成交数量", "价格涨幅"], answer: 1, explanation: "Volume 描述该窗口内的成交活动；具体单位由市场和数据商定义。" }, S.pandas),
  lesson("m1l3", "01", 3, "Python：变量、函数与类型", 22, "让研究代码表达意图", "变量保存状态，函数封装可重复步骤，类型标注记录输入与输出约束。量化代码首先要可读，其次才是简短。", ["函数只承担一个清晰职责", "使用有含义的名称替代 x1、tmp", "类型标注帮助编辑器提前发现错误"], "编写收益率函数", "实现一个接收前后价格并返回收益率的纯函数，同时处理零价格。", "def simple_return(previous: float, current: float) -> float:\n    if previous <= 0:\n        raise ValueError(\"previous must be positive\")\n    return current / previous - 1", "simple_return(100, 105) == 0.05", { question: "哪种函数最容易测试？", options: ["依赖全局变量的函数", "输入明确且无副作用的函数", "每次打印随机结果的函数"], answer: 1, explanation: "纯函数的结果只由输入决定，因此容易复现和测试。" }, S.numpy),
  lesson("m1l4", "01", 4, "NumPy：数组与向量化", 25, "一次操作整列数据", "NumPy 数组以统一类型连续组织数据，向量化把循环交给底层编译代码执行，使表达更接近数学公式。", ["shape 描述数组各维长度", "广播允许兼容形状之间运算", "向量化通常比 Python 循环更清晰高效"], "向量化收益率", "用数组切片一次性计算所有相邻价格收益率。", "prices = np.array([100., 102., 101., 105.])\nreturns = prices[1:] / prices[:-1] - 1", "[0.0200, -0.0098, 0.0396]", { question: "向量化最直接的优势是什么？", options: ["保证策略盈利", "批量表达并高效计算", "自动清洗所有异常值"], answer: 1, explanation: "向量化改善表达与性能，但不会替你判断数据质量或策略有效性。" }, S.numpy),
  lesson("m1l5", "01", 5, "pandas：Series 与 DataFrame", 28, "带标签的数据结构", "Series 是带索引的一维数据，DataFrame 是共享行索引的二维表。索引对齐既强大，也可能在日期不一致时悄悄产生缺失值。", ["先检查 index、columns 与 dtypes", "算术默认按标签对齐", "链式索引可能产生难以发现的赋值问题"], "构建价格表", "创建两只资产的收盘价表，并计算按列收益率。", "prices = pd.DataFrame({\n    \"A\": [100, 101, 103],\n    \"B\": [50, 49, 51],\n}, index=pd.date_range(\"2026-01-01\", periods=3))\nreturns = prices.pct_change()", "得到日期 × 资产的收益率表", { question: "两个 Series 相加时，pandas 默认按什么对齐？", options: ["存储位置", "索引标签", "数值大小"], answer: 1, explanation: "pandas 按索引标签对齐；不匹配的标签会产生缺失值。" }, S.pandas),
  lesson("m1l6", "01", 6, "缺失值、复权与数据质量", 30, "先解释缺失，再决定填补", "缺失可能来自停牌、节假日、上市日期或抓取失败。前向填充不是中性操作；股票拆分与分红还需要复权价格避免虚假跳跃。", ["不要默认把所有缺失值填为零", "区分原始价格与复权价格", "保留数据清洗日志和异常计数"], "制作质量报告", "统计每列缺失率、重复日期和非正价格，并输出检查表。", "report = pd.DataFrame({\n    \"missing\": prices.isna().mean(),\n    \"non_positive\": (prices <= 0).sum(),\n})", "每个资产一行的数据质量摘要", { question: "股票 1 拆 2 未复权时会怎样？", options: ["出现近似 -50% 的虚假收益", "收益率自动为 0", "成交量必然消失"], answer: 0, explanation: "价格机械减半会被误判为巨大损失，因此历史研究通常需要复权。" }, S.pandas),
  lesson("m1l7", "01", 7, "时间索引与重采样", 28, "时间是金融数据的主键", "时间索引决定数据的先后、频率和对齐方式。重采样时，开高低收量分别需要 first、max、min、last、sum。", ["统一时区后再合并数据", "分钟线转日线需为每个字段选择正确聚合", "避免把市场闭市造成的空档当成缺失交易"], "分钟线聚合为日线", "为 OHLCV 分别指定聚合规则，并检查每日价格范围。", "daily = minute.resample(\"1D\").agg({\n    \"open\": \"first\", \"high\": \"max\",\n    \"low\": \"min\", \"close\": \"last\",\n    \"volume\": \"sum\",\n})", "生成一日一行的 OHLCV 数据", { question: "分钟成交量汇总到日线应使用什么？", options: ["平均值", "求和", "最后一个值"], answer: 1, explanation: "日成交量通常是该日所有分钟成交量之和。" }, S.pandas),
  lesson("m1l8", "01", 8, "阶段项目：价格研究笔记", 45, "把探索过程变成可复现研究", "研究笔记应记录数据来源、时间范围、清洗规则、核心图表和结论限制。别人重跑时应得到同样结果。", ["固定随机种子与依赖版本", "每张图说明数据与单位", "结论同时写出适用范围和限制"], "完成第一份 Notebook", "导入一份示例行情，生成质量报告、收益分布和累计收益曲线。", "# 1. load\n# 2. validate\n# 3. transform\n# 4. visualize\n# 5. conclude", "一份从原始数据到结论的完整研究文件", { question: "可复现研究最重要的特征是什么？", options: ["图表颜色丰富", "输入、步骤与环境可追溯", "代码尽可能短"], answer: 1, explanation: "可追溯的输入、处理步骤与运行环境，使结论能够被独立核验。" }, S.mitFinance),
];

const m2 = [
  lesson("m2l1", "02", 9, "随机变量与概率分布", 25, "用分布描述不确定性", "随机变量把不确定结果映射为数值，概率分布描述可能取值及其概率。经验分布来自样本，不等同于真实生成机制。", ["离散与连续变量使用不同概率表达", "分布参数不是固定真理而是估计", "金融尾部事件往往比正态假设更频繁"], "模拟收益分布", "用固定随机种子生成样本，并比较理论均值与样本均值。", "rng = np.random.default_rng(42)\nsample = rng.normal(0.0004, 0.01, 1000)\nprint(sample.mean(), sample.std(ddof=1))", "样本统计接近但不等于设定参数", { question: "经验分布来自哪里？", options: ["观测样本", "必然规律", "交易所规则"], answer: 0, explanation: "经验分布由实际样本构成，会随样本区间变化。" }, S.mitProb),
  lesson("m2l2", "02", 10, "均值、方差与标准差", 24, "位置与离散程度", "均值描述中心位置，方差与标准差描述围绕中心的离散。标准差与原变量同单位，因此更容易解释。", ["样本方差通常使用 n−1 自由度", "均值容易受极端值影响", "低波动不等于低尾部风险"], "手算三期波动", "分别计算收益均值、离均差和样本标准差。", "r = np.array([0.02, -0.01, 0.03])\nmean = r.mean()\nvol = r.std(ddof=1)", "mean≈1.33%，sample std≈2.08%", { question: "标准差相对方差的解释优势是什么？", options: ["总是更小", "与原变量单位相同", "不受异常值影响"], answer: 1, explanation: "标准差是方差平方根，与收益率使用相同单位。" }, S.mitProb),
  lesson("m2l3", "02", 11, "协方差与相关系数", 28, "资产如何共同变化", "协方差保留量纲，相关系数将共同变化缩放到 −1 至 1。相关性描述线性关系，不代表因果，也会随市场状态改变。", ["相关为零不代表完全独立", "滚动相关揭示时间变化", "危机期相关性可能同步上升"], "计算相关矩阵", "对齐两列收益率后计算协方差与相关系数。", "aligned = returns[[\"A\", \"B\"]].dropna()\ncov = aligned.cov()\ncorr = aligned.corr()", "得到 2×2 协方差与相关矩阵", { question: "相关系数为 0 表示什么？", options: ["没有任何关系", "没有明显线性关系", "两资产完全独立"], answer: 1, explanation: "零相关仅排除线性共同变化，仍可能存在非线性依赖。" }, S.mitProb),
  lesson("m2l4", "02", 12, "正态分布与肥尾", 26, "模型便利不等于现实", "正态分布便于推导，但金融收益常呈现偏度、峰度和肥尾。风险估计应检查尾部而不是只看均值与标准差。", ["偏度描述左右不对称", "超额峰度反映尾部与尖峰", "QQ 图可直观看到正态偏离"], "比较正态与经验分位数", "计算 1% 与 99% 分位数，并与同均值方差正态分布比较。", "q = returns.quantile([0.01, 0.99])\nnormal_q = stats.norm.ppf([0.01, 0.99], returns.mean(), returns.std())", "经验尾部通常与正态基准不同", { question: "肥尾意味着什么？", options: ["极端值比正态模型更常见", "所有收益都为负", "均值一定不存在"], answer: 0, explanation: "肥尾表示远离中心的极端观测概率相对更高。" }, S.scipy),
  lesson("m2l5", "02", 13, "大数定律与中心极限定理", 28, "样本变多后会发生什么", "大数定律说明样本均值趋近总体均值；中心极限定理说明在条件满足时，标准化样本均值趋向正态。金融序列的相关和非平稳会削弱简单套用。", ["样本多不等于样本独立", "中心极限定理针对统计量而非原始分布", "有效样本量可能远小于观测数量"], "观察均值收敛", "逐步增加模拟样本量，记录累计均值轨迹。", "sample = rng.normal(0.001, 0.02, 5000)\nrunning_mean = np.cumsum(sample) / np.arange(1, len(sample)+1)", "累计均值逐渐围绕设定均值稳定", { question: "中心极限定理通常描述什么的分布？", options: ["原始价格", "样本均值", "订单数量"], answer: 1, explanation: "它描述适当标准化后的样本均值等统计量，而非原始数据必然正态。" }, S.mitProb),
  lesson("m2l6", "02", 14, "Bootstrap 重采样", 30, "从样本近似估计不确定性", "Bootstrap 从观测样本有放回抽样，重复计算统计量，形成经验抽样分布。时间序列存在依赖时应考虑区块 Bootstrap。", ["每次重采样长度通常等于原样本", "分位数可构造置信区间", "普通 Bootstrap 会破坏时间依赖"], "估计 Sharpe 区间", "重复抽取日收益并计算年化 Sharpe，观察估计的不稳定性。", "def sharpe(x): return np.sqrt(252) * x.mean() / x.std(ddof=1)\nboot = [sharpe(rng.choice(r, len(r), replace=True)) for _ in range(2000)]", "得到 Sharpe 的经验分布与区间", { question: "有放回抽样意味着什么？", options: ["每个观测只能出现一次", "同一观测可能重复出现", "必须按原顺序抽取"], answer: 1, explanation: "Bootstrap 样本中某些观测会重复，另一些可能不出现。" }, S.scipy),
  lesson("m2l7", "02", 15, "波动率与年化", 24, "频率转换需要假设", "在独立同分布假设下，波动率随时间平方根缩放，日波动乘 √252 得到年化估计。自相关和波动聚集会使这一近似失真。", ["收益均值近似按时间线性缩放", "波动率按时间平方根缩放", "先确认数据频率与交易日数"], "年化收益与波动", "从日收益计算年化均值、波动率和 Sharpe。", "annual_return = r.mean() * 252\nannual_vol = r.std(ddof=1) * np.sqrt(252)\nsharpe = annual_return / annual_vol", "输出同一年度尺度的三个指标", { question: "日波动率年化通常乘以什么？", options: ["252", "√252", "1/252"], answer: 1, explanation: "独立增量下方差按时间相加，因此标准差按时间平方根缩放。" }, S.mitFinance),
  lesson("m2l8", "02", 16, "VaR 与 CVaR", 28, "分位数风险与尾部平均损失", "VaR 给定置信水平下的损失阈值，CVaR 进一步计算超过阈值后的平均损失。二者依赖历史窗口和分布假设。", ["VaR 不描述阈值之外有多糟", "CVaR 对尾部更敏感", "历史法假设过去分布可代表近期风险"], "计算历史 VaR/CVaR", "用收益分布 5% 分位数估计 95% VaR，并对更差样本求均值。", "var_95 = -r.quantile(0.05)\ncvar_95 = -r[r <= r.quantile(0.05)].mean()", "CVaR 通常大于或等于 VaR", { question: "CVaR 相比 VaR 多回答了什么？", options: ["阈值外平均损失多大", "未来价格是多少", "成交速度多快"], answer: 0, explanation: "CVaR关注已经进入尾部后的平均损失严重程度。" }, S.mitFinance),
  lesson("m2l9", "02", 17, "投资组合收益与风险", 32, "权重连接资产与组合", "组合收益是资产收益的加权和，组合方差同时取决于个体方差和资产间协方差。分散化来自不完全同步的变化。", ["权重之和取决于组合约束", "组合方差需要完整协方差矩阵", "历史最优权重可能非常不稳定"], "计算组合波动", "用权重向量与协方差矩阵计算组合期望收益和波动率。", "mu_p = weights @ mean_returns\nvar_p = weights @ cov_matrix @ weights\nvol_p = np.sqrt(var_p)", "得到组合层面的收益与波动", { question: "分散化收益主要来自什么？", options: ["资产价格相同", "资产并非完全正相关", "持仓数量必须为偶数"], answer: 1, explanation: "不完全正相关使部分波动相互抵消。" }, S.mitFinance),
  lesson("m2l10", "02", 18, "阶段项目：风险仪表盘", 50, "把多个风险视角放在一起", "单一指标无法概括风险。仪表盘应同时呈现收益、波动、回撤、尾部损失、相关性和数据窗口。", ["所有指标注明频率与时间区间", "同时显示点估计和不确定性", "避免用装饰性图表掩盖风险"], "制作风险仪表盘", "为两资产组合生成累计收益、滚动波动、回撤和 VaR/CVaR 摘要。", "metrics = {\n  \"return\": annual_return, \"vol\": annual_vol,\n  \"max_drawdown\": drawdown.min(), \"cvar\": cvar_95,\n}", "一页可复核的组合风险摘要", { question: "风险仪表盘首先应说明什么？", options: ["字体名称", "数据窗口与计算口径", "作者偏好的颜色"], answer: 1, explanation: "缺少窗口和口径，任何风险数字都难以比较或复现。" }, S.mitFinance),
];

const m3 = [
  lesson("m3l1", "03", 19, "从想法到可证伪假设", 26, "研究从可能被推翻的命题开始", "“价格会涨”不是研究假设。好假设明确资产范围、信号、持有期、成本与拒绝标准，并解释可能存在的经济机制。", ["先写假设再查看结果", "同时写出失效条件", "区分经济机制与数据巧合"], "填写研究协议", "把“低估值股票表现更好”改写成包含样本、频率和评价指标的命题。", "hypothesis = {\n  \"universe\": \"liquid equities\",\n  \"signal\": \"earnings yield\",\n  \"holding\": \"1 month\",\n  \"metric\": \"cost-adjusted spread\",\n}", "一条能够被数据拒绝的研究假设", { question: "哪项让假设可证伪？", options: ["使用专业词汇", "预先规定评价与拒绝标准", "只展示成功时期"], answer: 1, explanation: "明确标准后，数据可以真正反驳命题。" }, S.mitFinance),
  lesson("m3l2", "03", 20, "平稳性与差分", 30, "统计性质是否随时间稳定", "平稳序列的均值、方差和自协方差结构不随时间漂移。价格常非平稳，收益率更接近平稳，但仍可能出现波动状态变化。", ["趋势会制造虚假回归关系", "差分可去除部分随机趋势", "检验结果不能替代图形诊断"], "比较价格与收益", "画出价格、收益及滚动均值，并运行 ADF 检验。", "price_adf = adfuller(prices.dropna())\nreturn_adf = adfuller(returns.dropna())", "收益序列通常比价格更容易拒绝单位根", { question: "为什么常对价格取差分或收益？", options: ["降低文件大小", "减少非平稳趋势影响", "保证正态分布"], answer: 1, explanation: "差分关注变化而非水平，可削弱随机趋势导致的伪关系。" }, S.statsmodels),
  lesson("m3l3", "03", 21, "自相关与滞后", 28, "今天与过去是否相关", "自相关衡量序列与自身滞后值的线性关系。价格微观结构、趋势或均值回复都可能产生模式，但显著性需结合多重检验。", ["ACF 同时受更短滞后间接影响", "PACF 控制中间滞后的影响", "相关不等于可交易利润"], "绘制 ACF/PACF", "对收益和绝对收益分别查看前 20 个滞后。", "plot_acf(r.dropna(), lags=20)\nplot_pacf(r.dropna(), lags=20)\nplot_acf(r.abs().dropna(), lags=20)", "收益可能弱相关，绝对收益常表现波动聚集", { question: "自相关为正意味着什么？", options: ["过去值与未来值存在线性同向关系", "必然盈利", "序列一定平稳"], answer: 0, explanation: "它描述样本中的线性关系，不保证稳定或可交易。" }, S.statsmodels),
  lesson("m3l4", "03", 22, "滚动窗口与特征", 27, "只使用当时可见的历史", "滚动均值、波动和排名是常见特征。若信号在 t 时刻生成并在 t+1 交易，特征必须只使用截至 t 的数据。", ["明确窗口包含不包含当前值", "信号与未来收益正确错位", "窗口越长不代表越稳健"], "构造无未来数据特征", "计算 20 日动量和波动，并将持有期收益向后移动作为标签。", "feature = prices.pct_change(20)\nvol = returns.rolling(20).std()\ntarget = returns.shift(-1)", "每行特征只依赖该行及过去数据", { question: "预测下一日收益时标签通常如何构造？", options: ["returns.shift(-1)", "returns.shift(1)", "returns.cumsum()"], answer: 0, explanation: "shift(-1) 把下一期收益放到当前行作为未来标签；训练切分仍需保持时间顺序。" }, S.pandas),
  lesson("m3l5", "03", 23, "回归、显著性与效应大小", 32, "显著不等于重要", "回归系数描述条件关系，标准误衡量估计不确定性。p 值回答特定零假设下数据有多极端，但不能衡量策略收益是否足以覆盖成本。", ["检查残差而不只看 R²", "报告置信区间和效应大小", "时间序列误差常需要稳健标准误"], "回归未来收益", "以标准化因子解释下一期收益，并使用 HAC 稳健标准误。", "X = sm.add_constant(factor)\nmodel = sm.OLS(future_return, X, missing=\"drop\").fit(cov_type=\"HAC\", cov_kwds={\"maxlags\": 5})", "报告系数、置信区间和样本数", { question: "p 值很小能直接说明什么？", options: ["策略一定赚钱", "在给定假设下观测较极端", "交易成本为零"], answer: 1, explanation: "统计显著性不自动转化为经济显著性或可交易性。" }, S.statsmodels),
  lesson("m3l6", "03", 24, "动量因子", 30, "过去强势是否延续", "动量以过去一段时间的相对表现排序资产，常跳过最近窗口以减少短期反转影响。研究必须处理上市历史、停牌和换手成本。", ["信号窗口与持有窗口分开", "横截面排序避免价格尺度问题", "高换手会侵蚀纸面收益"], "构造 12-1 动量", "计算过去 12 个月、跳过最近 1 个月的累计收益，并按月排名。", "monthly = prices.resample(\"ME\").last()\nmomentum = monthly.shift(1) / monthly.shift(12) - 1\nranks = momentum.rank(axis=1, pct=True)", "每月得到 0 到 1 的横截面动量排名", { question: "横截面动量比较的是什么？", options: ["同一资产不同会计制度", "同一时点不同资产的过去表现", "未来已知收益"], answer: 1, explanation: "它在同一时点按过去表现对资产进行相对排序。" }, S.mitFinance),
  lesson("m3l7", "03", 25, "均值回复与标准分数", 30, "偏离是否会回到中心", "均值回复假设偏离暂时中心后会回归。z-score 用滚动均值和标准差标准化偏离，但中心和波动本身可能随状态改变。", ["先检查价差是否相对稳定", "滚动参数只能使用历史", "止损条件必须对应假设失效"], "构造滚动 z-score", "计算 20 日价格 z-score，并定义阈值信号。", "mean = spread.rolling(20).mean()\nstd = spread.rolling(20).std()\nz = (spread - mean) / std\nsignal = np.where(z < -2, 1, np.where(z > 2, -1, 0))", "极端负偏离做多，极端正偏离做空的候选信号", { question: "z-score 的单位是什么？", options: ["价格单位", "标准差倍数", "成交量单位"], answer: 1, explanation: "z-score 表示观测离均值多少个标准差。" }, S.statsmodels),
  lesson("m3l8", "03", 26, "因子 IC 与分组检验", 34, "信号排序是否对应未来收益", "信息系数 IC 常用因子排名与未来收益排名的相关性。分组检验检查收益是否随因子分位单调变化。", ["先做横截面去极值与标准化", "IC 时间序列需要报告均值与稳定性", "分组收益必须扣除换手成本"], "计算 Spearman IC", "逐日计算因子与下一期收益的秩相关，并汇总均值和正 IC 比例。", "ic = factor.rank(axis=1).corrwith(future_returns.rank(axis=1), axis=1)\nic_mean = ic.mean()\nic_positive = (ic > 0).mean()", "得到 IC 序列、均值和胜率", { question: "IC 衡量什么？", options: ["因子排序与未来收益排序的一致性", "账户现金余额", "订单执行速度"], answer: 0, explanation: "IC 关注信号与后续横截面收益之间的排序关系。" }, S.mitFinance),
  lesson("m3l9", "03", 27, "阶段项目：复现一个因子", 55, "复现比发明更能训练研究能力", "选择公开定义的因子，严格记录股票池、频率、信号延迟、再平衡和成本。若结果不同，解释差异而不是调整到相同。", ["先冻结研究协议", "保留原始与清洗后数据统计", "报告成功与失败的稳健性检验"], "完成因子复现报告", "复现动量或均值回复因子，提交 IC、分组收益、换手和成本敏感性。", "# protocol -> data -> signal -> validation -> cost -> report", "一份能够由他人复跑的因子研究报告", { question: "复现结果与原研究不同应先做什么？", options: ["删除失败区间", "核对定义、数据与实现差异", "不断调参直到一致"], answer: 1, explanation: "差异本身是研究结果，应先系统定位来源。" }, S.mitFinance),
];

const m4 = [
  lesson("m4l1", "04", 28, "回测系统的四层结构", 28, "数据、信号、组合、执行分离", "可靠回测把数据处理、信号生成、组合构建和订单执行分开。模块边界让假设更容易测试，也方便替换成本模型。", ["信号不直接修改账户现金", "组合层把预测转成目标权重", "执行层处理订单、成交和费用"], "画出事件流", "用函数或类定义四层接口，并标明输入输出。", "data -> alpha -> portfolio -> execution -> ledger", "每一层责任单一且可独立测试", { question: "手续费应主要在哪一层处理？", options: ["数据层", "执行与账本层", "信号命名层"], answer: 1, explanation: "费用由实际订单和成交产生，应由执行/账本逻辑记录。" }, S.leanEngine),
  lesson("m4l2", "04", 29, "信号、持仓与交易", 26, "三个概念不能混用", "信号表达观点，持仓表达当前风险暴露，交易是从当前持仓走向目标持仓的变化量。把信号当交易会造成重复下单。", ["目标持仓减当前持仓等于交易量", "信号可连续但订单是离散事件", "持仓需随成交而非下单更新"], "从目标生成订单", "给定当前股数和目标权重，计算需要买卖的数量。", "target_shares = int(target_weight * equity / price)\norder_qty = target_shares - current_shares", "只有差额进入订单系统", { question: "交易量通常等于什么？", options: ["目标持仓 − 当前持仓", "信号 × 总成交量", "当前持仓 + 目标持仓"], answer: 0, explanation: "订单的任务是把当前状态移动到目标状态。" }, S.lean),
  lesson("m4l3", "04", 30, "时间前沿与未来函数", 32, "回测只能知道当时已经发生的事", "时间前沿是算法在某一时点允许访问的数据边界。用收盘价产生信号又假设同一收盘价成交，通常引入不可实现的未来信息。", ["字段时间戳不等于可用时间", "信号计算后至少延迟到可执行时点", "批量数组很容易无意访问未来"], "做一次时间错位审计", "为每个特征记录 information_time，为每个成交记录 execution_time，并检查先后顺序。", "assert (features.information_time <= orders.decision_time).all()\nassert (orders.decision_time <= fills.execution_time).all()", "不存在信息晚于决策的记录", { question: "用今日收盘生成信号，最早通常何时交易？", options: ["今日收盘之前", "收盘信息可得之后", "任意历史时点"], answer: 1, explanation: "必须等收盘信息实际可用后，才能作出决策并下单。" }, S.leanEngine),
  lesson("m4l4", "04", 31, "幸存者偏差与公司行动", 30, "今天存在的股票不是过去的全部", "只用当前成分股回测会排除退市和失败公司，夸大历史表现。拆分、分红、并购和代码变更也会改变价格与持仓。", ["股票池必须具有历史时点信息", "退市收益不能简单丢弃", "价格与持仓需一致处理公司行动"], "审查股票池", "为每个日期保存当时可交易资产集合，并统计进入、退出与缺失原因。", "universe_t = membership[membership.date <= decision_date]\nassert universe_t.known_at.le(decision_date).all()", "股票池只使用当时已知成分信息", { question: "幸存者偏差通常会怎样影响回测？", options: ["夸大表现", "保证低估表现", "只影响图表颜色"], answer: 0, explanation: "排除失败和退市资产通常让历史结果显得过于理想。" }, S.mitFinance),
  lesson("m4l5", "04", 32, "手续费、点差与换手", 28, "毛收益不是净收益", "交易成本包括显式佣金和隐式买卖价差。策略换手越高，成本假设越重要；零费率不代表零成本。", ["买入通常跨越卖价，卖出跨越买价", "成本应按实际交易额或数量计算", "报告成本敏感性而非单一点估计"], "为回测加入成本", "按成交额收取手续费和半点差成本，对比毛净收益。", "turnover = trades.abs().sum(axis=1)\ncost = turnover * (commission_bps + half_spread_bps) / 10_000\nnet_return = gross_return - cost", "净收益曲线低于毛收益曲线", { question: "零佣金意味着交易成本为零吗？", options: ["是", "否，仍有点差和冲击", "只对期货成立"], answer: 1, explanation: "报价点差、滑点和市场冲击仍会影响成交价格。" }, S.leanReality),
  lesson("m4l6", "04", 33, "滑点与市场冲击", 30, "订单会改变可获得的价格", "滑点是预期成交价与实际成交价之差，受波动、流动性、延迟和订单相对成交量影响。大额订单还可能产生市场冲击。", ["滑点可正可负但模型应保守", "订单占成交量比例是重要变量", "日线数据难以精确模拟盘中冲击"], "容量压力测试", "让滑点随订单占当日成交量比例平方增长，观察策略容量。", "participation = order_qty.abs() / bar_volume\nslippage = price_impact * participation.pow(2)\nfill_price = mid * (1 + side * slippage)", "资金规模上升时净收益逐步恶化", { question: "哪种订单通常市场冲击更大？", options: ["相对成交量更大的订单", "数量为零的订单", "已取消且未成交的订单"], answer: 0, explanation: "订单相对市场可用流动性越大，越可能推动价格。" }, S.leanReality),
  lesson("m4l7", "04", 34, "订单类型与成交模型", 32, "提交订单不等于成交", "市价单追求成交但不保证价格；限价单约束价格但不保证成交。回测需要明确触发、排队、部分成交和拒单逻辑。", ["限价触及不等于一定成交", "实盘成交是异步事件", "订单状态应形成有限状态机"], "模拟限价成交", "只在后续价格穿过限价时成交，并避免使用同一根柱内未知顺序。", "if next_bar.low <= buy_limit:\n    fill_price = min(next_bar.open, buy_limit)\nelse:\n    status = \"open\"", "订单可能成交，也可能继续挂单", { question: "限价买单的主要权衡是什么？", options: ["保证成交但不保证价格", "约束价格但可能不成交", "完全没有费用"], answer: 1, explanation: "限价保护最差价格，却承担错过成交的风险。" }, S.sec),
  lesson("m4l8", "04", 35, "绩效指标体系", 30, "收益必须与风险和时间一起看", "CAGR、Sharpe、Sortino、Calmar 和胜率回答不同问题。任何指标都应配合样本长度、回撤与交易数量解释。", ["Sharpe 对收益分布和频率敏感", "胜率不考虑盈亏幅度", "高 CAGR 可能伴随不可接受回撤"], "建立指标表", "为基准与策略计算 CAGR、年化波动、Sharpe、最大回撤和换手。", "metrics = pd.Series({\n  \"CAGR\": cagr, \"Vol\": annual_vol,\n  \"Sharpe\": sharpe, \"MaxDD\": max_drawdown,\n  \"Turnover\": turnover.mean(),\n})", "策略与基准使用相同口径的指标表", { question: "胜率高能保证策略赚钱吗？", options: ["能", "不能，还取决于盈亏幅度和成本", "只要超过 50% 就能"], answer: 1, explanation: "少数大亏可以抵消多数小赚，成本也可能吞掉优势。" }, S.lean),
  lesson("m4l9", "04", 36, "回撤与绩效归因", 32, "策略在何时、为何赚钱", "回撤衡量净值从历史高点的下降。归因把收益拆到资产、因子、行业或交易，帮助判断利润是否来自预期机制。", ["最大回撤忽略恢复时间信息", "水下曲线展示回撤持续期", "归因必须与组合权重和时间对齐"], "绘制水下曲线", "计算运行高点、回撤和最长恢复期，并标记最深区间。", "wealth = (1 + returns).cumprod()\npeak = wealth.cummax()\ndrawdown = wealth / peak - 1", "得到随时间变化的回撤序列", { question: "回撤从什么基准计算？", options: ["历史运行高点", "第一笔成交量", "平均手续费"], answer: 0, explanation: "回撤表示当前净值相对之前最高净值的下降。" }, S.lean),
  lesson("m4l10", "04", 37, "Walk-forward 回测", 34, "模拟研究随时间推进", "Walk-forward 在过去窗口训练或选择参数，在随后未见区间验证，再向前滚动。它比一次切分更接近真实更新流程。", ["每折训练只使用更早数据", "参数选择发生在测试期之前", "汇总所有测试折而非挑最好一折"], "实现滚动训练测试", "生成训练两年、测试三个月的时间切分，并记录每折参数和结果。", "for train_idx, test_idx in splitter.split(data):\n    model.fit(X.iloc[train_idx], y.iloc[train_idx])\n    pred.iloc[test_idx] = model.predict(X.iloc[test_idx])", "每个预测只来自更早训练窗口", { question: "Walk-forward 的测试集相对训练集在哪里？", options: ["训练集之前", "训练集之后", "随机混合其中"], answer: 1, explanation: "测试区间必须在对应训练区间之后，才能模拟时间推进。" }, S.tss),
  lesson("m4l11", "04", 38, "阶段项目：迷你回测器", 65, "用小系统理解大引擎", "从透明的小型事件回测器开始，实现时间前沿、目标持仓、成交、费用和账本。测试比功能数量更重要。", ["用手算样例验证每笔现金变化", "断言未来数据不可访问", "输出订单、成交和持仓三类日志"], "完成事件驱动回测器", "实现 DataFeed、Strategy、Portfolio、Broker 和 Ledger 五个模块，并测试一条均线策略。", "for event in data_feed:\n    signal = strategy.on_bar(event)\n    orders = portfolio.rebalance(signal)\n    fills = broker.execute(orders, event)\n    ledger.apply(fills)", "可重放、可审计、含成本的迷你引擎", { question: "回测器最先应该验证什么？", options: ["支持最多指标", "账本与时间顺序正确", "界面动画流畅"], answer: 1, explanation: "现金、持仓和信息时序错误会让所有绩效结果失去意义。" }, S.leanEngine),
];

const m5 = [
  lesson("m5l1", "05", 39, "标签、特征与预测时点", 30, "先定义何时预测什么", "标签是未来需要预测的量，特征是决策时已知信息。明确预测时点、持有期和标签重叠，是避免泄漏的第一步。", ["标签窗口必须位于特征之后", "重叠标签会导致样本依赖", "交易决策时间要晚于所有特征发布时间"], "绘制信息时间线", "为特征、决策、成交和标签结束标注时间戳。", "feature_time <= decision_time <= execution_time < label_end", "一条没有时间倒置的样本定义", { question: "预测下一周收益时，标签属于哪个时间？", options: ["决策之前", "决策之后", "任意时间"], answer: 1, explanation: "标签代表决策后才发生的结果，不能进入特征。" }, S.sklearn),
  lesson("m5l2", "05", 40, "预处理与 Pipeline", 28, "让训练期参数只来自训练集", "标准化、缺失填补和特征选择都会从数据估计参数。Pipeline 保证这些步骤在每个训练折内部拟合，避免测试信息渗入。", ["先切分再拟合预处理", "Pipeline 连接变换与模型", "所有数据驱动处理都需放入验证流程"], "构建无泄漏流水线", "把中位数填补、标准化和岭回归组成 Pipeline。", "pipe = Pipeline([\n  (\"impute\", SimpleImputer(strategy=\"median\")),\n  (\"scale\", StandardScaler()),\n  (\"model\", Ridge(alpha=1.0)),\n])", "每折只用训练数据估计填补与缩放参数", { question: "标准化器应在哪些数据上 fit？", options: ["全部数据", "每折训练数据", "只在测试数据"], answer: 1, explanation: "测试集统计量在真实预测时未知，不能参与预处理拟合。" }, S.sklearn),
  lesson("m5l3", "05", 41, "时间序列交叉验证", 32, "验证必须尊重顺序", "普通随机 K 折会让未来样本进入训练。TimeSeriesSplit 使用递增训练窗口和随后测试窗口，还可设置 gap 隔离相邻标签。", ["训练索引始终早于测试索引", "gap 缓解标签窗口重叠", "每折测试期最好长度一致"], "可视化五折切分", "打印每折训练末日、测试首日与 gap，确认顺序。", "splitter = TimeSeriesSplit(n_splits=5, test_size=60, gap=5)\nfor tr, te in splitter.split(X):\n    print(index[tr[-1]], index[te[0]])", "每折测试均位于训练之后并保留间隔", { question: "为什么随机 K 折不适合时间预测？", options: ["运行太快", "可能用未来训练、过去测试", "不能计算均值"], answer: 1, explanation: "随机打乱破坏时间因果顺序，造成不现实的验证。" }, S.tss),
  lesson("m5l4", "05", 42, "数据泄漏排查", 32, "异常高分首先当作警报", "泄漏可能来自未来字段、全样本标准化、修订后基本面、目标编码或重复样本。模型越复杂，越容易利用微小泄漏。", ["为每个特征记录可得时间", "从简单基准逐步增加特征", "打乱标签测试可发现部分泄漏"], "执行泄漏审计", "删除可疑特征、加入时间 gap，并比较随机标签下的表现。", "y_shuffled = y.sample(frac=1, random_state=42).to_numpy()\nscore = cross_val_score(pipe, X, y_shuffled, cv=splitter).mean()", "随机标签成绩应接近无预测能力基准", { question: "随机标签仍有很高分通常意味着什么？", options: ["模型非常优秀", "验证或数据可能泄漏", "市场完全有效"], answer: 1, explanation: "随机标签没有稳定信号，高分常指向切分、重复或处理泄漏。" }, S.sklearn),
  lesson("m5l5", "05", 43, "回归、分类与基准模型", 30, "先定义目标再选模型", "预测收益数值是回归，预测方向或是否超阈值是分类。任何模型都应与零预测、历史均值或简单线性模型比较。", ["分类阈值影响交易频率", "准确率不适合严重不平衡标签", "预测指标必须连接到净交易收益"], "建立朴素基准", "比较历史均值、线性模型与树模型的时间外表现。", "baseline = DummyRegressor(strategy=\"mean\")\nmodels = {\"baseline\": baseline, \"ridge\": Ridge(), \"tree\": RandomForestRegressor(max_depth=3)}", "复杂模型只有稳定超过基准才值得保留", { question: "方向标签只有 5% 为正时应谨慎使用什么？", options: ["准确率", "样本数", "时间索引"], answer: 0, explanation: "总预测为负也有 95% 准确率，因此需看 precision、recall 等指标。" }, S.sklearn),
  lesson("m5l6", "05", 44, "特征重要性与稳定性", 32, "解释必须跨时间成立", "单次特征重要性可能受共线性和随机性影响。应跨折记录符号、排名和贡献，检查模型是否依赖某一短暂时期。", ["置换重要性应在验证集计算", "相关特征会分摊重要性", "稳定性比单次最高重要性更可信"], "跨折记录重要性", "每折训练后计算验证集置换重要性，并汇总均值与标准差。", "importance = []\nfor train, test in splitter.split(X):\n    pipe.fit(X.iloc[train], y.iloc[train])\n    importance.append(permutation_importance(pipe, X.iloc[test], y.iloc[test]).importances_mean)", "得到每个特征跨折的分布而非单一点", { question: "重要性跨折频繁变号说明什么？", options: ["关系可能不稳定", "保证稳健", "无需验证"], answer: 0, explanation: "符号和排名不稳定意味着关系可能依赖特定样本或状态。" }, S.sklearn),
  lesson("m5l7", "05", 45, "多重检验与回测过拟合", 36, "尝试越多，偶然赢家越多", "测试大量参数和策略后只报告最佳结果，会产生选择偏差。应记录实验总数、保留真正未见数据，并评估回测过拟合概率。", ["普通 holdout 也会被反复查看污染", "Sharpe 需根据选择过程修正", "实验日志是统计控制的一部分"], "模拟策略竞赛", "生成 100 条无真实优势的随机策略，观察最佳 Sharpe 仍可能很高。", "sharpes = []\nfor _ in range(100):\n    noise = rng.normal(0, 0.01, 500)\n    sharpes.append(np.sqrt(252) * noise.mean() / noise.std())\nprint(max(sharpes))", "无优势策略中也会出现漂亮赢家", { question: "为什么尝试 1000 个策略更容易得到高 Sharpe？", options: ["市场必然更有效", "极值选择放大偶然结果", "交易成本自动下降"], answer: 1, explanation: "在大量噪声试验中挑最大值，会系统性选择幸运样本。" }, S.pbo),
  lesson("m5l8", "05", 46, "阶段项目：无泄漏预测实验", 65, "把模型放进完整研究协议", "项目从标签时间线开始，使用 Pipeline、TimeSeriesSplit、基准模型和成本后评价，并提交特征稳定性与失败分析。", ["预先登记主要评价指标", "所有模型共享相同时间切分", "最终测试集只打开一次"], "完成预测研究", "预测下一周横截面收益或方向，提交时间外预测、成本后组合结果和模型卡。", "# timeline -> pipeline -> CV -> baseline -> cost -> stability -> model card", "一份可以审计的端到端预测实验", { question: "最终测试集应使用几次？", options: ["反复调到满意", "主要决策冻结后使用一次", "训练每轮都使用"], answer: 1, explanation: "重复查看会让测试集变成隐性训练集，失去独立评价意义。" }, S.sklearn),
];

const m6 = [
  lesson("m6l1", "06", 47, "从研究代码到生产策略", 30, "相同逻辑，不同运行环境", "研究环境适合探索，生产环境要求确定性、错误处理、配置管理和可观测性。核心信号逻辑应共享，而不是复制两份。", ["把参数移出代码并版本化", "输入输出使用明确数据契约", "研究与生产使用同一组单元测试"], "拆分策略包", "把信号函数、配置、数据适配器和运行入口拆成模块。", "strategy/\n  signals.py\n  portfolio.py\n  config.py\n  adapters/\n  tests/", "研究 Notebook 只调用可测试的策略包", { question: "研究到生产最危险的做法是什么？", options: ["共享经过测试的核心逻辑", "手工复制并改写一份策略", "固定配置版本"], answer: 1, explanation: "两份逻辑会逐渐偏离，使回测和实盘不再等价。" }, S.lean),
  lesson("m6l2", "06", 48, "订单状态机与幂等", 32, "每个订单都有生命周期", "订单可能经历 new、submitted、partially_filled、filled、cancelled、rejected。幂等处理确保重复消息不会重复修改持仓。", ["使用唯一订单与成交 ID", "持仓只随新成交增量更新", "重连后先对账再继续交易"], "实现状态转换", "为合法状态变化建立映射，并拒绝 filled 回到 submitted。", "allowed = {\n  \"new\": {\"submitted\", \"rejected\"},\n  \"submitted\": {\"partial\", \"filled\", \"cancelled\"},\n  \"partial\": {\"partial\", \"filled\", \"cancelled\"},\n}", "非法状态转换触发告警而非静默接受", { question: "幂等处理解决什么问题？", options: ["重复消息造成重复记账", "提高预测准确率", "自动选择股票"], answer: 0, explanation: "同一成交消息重复到达时，幂等逻辑保证只应用一次。" }, S.lean),
  lesson("m6l3", "06", 49, "仓位、限额与风险闸门", 32, "风险控制先于策略意见", "仓位由信号、波动、流动性和硬限额共同决定。风险闸门应能在策略异常时拒绝新订单或降低敞口。", ["设置单资产与组合总敞口上限", "限制订单占市场成交量比例", "回撤触发规则需预先定义"], "编写预交易检查", "检查目标仓位、订单名义金额、集中度和日损失限制。", "checks = [\n  abs(target_weight) <= max_weight,\n  gross_exposure <= gross_limit,\n  order_notional <= adv * participation_limit,\n  daily_pnl >= -daily_loss_limit,\n]\nallow = all(checks)", "任何一项失败都拒绝或缩减订单", { question: "风险限额应在什么时候检查？", options: ["下单前", "年度报告后", "只在盈利时"], answer: 0, explanation: "预交易检查能在风险进入账户之前阻止不合规订单。" }, S.leanReality),
  lesson("m6l4", "06", 50, "监控、日志与告警", 30, "看见策略正在发生什么", "监控应覆盖数据新鲜度、信号、订单、成交、持仓、盈亏和系统健康。告警需要阈值、严重级别和处理手册。", ["结构化日志便于查询和对账", "区分业务异常与系统异常", "告警必须指向明确操作"], "设计监控面板", "列出关键指标、刷新频率、告警阈值和责任动作。", "metrics = [\n  \"data_lag_seconds\", \"order_reject_rate\",\n  \"position_drift\", \"realized_slippage_bps\",\n  \"daily_pnl\", \"heartbeat\",\n]", "一份指标到响应动作的运行手册", { question: "没有处理动作的告警容易导致什么？", options: ["告警疲劳", "更高 Sharpe", "数据自动修复"], answer: 0, explanation: "无法行动的噪声会降低团队对真正严重告警的敏感度。" }, S.lean),
  lesson("m6l5", "06", 51, "模拟盘与上线检查", 35, "先验证流程，不用真钱验证代码", "模拟盘检验数据、时钟、订单状态、重连和监控，但不能完全复制真实流动性与市场冲击。上线需分阶段、小规模并设退出条件。", ["比较模拟成交与可观察市场价格", "演练断网、重复消息和数据中断", "上线规模逐步增加而非一次到位"], "完成上线清单", "执行一次交易日演练，记录预期事件、实际事件和差异。", "checklist = {\n  \"data\": True, \"clock\": True, \"risk\": True,\n  \"orders\": True, \"reconciliation\": True,\n  \"alerts\": True, \"kill_switch\": True,\n}", "所有关键流程通过并有失败回退方案", { question: "模拟盘不能充分验证什么？", options: ["代码是否运行", "真实市场冲击", "日志是否写入"], answer: 1, explanation: "模拟成交无法完全复现真实排队、对手盘与自身订单冲击。" }, S.lean),
  lesson("m6l6", "06", 52, "研究报告与模型卡", 38, "让结论接受审查", "完整报告说明问题、数据、方法、验证、成本、风险、限制和复现步骤。模型卡还记录训练窗口、特征、阈值和监控要求。", ["主结论与探索性结果分开", "展示负面和不显著结果", "记录模型不适用的市场状态"], "撰写策略说明书", "用一页执行摘要和附录描述策略机制、证据、成本、容量与停止条件。", "report = [\n  \"thesis\", \"data\", \"method\", \"validation\",\n  \"costs\", \"capacity\", \"risks\", \"limitations\",\n  \"reproduction\", \"monitoring\",\n]", "一份投资、研究和工程人员都能审阅的文档", { question: "报告中为什么要写停止条件？", options: ["提前定义何时认为假设失效", "让报告更长", "隐藏回撤"], answer: 0, explanation: "预先定义停止条件可减少亏损后随意改变解释。" }, S.mitFinance),
  lesson("m6l7", "06", 53, "毕业项目：策略研究与答辩", 90, "完成一条可复现研究链", "毕业项目不以最高收益为目标，而以问题清晰、实现正确、验证诚实和风险边界明确为标准。允许结论是“没有发现可交易优势”。", ["提交代码、环境、数据字典和报告", "准备反方视角解释最脆弱假设", "明确下一步实验而不是承诺收益"], "完成毕业策略", "选择一个机制明确的低频策略，完成研究协议、数据、回测、稳健性、成本、模拟盘计划和十分钟答辩。", "deliverables = {\n  \"protocol\", \"repository\", \"data_dictionary\",\n  \"backtest\", \"robustness\", \"cost_model\",\n  \"risk_limits\", \"paper_plan\", \"report\",\n}", "一份即使结果为负也具有研究价值的毕业作品", { question: "毕业项目最重要的评价标准是什么？", options: ["回测收益最高", "研究链条正确、透明、可复现", "图表数量最多"], answer: 1, explanation: "量化研究首先追求可验证的过程；漂亮但不可复现的收益没有可信度。" }, S.mitFinance),
];

export const courseModules: CourseModule[] = [
  { id: "01", title: "数据与语言", subtitle: "Python · NumPy · Pandas", weeks: "第 1—2 周", project: "建立第一份价格研究笔记", tone: "teal", lessons: m1 },
  { id: "02", title: "概率与风险", subtitle: "分布 · 风险 · 组合数学", weeks: "第 3—5 周", project: "制作个人风险仪表盘", tone: "sienna", lessons: m2 },
  { id: "03", title: "研究与检验", subtitle: "时间序列 · 假设 · 因子", weeks: "第 6—8 周", project: "复现一项经典因子研究", tone: "olive", lessons: m3 },
  { id: "04", title: "回测与归因", subtitle: "事件驱动 · 成本 · 偏差", weeks: "第 9—11 周", project: "从零构建迷你回测器", tone: "navy", lessons: m4 },
  { id: "05", title: "模型与验证", subtitle: "机器学习 · Walk-forward", weeks: "第 12—14 周", project: "完成无泄漏的预测实验", tone: "plum", lessons: m5 },
  { id: "06", title: "研究到模拟盘", subtitle: "执行 · 监控 · 研究报告", weeks: "第 15—16 周", project: "提交毕业策略与答辩", tone: "charcoal", lessons: m6 },
];

export const allLessons = courseModules.flatMap((module) => module.lessons);

export function getLesson(id: string): Lesson {
  return allLessons.find((item) => item.id === id) ?? allLessons[0];
}
