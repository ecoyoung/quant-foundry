# 权威资料目录

## A. 数学、统计与金融基础

### MIT 15.450 — Analytics of Finance

- 来源：[MIT OpenCourseWare](https://ocw.mit.edu/courses/15-450-analytics-of-finance-fall-2010/)
- 类型：研究生公开课
- 内容：金融计量、统计推断、动态优化、Monte Carlo、随机微积分
- 课程映射：M02 概率与风险、M03 研究与检验
- 建议：零基础阶段先读课程说明与概率复习，随机微积分留到进阶阶段。

### MIT 18.642 — Topics in Mathematics with Applications in Finance

- 来源：[MIT OpenCourseWare](https://ocw.mit.edu/courses/18-642-topics-in-mathematics-with-applications-in-finance-fall-2024/)
- 类型：本科高年级公开课
- 内容：衍生品、随机模型、时间序列与金融数学
- 课程映射：M03、M05
- 本地文件：`downloads/mit-time-series-18-642.pdf`

### MIT 18.05 — Introduction to Probability and Statistics

- 来源：[MIT OpenCourseWare](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/)
- 类型：本科公开课
- 内容：概率模型、估计、假设检验与回归
- 课程映射：M02

## B. 市场机制与风险

### SEC — Trading Basics

- 来源：[U.S. Securities and Exchange Commission](https://www.sec.gov/file/trading101basicspdf)
- 类型：监管机构投资者教育材料
- 内容：市价单、限价单、止损单及成交价格风险
- 课程映射：M01 市场数据、M04 执行与成本
- 离线状态：SEC 对自动下载返回 403，因此保留官方 PDF 入口，未用第三方镜像替代。

## C. Python 数据工具

### NumPy User Guide

- 来源：[NumPy 官方文档](https://numpy.org/doc/stable/user/)
- PDF：[NumPy User Guide PDF](https://numpy.org/doc/stable/numpy-user.pdf)
- 内容：数组、索引、广播、数值计算
- 课程映射：M01
- 本地文件：`downloads/numpy-user-guide.pdf`

### pandas User Guide

- 来源：[pandas 官方文档](https://pandas.pydata.org/docs/user_guide/)
- 内容：DataFrame、缺失值、窗口函数、时间序列
- 课程映射：M01、M03
- 说明：网页文档更新频繁，保留官方入口，不制作过期镜像。

### scikit-learn TimeSeriesSplit

- 来源：[scikit-learn 官方文档](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html)
- 内容：保持时间顺序的交叉验证；避免“用未来预测过去”
- 课程映射：M05

## D. 回测、验证与研究规范

### The Probability of Backtest Overfitting

- 作者：David H. Bailey、Jonathan Borwein、Marcos López de Prado、Qiji Jim Zhu
- 来源：[SSRN 条目](https://papers.ssrn.com/sol3/Papers.cfm?abstract_id=2326253)
- 内容：组合对称交叉验证与回测过拟合概率
- 课程映射：M04、M05
- 说明：论文受版权保护，本地只保存书目信息和链接。

### QuantConnect LEAN 文档

- 研究与算法：[Writing Algorithms](https://www.quantconnect.com/docs/v2/writing-algorithms)
- 引擎模型：[Algorithm Engine](https://www.quantconnect.com/docs/v2/writing-algorithms/key-concepts/algorithm-engine)
- 订单与成交：[Trading and Orders](https://www.quantconnect.com/docs/v2/writing-algorithms/trading-and-orders/key-concepts)
- 内容：事件驱动回测、时间前沿、滑点、手续费、成交模型
- 课程映射：M04、M06

## E. 行业语言选择依据

### Jane Street — Technology and Python

- 来源：[Jane Street Software Engineer](https://www.janestreet.com/join-jane-street/position/8075770002/)
- 结论：OCaml 是其主要基础设施语言；Python 是研究与交易工作中数据分析、可视化和机器学习的重要语言。
- 课程决策：初学与研究主线采用 Python；在工程进阶中介绍 C++、Rust、OCaml 的适用场景。
