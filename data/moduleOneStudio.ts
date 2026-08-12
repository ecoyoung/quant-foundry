export type LessonEnrichment = {
  objectives: [string, string, string];
  checkpoint: string;
  mistake: string;
  hint: string;
};

export const moduleOneStudio: Record<string, LessonEnrichment> = {
  m1l1: {
    objectives: ["区分价格与收益率", "计算简单收益率", "解释涨跌不对称"],
    checkpoint: "若 100 → 110 → 100，请先写出两个分母，再运行代码。",
    mistake: "把 +10% 与 −10% 当作互相抵消；两次变化的计算基数并不相同。",
    hint: "收益率 = 本期价格 ÷ 上期价格 − 1。",
  },
  m1l2: {
    objectives: ["读懂 OHLCV", "编写价格柱校验", "识别数据字典依赖"],
    checkpoint: "尝试把某行 high 改得低于 close，观察校验结果。",
    mistake: "默认不同数据商的 volume 单位一致。",
    hint: "最高价至少覆盖 open 与 close，最低价至多等于二者较小值。",
  },
  m1l3: {
    objectives: ["写纯函数", "使用类型标注", "显式处理非法输入"],
    checkpoint: "分别测试正常价格与 previous=0 的行为。",
    mistake: "用打印代替返回值，导致后续研究步骤无法复用结果。",
    hint: "先验证前一期价格为正，再返回 current / previous - 1。",
  },
  m1l4: {
    objectives: ["创建 ndarray", "理解向量切片", "向量化计算收益"],
    checkpoint: "确认长度为 n 的价格向量只产生 n−1 个收益率。",
    mistake: "对不同长度切片直接运算，或忽略数组 shape。",
    hint: "用 prices[1:] 对齐 prices[:-1]。",
  },
  m1l5: {
    objectives: ["使用 DataFrame", "按资产透视数据", "对齐时间索引"],
    checkpoint: "检查矩阵的行是日期、列是资产，而不是反过来。",
    mistake: "把索引错位后的 NaN 当成真实的零收益。",
    hint: "先 pivot，再 pct_change；不要过早 fillna(0)。",
  },
  m1l6: {
    objectives: ["建立质量报告", "理解复权价格", "保留原始异常证据"],
    checkpoint: "比较 ALFA 拆分日 raw close 与 adjusted close。",
    mistake: "直接删除异常行，却不记录规则、数量和影响。",
    hint: "至少统计缺失、非正价格与重复日期。",
  },
  m1l7: {
    objectives: ["解析时间索引", "重采样分钟数据", "正确聚合 OHLCV"],
    checkpoint: "说明 open、high、low、close、volume 各自的聚合函数。",
    mistake: "对所有字段统一求平均，得到不存在的价格柱。",
    hint: "OHLC 分别用 first、max、min、last；volume 用 sum。",
  },
  m1l8: {
    objectives: ["提出研究问题", "生成数据质量摘要", "写出限制与复现路径"],
    checkpoint: "先完成项目工作台的研究命题，再运行固定数据。",
    mistake: "只展示漂亮指标，却不交代样本、调整方法和局限。",
    hint: "一份可信研究笔记必须回答：数据是什么、怎么算、哪里可能错。",
  },
};

export function browserCodeFor(lessonId: string) {
  return `import json\nfrom cases import run_case\n\n# cases 是本课程的案例路由模块；“源码定位”会显示本次实际进入的分支\nresult = run_case("${lessonId}")\nprint(json.dumps(result, ensure_ascii=False, indent=2))`;
}
