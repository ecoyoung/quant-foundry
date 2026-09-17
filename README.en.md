**English** | [简体中文](README.md)

# Quantitative Research Lab

A local-first, installable, offline-capable set of 53 quantitative research lessons. Built with Next.js, React, TypeScript, and browser-side Pyodide, it provides fixed synthetic data, complete Python implementations, automatic verification, parameter experiments, six-stage projects, and a personal research profile.

## Quick Start

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 4173
```

Open <http://127.0.0.1:4173/>.

## Docker and Custom Domain Deployment

The project includes a production-grade multi-stage `Dockerfile`, health checks, and a Cloudflare Tunnel Compose configuration:

```bash
docker compose up -d --build course
```

See the [Deployment Guide](docs/DEPLOYMENT.md) for complete instructions on binding your own domain.

## Verification

```bash
npm run lint
npm run build
python3 courseware/verify_all.py
npm run test:e2e
```

## Documentation

- [Learner Guide](docs/LEARNER_GUIDE.md)
- [Maintainer Guide](docs/MAINTAINER_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Release Checklist](docs/RELEASE_CHECKLIST.md)

For educational purposes only; not investment advice.
