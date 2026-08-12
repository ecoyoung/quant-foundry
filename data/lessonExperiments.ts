export type LessonExperiment = {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  standard: number;
  question: string;
  code: (value: number) => string;
};

type Seed = Omit<LessonExperiment, "code">;

const seeds: Record<string, Seed> = {
  m1l1:{label:"价格变动幅度",unit:"%",min:-10,max:10,step:0.5,standard:2,question:"同一笔价格变化如何映射为简单收益率？"},
  m1l2:{label:"最低有效价格",unit:"元",min:0,max:20,step:1,standard:1,question:"数据清洗阈值会删除多少观测？"},
  m1l3:{label:"复权因子",unit:"倍",min:0.5,max:2,step:0.05,standard:1,question:"公司行动调整如何改变收益率口径？"},
  m1l4:{label:"向量长度",unit:"项",min:10,max:500,step:10,standard:100,question:"向量化计算随样本量如何扩展？"},
  m1l5:{label:"资产数量",unit:"只",min:2,max:30,step:1,standard:5,question:"宽表维度如何随资产池扩大？"},
  m1l6:{label:"缺失率警戒线",unit:"%",min:0,max:20,step:1,standard:5,question:"质量阈值如何影响可用数据？"},
  m1l7:{label:"聚合窗口",unit:"分钟",min:1,max:60,step:1,standard:5,question:"时间粒度如何改变柱线数量？"},
  m1l8:{label:"年化交易日",unit:"天",min:50,max:365,step:1,standard:252,question:"年化假设如何改变收益与波动？"},
  m2l1:{label:"样本数量",unit:"次",min:100,max:5000,step:100,standard:1000,question:"大数定律如何收窄估计误差？"},
  m2l2:{label:"分布自由度",unit:"df",min:3,max:30,step:1,standard:8,question:"厚尾程度如何改变极端风险？"},
  m2l3:{label:"滚动窗口",unit:"日",min:10,max:120,step:5,standard:20,question:"波动估计在稳定与灵敏间如何权衡？"},
  m2l4:{label:"相关窗口",unit:"日",min:10,max:252,step:2,standard:60,question:"相关性估计对窗口多敏感？"},
  m2l5:{label:"置信水平",unit:"%",min:90,max:99,step:1,standard:95,question:"更高置信水平需要怎样的风险缓冲？"},
  m2l6:{label:"模拟路径",unit:"条",min:100,max:5000,step:100,standard:1000,question:"蒙特卡洛精度如何随路径数变化？"},
  m2l7:{label:"最大回看期",unit:"日",min:20,max:500,step:10,standard:252,question:"回撤统计对历史长度有多敏感？"},
  m2l8:{label:"组合权重 A",unit:"%",min:0,max:100,step:5,standard:50,question:"资产权重如何改变组合风险？"},
  m2l9:{label:"压力冲击",unit:"%",min:-30,max:0,step:1,standard:-10,question:"压力情景如何传导到组合损失？"},
  m2l10:{label:"报告置信水平",unit:"%",min:90,max:99,step:1,standard:95,question:"风险报告应如何解释尾部口径？"},
  m3l1:{label:"特征滞后",unit:"日",min:1,max:20,step:1,standard:1,question:"滞后设置能否消除未来信息？"},
  m3l2:{label:"自相关阶数",unit:"阶",min:1,max:30,step:1,standard:5,question:"序列记忆会持续多长？"},
  m3l3:{label:"均线窗口",unit:"日",min:5,max:120,step:5,standard:20,question:"趋势特征如何在噪声与延迟间权衡？"},
  m3l4:{label:"训练样本",unit:"期",min:50,max:1000,step:50,standard:250,question:"回归估计是否受样本规模影响？"},
  m3l5:{label:"岭惩罚",unit:"λ",min:0,max:10,step:0.25,standard:1,question:"正则化如何抑制不稳定系数？"},
  m3l6:{label:"动量窗口",unit:"日",min:5,max:252,step:5,standard:60,question:"信号周期如何改变横截面排序？"},
  m3l7:{label:"标准化窗口",unit:"日",min:10,max:252,step:2,standard:60,question:"标准化基准如何改变信号尺度？"},
  m3l8:{label:"最少资产数",unit:"只",min:3,max:100,step:1,standard:20,question:"IC 估计需要怎样的横截面宽度？"},
  m3l9:{label:"信号持有期",unit:"日",min:1,max:60,step:1,standard:20,question:"研究报告如何呈现持有期敏感性？"},
  m4l1:{label:"目标仓位",unit:"%",min:-100,max:100,step:5,standard:50,question:"信号如何转换为受约束仓位？"},
  m4l2:{label:"最大单资产权重",unit:"%",min:5,max:100,step:5,standard:30,question:"集中度约束如何改变可行组合？"},
  m4l3:{label:"风险厌恶系数",unit:"λ",min:1,max:20,step:1,standard:5,question:"优化器如何权衡收益与方差？"},
  m4l4:{label:"单边成本",unit:"bps",min:0,max:50,step:1,standard:10,question:"成本会吞噬多少毛收益？"},
  m4l5:{label:"冲击系数",unit:"bps",min:0,max:100,step:2,standard:20,question:"市场冲击如何随参数放大？"},
  m4l6:{label:"调仓周期",unit:"日",min:1,max:60,step:1,standard:20,question:"降低换手是否改善净收益？"},
  m4l7:{label:"初始净值",unit:"万",min:10,max:1000,step:10,standard:100,question:"资金规模如何影响可交易容量？"},
  m4l8:{label:"目标波动率",unit:"%",min:2,max:30,step:1,standard:10,question:"波动率目标如何缩放杠杆？"},
  m4l9:{label:"最大换手率",unit:"%",min:5,max:200,step:5,standard:50,question:"换手约束如何改变执行路径？"},
  m4l10:{label:"成交参与率",unit:"%",min:1,max:30,step:1,standard:10,question:"参与率如何影响滑点与完成时间？"},
  m4l11:{label:"回测成本假设",unit:"bps",min:0,max:50,step:1,standard:10,question:"策略报告在什么成本下失效？"},
  m5l1:{label:"测试集比例",unit:"%",min:10,max:50,step:5,standard:20,question:"留出比例如何改变训练与评估证据？"},
  m5l2:{label:"训练测试间隔",unit:"日",min:0,max:30,step:1,standard:5,question:"隔离窗口如何降低标签泄漏？"},
  m5l3:{label:"滚动折数",unit:"折",min:2,max:12,step:1,standard:5,question:"更多时序折能否提高稳定性判断？"},
  m5l4:{label:"参数候选数",unit:"组",min:2,max:100,step:2,standard:20,question:"搜索空间越大是否越容易过拟合？"},
  m5l5:{label:"显著性水平",unit:"%",min:1,max:20,step:1,standard:5,question:"多重检验下错误发现如何累积？"},
  m5l6:{label:"特征数量",unit:"个",min:1,max:100,step:1,standard:10,question:"自由度膨胀如何侵蚀样本外表现？"},
  m5l7:{label:"最低样本外夏普",unit:"x",min:0,max:2,step:0.1,standard:0.5,question:"策略晋级门槛应有多严格？"},
  m5l8:{label:"稳定性容忍度",unit:"%",min:5,max:50,step:5,standard:20,question:"验证报告如何定义可接受漂移？"},
  m6l1:{label:"单资产仓位上限",unit:"%",min:1,max:30,step:1,standard:10,question:"硬约束会拒绝多少目标仓位？"},
  m6l2:{label:"单日亏损熔断",unit:"%",min:1,max:15,step:1,standard:5,question:"熔断阈值如何影响生存与机会成本？"},
  m6l3:{label:"订单超时",unit:"秒",min:1,max:120,step:1,standard:30,question:"超时阈值如何平衡成交与陈旧风险？"},
  m6l4:{label:"最大重试次数",unit:"次",min:0,max:10,step:1,standard:3,question:"重试策略如何避免重复下单？"},
  m6l5:{label:"告警延迟上限",unit:"秒",min:1,max:300,step:5,standard:30,question:"监控延迟会留下多大的风险盲区？"},
  m6l6:{label:"风险预算使用率",unit:"%",min:10,max:100,step:5,standard:70,question:"何时应主动降杠杆？"},
  m6l7:{label:"上线观察期",unit:"日",min:5,max:90,step:5,standard:20,question:"上线清单需要多长的影子运行证据？"},
};

function codeFor(lessonId: string, _seed: Seed, value: number): string {
  return `import json\nfrom cases import run_experiment\n\n# 使用本课固定 CSV 与 cases.py 中的真实计算路径\nresult = run_experiment("${lessonId}", ${value})\nprint(json.dumps(result, ensure_ascii=False, indent=2))`;
}

export const lessonExperiments: Record<string, LessonExperiment> = Object.fromEntries(
  Object.entries(seeds).map(([lessonId, seed]) => [lessonId, { ...seed, code: (value: number) => codeFor(lessonId, seed, value) }]),
);
