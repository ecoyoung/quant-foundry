# 量研课维护者手册

## 项目结构

- `data/course.ts`：53 节课程文字、检查题和来源。
- `courseware/cases.py`：标准案例及真实参数实验。
- `courseware/data/`：确定性合成数据。
- `courseware/outputs/`：标准输出快照。
- `courseware/export_implementations.py`：源码定位、数据预览和引导练习导出。
- `components/`：学习器、研究工作台、可靠性与 PWA 界面。
- `public/sw.js`：离线缓存策略。

## 修改课程

1. 修改课程文字或 `cases.py`。
2. 若输出预期发生变化，确认其研究含义后运行 `python3 courseware/verify_all.py`。
3. 运行 `python3 courseware/export_implementations.py`。
4. 同步 `courseware/cases.py`、`common.py` 到 `public/course-assets/`。
5. 执行完整发布检查。

禁止用真实证券名称或暗示收益承诺替换合成教学数据。新增数据必须固定随机种子、记录生成器并进入清单校验。

## 浏览器存储

所有持久键使用 `quant-` 前缀。改变结构时必须提高备份或记录版本，并在读取路径加入迁移逻辑；不可静默丢弃旧数据。
