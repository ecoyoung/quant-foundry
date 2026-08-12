# 部署与本地运行

## 本地开发

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 4173
```

## 生产构建

```bash
npm run lint
npm run build
npm start
```

构建前会自动生成 `public/offline-assets.json`。PWA Service Worker 需要 HTTPS；`localhost` 与 `127.0.0.1` 是浏览器允许的开发例外。
每次生产构建也会生成新的离线缓存版本，避免发布后浏览器混用旧页面与新脚本。

## Docker 生产运行

镜像使用 Next.js standalone 产物，并以非 root 用户运行：

```bash
docker compose build course
docker compose up -d course
curl http://127.0.0.1:4173/api/health
```

默认只把端口绑定到服务器的 `127.0.0.1`，不会直接暴露到公网。查看状态与日志：

```bash
docker compose ps
docker compose logs -f course
```

升级版本：

```bash
git pull
docker compose build --pull course
docker compose up -d course
```

## 绑定 Cloudflare 域名

推荐使用 Cloudflare 后台管理的 Tunnel。它由 `cloudflared` 主动建立出站连接，不要求服务器开放 80/443 入站端口。

1. 确认域名已经托管在 Cloudflare。
2. 进入 Cloudflare Zero Trust → Networks → Tunnels，创建一个 Cloudflared Tunnel。
3. 在 Tunnel 的 Published application 中添加公开主机名，例如 `learn.example.com`。
4. Service 类型选择 `HTTP`，URL 填写 `course:3000`。这里的 `course` 是 Compose 服务名，不要填写 `localhost`。
5. 从安装连接器页面复制 Tunnel Token。
6. 在服务器项目目录创建仅由管理员读取的 Secret 文件：

```bash
mkdir -p .secrets
chmod 700 .secrets
printf '%s\n' '在此粘贴 Token' > .secrets/cloudflare_tunnel_token
chmod 600 .secrets/cloudflare_tunnel_token
```

不要把 Token 放进 Compose 命令、环境变量或 Git。当前 Compose 固定使用 HTTP/2，兼容不允许 UDP/7844 的家庭网络。然后启动：

```bash
docker compose --profile tunnel up -d --build
docker compose ps
docker compose logs -f tunnel
```

当 Cloudflare 控制台显示 Tunnel 为 Healthy 后，访问所配置的 HTTPS 域名。Token 等同于 Tunnel 凭证，不要提交到 Git、构建进镜像或粘贴到公开日志；泄漏时应立即在 Cloudflare 后台轮换。

如果希望课程仅供指定人员学习，可在该公开主机名之前增加 Cloudflare Access 应用及邮箱/身份提供商策略；公开课程则无需 Access 订阅。

## 静态资源要求

- 必须原样提供 `/sw.js`、`/manifest.webmanifest`、`/offline-assets.json`。
- `/course-assets/` 中的 CSV、Python 和 JSON 应允许同源 GET。
- 不要对 `sw.js` 设置长期 immutable 缓存；它负责发现新版本。
- Pyodide 来自固定版本 CDN，正式完全离线部署可后续将该运行时托管到同源目录。

## 数据隐私

当前版本没有账户和服务器写入。学习记录保存在浏览器 `localStorage`；学员必须主动导出备份才能跨设备迁移。
