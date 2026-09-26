# AI 热点追踪工作台 · ai-hotspot-tracker

一个**多行业通用**的「热点追踪 + 自媒体视频结构推荐」纯前端工作台。当前主版本为 **V8.1 Stable**，位于 `v8/`。
通过 GitHub Pages 直接访问，无需后端（数据采集经 Cloudflare Worker 中转，见下）。

- AI 行业示例：`v8/shared/app.html?ind=ai`
- 书法行业：`v8/shared/app.html?ind=shufa`
- 自定义（本地）行业：`v8/shared/app.html?ind=local:行业名`

---

## 一、线上真实执行链路（务必先理解）

`v8/shared/app.html` 只加载 **3 个**外部脚本：

```
app.html
 ├─ v8/shared/stable-core.js   核心稳定层（最先加载）
 │     AppStore 唯一数据源 · parseIndustryContext · 行业命名空间 NS
 │     normalizeDataContract · TimerManager · ECharts 安全层
 │     safeRender 模块隔离 · AppErrorHandler · switchIndustryContext
 ├─ echarts@5.4.3 (CDN, defer) 图表库（运行时被 stable-core 懒 patch 接管）
 └─ v8/shared/bundle.js         框架 + 全部业务模块（构建产物，勿手改）
```

`v8/shared/core`、`effects`、`modules`、`data` 下的源文件**不被页面直接引用**，
它们按固定顺序拼接生成 `bundle.js`（`stable-core.js` 除外，它被独立引用）。

数据流：

```
URL(ind) → parseIndustryContext() → 读取内置 / localStorage 数据
        → normalizeData() 字段适配 → normalizeDataContract() 契约补齐
        → AppStore.data（唯一数据源）→ renderAll()（一次）
        → safeRender(各模块) / safeChartInit(各图表)
```

---

## 二、构建 bundle（修改源码后的标准流程）

本仓库**不需要打包框架、不压缩、不转译**，构建只做「按顺序拼接」，因此 UI 与行为完全不变。

### 一键构建

```bash
npm run build
# 等价于：node scripts/build-bundle.js
```

脚本读取 `v8/shared` 下 37 个源文件（清单见 `scripts/build-bundle.js`），
按固定顺序拼接并覆盖写入 `v8/shared/bundle.js`。

### 日常开发步骤

1. 修改对应的源文件，例如 `v8/shared/modules/works.js`、`v8/shared/core/framework.js`；
2. 运行 `npm run build`；
3. 提交时**同时提交源文件与重新生成的 `bundle.js`**；
4. **不要再手工复制粘贴 `bundle.js`。**

> 环境要求：Node.js >= 12，无任何第三方依赖（`package.json` 中无 dependencies）。

### 参与构建的源文件（36）

```
data/normalize.js
core/domainConfig.js  core/globals.js  core/state.js  core/evidence.js  core/renderer.js  core/framework.js
effects/glow.js  effects/login.js
modules/_helpers.js  industryCreation.js  hero.js  evidenceInsights.js  evidenceDrawer.js  homepageV82.js
modules/hotwords.js  works.js  topics.js  techradar.js
modules/breakdown.js  viralGenes.js  publishTime.js  titleFormulas.js  leadScripts.js
modules/benchmarkExtras.js  launchOps.js  audience.js  engagement.js  topicPerf.js
modules/kanban.js  favorites.js  credit.js  scriptGen.js  comparison.js
modules/sidebar.js  blueOcean.js  cardAudit.js
```

### 未接入构建的历史文件（不在线上运行，保留备查）

以下文件**不参与** `bundle.js` 构建、也不被页面引用，属于旧版 / 未用实现。
修改它们不会影响线上；如需启用，须先接入 `scripts/build-bundle.js` 清单：

```
core/error.js
data/loader.js
components/auto-migrate.js
components/cards/hotword-card.js  techradar-card.js  topic-card.js
modules/advancedAnalytics.js  cardDataSourceMap.js  opsStatus.js
modules/advanced/blueOcean.js  commentAnalysis.js  contentAnalysis.js
modules/advanced/crossPlatform.js  publishOptimization.js
```

---

## 三、多行业与数据隔离

- 内置行业（如 `ai`、`shufa`）数据随仓库提供；自定义行业数据存于浏览器 `localStorage`：
  `custom_data_<行业名>`、`custom_cfg_<行业名>`，并登记在 `custom_industries`。
- 收藏 / 选题状态 / 性能 / 清单等交互状态，统一按行业命名空间存放：
  `hs_<encodeURIComponent(行业id)>__<后缀>`，不同行业互不污染；旧的无命名空间 key 会在首次读取时自动迁移。
- 切换行业由 `switchIndustryContext()` 统一处理：作废在途旧请求（请求版本号）、
  清理旧定时器与图表、再加载并渲染新行业，杜绝旧数据回写。

## 四、数据采集（Cloudflare Worker 中转）

浏览器直连 RedFox / 飞书会被 CORS 拦截，故采集经 Cloudflare Worker 透传：
设置面板内填写 Worker 地址与 RedFox API Key、勾选平台（抖音 / 小红书）后开始采集；
浏览器将结果聚合成 dashboard 存入该行业的 `custom_data_<名>`。Worker 仅做请求透传。

V8.2 新建行业通过“行业设置 → 添加行业”完成。系统先生成可编辑关键词，用户确认后才开始采集；
新行业使用稳定的 `ind_*` ID，配置、数据和历史分别存入
`industry_<id>_config`、`industry_<id>_data`、`industry_<id>_history`。重命名不改变 ID，
因此不会丢失历史或与同名行业串数据。新 URL 使用 `?industry=<id>`，旧 `?ind=` 地址继续兼容。

## 五、调试模式

在 URL 加 `?debug=1`（可与 `industry=` 或旧 `ind=` 并用），右上角显示：当前行业、works / charts 数量、
render 次数、当前 requestId、采集状态、错误模块、最近错误，以及受管的 Timer、Chart、Event、Effect 数量。正常用户（无 debug）完全不可见。

V8.2 的运行时分层、行业生命周期和兼容约定见
[`docs/v8.2-dynamic-industry-architecture.md`](docs/v8.2-dynamic-industry-architecture.md)。

## 六、部署（GitHub Pages）

仓库已开启 GitHub Pages，根目录含 `.nojekyll`。推送到被 Pages 服务的分支后即自动发布；
注意 `app.html` 引用 `stable-core.js` / `bundle.js` 时带 `?v=` 版本号，更新这些文件后需相应 bump 以绕过 CDN 缓存。
