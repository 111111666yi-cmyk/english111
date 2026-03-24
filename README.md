# English Climb / 英语阶梯学习站

English Climb 是一个面向约 3500 词基础、初中英语阶段用户的轻量英语学习站。项目默认采用静态前端架构，学习内容来自本地 JSON，学习记录保存在浏览器本地，默认访问不会调用 OpenAI、Gemini 或其他实时大模型服务。

## 当前版本重点

- 渐进式学习路径：单词 -> 句子 -> 小短文 -> 进阶表达 -> 复习挑战
- 本地 JSON 驱动内容与题目
- 发布级学习词库与词库保留内容分层：正式学习流当前使用审核通过的发布级词库，完整词库仍可检索
- 本地学习记录、错题、难词与统计
- 离线音频优先：本地音频存在时直接播放
- 浏览器朗读兜底：本地音频缺失时仍可学习
- 可选云端发音入口：仅在显式启用并点击按钮时触发
- 词汇页已包含词汇总览与快速跳转

## v1.7 上架说明

- 审核员上架说明与用户更新文案见：
  - [docs/release/v1.7-store-copy.md](docs/release/v1.7-store-copy.md)
- 本次发布重点：
  - 内容深清：主学习链路切换为发布级白名单，避免重复模板、风险词和低质量词条进入正式学习流
  - 音频治理：补齐音频完整性、孤儿资源、Android 资源同步等检查
  - 双端稳定：完成 Web 与 Android 的构建、回归、同步和 beta 打包验证

## 技术栈

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion

## 页面模块

- `/` 首页
- `/vocabulary` 单词学习
- `/sentences` 句子训练
- `/reading` 小短文阅读
- `/expressions` 进阶表达
- `/review` 复习挑战
- `/stats` 学习统计
- `/settings` 设置

## 项目结构

```text
.
├─ public/
│  ├─ audio/
│  │  ├─ words/
│  │  ├─ sentences/
│  │  ├─ passages/
│  │  └─ expressions/
│  └─ data/
├─ scripts/
│  ├─ audio-manifest.example.json
│  ├─ build-content.ts
│  ├─ import-audio-manifest.ts
│  ├─ validate-audio.ts
│  └─ validate-data.ts
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ data/
│  ├─ features/
│  ├─ hooks/
│  ├─ lib/
│  ├─ stores/
│  └─ types/
├─ .env.example
├─ package.json
└─ README.md
```

## 本地运行

```bash
npm install
npm run dev
```

默认地址：

```text
http://localhost:3000
```

如果 3000 端口被占用，Next.js 会自动切到下一个可用端口。

## 构建与校验

```bash
npm run lint
npm run validate:data
npm run validate:audio
npm run build:content
npm run build
```

## GitHub Pages 部署

项目已包含 GitHub Pages workflow：

- [deploy-pages.yml](.github/workflows/deploy-pages.yml)

默认行为：

- 推送到 `main` 自动部署
- 使用 `next build` 的静态导出结果 `out/`
- 在 GitHub Actions 环境下自动根据仓库名设置 `basePath`

首次启用时需要在 GitHub 仓库设置中打开：

1. `Settings -> Pages`
2. `Build and deployment -> Source`
3. 选择 `GitHub Actions`

如果仓库名是 `english-climb`，部署地址通常会是：

```text
https://<your-github-username>.github.io/english-climb/
```

## Playwright 回归

仓库内已提供固定的 Playwright 回归脚本：

```bash
npm run test:regression
```

默认行为：

- 先执行 `npm run build:content`
- 再执行 `npm run build`
- 自动启动本地静态预览 `http://127.0.0.1:3002`
- 运行关键回归并把截图、日志、汇总写到 `output/playwright/regression/`

覆盖重点：

- 首页导航到统计页
- 词汇总览每页固定 30 条且不重复
- 单词高亮存在
- 阅读页“标记本篇已完成”会增加计数并切到下一篇
- 本地音频路径走站点 basePath
- 云端按钮常显，离线时只给状态提示
- guest / 账户 A / 账户 B 的学习数据和错题隔离

如果你想复用同一套检查去跑线上 Pages 地址：

```bash
npm run test:regression -- --url https://<your-github-username>.github.io/english-climb/ --skip-build --skip-preview
```

## 内容与音频

内容真源在 `src/data/`：

- `words.json`
- `sentences.json`
- `passages.json`
- `expressions.json`

构建后会同步到 `public/data/`，方便静态部署和外部读取。

本地音频目录约定：

- `public/audio/words/`
- `public/audio/sentences/`
- `public/audio/passages/`
- `public/audio/expressions/`

## 音频策略

默认播放优先级：

1. 本地音频文件
2. IndexedDB 中缓存的云端音频
3. 用户显式点击后的云端发音
4. 浏览器 `SpeechSynthesis` 朗读兜底

云端发音不会自动触发，也不会在未配置时影响主站功能。

## 批量导入真实 TTS 音频

可以使用批量导入脚本，把外部生成的真实 TTS 文件复制到 `public/audio`，并自动同步更新 `src/data` 中的 `audioLocal` 字段。

示例清单：

- [audio-manifest.example.json](scripts/audio-manifest.example.json)

执行方式：

```bash
npm run import:audio -- --manifest scripts/audio-manifest.example.json
```

支持的导入类型：

- 单词音频
- 句子整句音频
- 句子关键词音频
- 短文整篇音频
- 短文章节音频
- 进阶表达 basic / advanced 音频

## 自动扫描文件夹生成 manifest

如果你已经把真实音频按约定文件名放到一个临时目录，可以先自动扫描生成 manifest，再执行导入。

命令：

```bash
npm run manifest:audio -- --source-dir audio-import --output scripts/audio-manifest.generated.json
```

推荐目录结构：

```text
audio-import/
├─ words/
│  ├─ bridge.mp3
│  └─ beneficial.mp3
├─ sentences/
│  ├─ sentence-clues.mp3
│  └─ sentence-upgrade--keyword--crucial.mp3
├─ passages/
│  ├─ passage-reading-club.mp3
│  └─ passage-reading-club-p1.mp3
└─ expressions/
   ├─ expression-important-basic.mp3
   └─ expression-important-advanced.mp3
```

扫描完成后再执行：

```bash
npm run import:audio -- --manifest scripts/audio-manifest.generated.json
```

如果你希望一条命令完成“扫描目录 -> 生成清单 -> 导入并同步 JSON”，可以直接执行：

```bash
npm run sync:audio
```

默认会扫描：

```text
audio-import/
```

也可以自定义：

```bash
npm run sync:audio -- --source-dir C:/tts-output --output scripts/audio-manifest.generated.json
```

临时导入目录说明见：

- [audio-import/README.md](audio-import/README.md)

## 扩库与占位音频约定

内容真源始终保持在 `src/data/`，不额外引入第二套 schema。

推荐顺序：

1. 按目标规模扩充内容：

```bash
npm run expand:content -- --total-words 3500 --total-passages 180
```

2. 生成静态读取用数据：

```bash
npm run build:content
```

3. 校验 JSON 和音频引用：

```bash
npm run validate:data
npm run validate:audio
```

4. 需要补占位或本机 TTS 时，再执行：

```bash
npm run tts:local
```

约定保持不变：

- 先扩 JSON，再统一补音频
- 音频文件名继续沿用现有 `public/audio/*` 约定
- 新内容未补音频时，`validate:audio` 应直接失败

## 准备推送到 GitHub

如果你要首次推到新的 GitHub 仓库，建议按这个顺序：

```bash
git init -b main
git add .
git commit -m "Initial English Climb"
git remote add origin <your-github-repo-url>
git push -u origin main
```

如果本机还没设置 Git 用户信息，需要先执行：

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

导入后建议立即执行：

```bash
npm run validate:data
npm run validate:audio
npm run build:content
```

## 使用本机语音直接生成真实 TTS

如果你在 Windows 环境下，可以直接使用本机 `System.Speech` 语音合成批量生成真实 WAV，并自动同步到项目数据：

```bash
npm run tts:local
```

这个命令会：

1. 读取 `src/data/*.json`
2. 生成单词、句子、段落、进阶表达的 WAV 文件到 `audio-import/`
3. 自动执行 `npm run sync:audio`
4. 更新 `src/data` 中的音频路径

可选参数：

```bash
npm run tts:local -- -VoiceName "Microsoft Zira Desktop" -Rate -1
```

说明：

- `VoiceName` 用于指定本机已安装的语音
- `Rate` 范围通常是 `-10` 到 `10`
- 这条链不依赖云端密钥，也不会把任何 API Key 暴露到前端

## 环境变量

前端可见配置：

- `NEXT_PUBLIC_ENABLE_CLOUD_TTS`
- `NEXT_PUBLIC_CLOUD_TTS_ENDPOINT`

服务端或 serverless 预留：

- `ENABLE_CLOUD_TTS`
- `CLOUD_TTS_PROVIDER`
- `CLOUD_TTS_API_KEY`

## 当前限制

- 当前仓库默认只附带占位音频或你后续导入的真实音频，不自带云端 TTS 服务代理
- 云端 TTS 只完成了前端接口预留，没有实现代理服务
- 访问保护、PWA、批量生成内容脚本仍属于后续增强项

## 发布后待办

- [High Priority] Android 原生层技术债清算：针对 `MainActivity.java` 中 `versionCode` 等过时 API 做兼容升级，目标版本 Android 14 / 15。
- [Medium Priority] L2-L5 词库扩容计划：针对本次降级为“仅词库保留”的 `2030` 个词汇，优先重写“模板超阈值”的例句，把合格词条逐步迁回正式学习池。
