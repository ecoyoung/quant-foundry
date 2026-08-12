# GitHub 项目清单

## 首选参考

### QuantConnect / LEAN

- 仓库：https://github.com/QuantConnect/Lean
- 技术：C# 引擎，Python / C# 策略接口
- 价值：专业级事件驱动架构，覆盖研究、回测、现实成交建模和实盘。
- 课程用途：学习模块边界和回测到实盘的一致性，不要求初学者直接阅读整个引擎源码。

### vectorbt

- 仓库：https://github.com/polakowo/vectorbt
- 技术：Python、NumPy、pandas、Numba
- 价值：快速向量化研究与参数扫描。
- 注意：容易快速产生大量回测，因此必须同时学习多重检验和过拟合控制。

### bt

- 仓库：https://github.com/pmorissette/bt
- 技术：Python
- 价值：组合策略构建方式清晰，适合资产配置实验。
- 注意：项目自身说明仍处于 alpha 阶段，教学中不把它视为实盘基础设施。

### NautilusTrader

- 仓库：https://github.com/nautechsystems/nautilus_trader
- 技术：Rust 核心、Python API
- 价值：观察高性能事件驱动系统、精确时间与订单状态建模。
- 注意：工程复杂度较高，放在 M06 扩展阅读。

## 选择原则

课程不会把某个框架的 API 当作量化知识本身。先使用 NumPy、pandas 写出透明的小型实现，再对照成熟引擎理解数据处理、组合构建、风险和执行为何需要分层。
