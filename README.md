**简体中文** | [English](README.en.md)

# 量研课 Quantitative Research Lab

一套本地优先、可安装、可离线的 53 节量化研究课程。使用 Next.js、React、TypeScript 与浏览器端 Pyodide，提供固定合成数据、完整 Python 实现、自动验证、参数实验、六阶段项目和个人研究档案。

## 快速开始

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 4173
```

打开 <http://127.0.0.1:4173/>。

## Docker 与域名部署

项目包含生产级多阶段 `Dockerfile`、健康检查和 Cloudflare Tunnel Compose 配置：

```bash
docker compose up -d --build course
```

绑定自有域名的完整操作见 [部署说明](docs/DEPLOYMENT.md)。

## 验证

```bash
npm run lint
npm run build
python3 courseware/verify_all.py
npm run test:e2e
```

## 文档

- [学员使用手册](docs/LEARNER_GUIDE.md)
- [维护者手册](docs/MAINTAINER_GUIDE.md)
- [部署说明](docs/DEPLOYMENT.md)
- [故障排查](docs/TROUBLESHOOTING.md)
- [发布检查表](docs/RELEASE_CHECKLIST.md)

教育用途，不构成投资建议。
