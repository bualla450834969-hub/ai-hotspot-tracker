#!/usr/bin/env node
/**
 * V8.1 bundle 一键构建脚本（无第三方依赖，仅需 Node >= 12）
 *
 * 作用：把 v8/shared 下的源文件（data / core / effects / modules）
 *      按固定顺序拼接，生成线上实际加载的 v8/shared/bundle.js。
 *
 * 以后修改任何源文件后，只需在仓库根目录执行：
 *      npm run build            （或 node scripts/build-bundle.js）
 * 不要再手工复制粘贴 bundle.js。
 *
 * 约束：本脚本只做“按顺序拼接”，不转译、不压缩、不改变任何运行逻辑，
 *      因此 UI 与行为保持不变。各源文件多为独立 IIFE，互不共享作用域。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SHARED = path.join(__dirname, '..', 'v8', 'shared');

// 拼接顺序即线上执行顺序，请勿随意调整（模块注册/依赖有先后）。
const FILES = [
  'data/normalize.js',      // 数据适配层：字段统一 + 缺失字段自动填充
  'core/domainConfig.js',    // 领域默认配置 DOMAIN_CONFIG（可被行业配置覆盖）
  'core/globals.js',
  'core/state.js',
  'core/evidence.js',         // V8.2 Evidence / Insight / Provenance / DataQuality
  'core/renderer.js',
  'core/framework.js',       // Module.register 框架 + renderAll 调度
  'effects/glow.js',
  'effects/login.js',
  'modules/_helpers.js',
  'modules/hero.js',
  'modules/evidenceInsights.js', // V8.2可信洞察管线（复用一次性证据索引）
  'modules/evidenceDrawer.js',   // V8.2最小证据抽屉
  'modules/homepageV82.js',      // V8.2研究工作台首页编排
  'modules/hotwords.js',
  'modules/works.js',
  'modules/topics.js',
  'modules/techradar.js',
  'modules/breakdown.js',
  'modules/viralGenes.js',
  'modules/publishTime.js',
  'modules/titleFormulas.js',
  'modules/leadScripts.js',
  'modules/benchmarkExtras.js',
  'modules/launchOps.js',
  'modules/audience.js',
  'modules/engagement.js',
  'modules/topicPerf.js',
  'modules/kanban.js',
  'modules/favorites.js',
  'modules/credit.js',
  'modules/scriptGen.js',
  'modules/comparison.js',
  'modules/sidebar.js',
  'modules/blueOcean.js',
  'modules/cardAudit.js',    // 自动化卡片体检助手
];

function main() {
  const chunks = FILES.map((f) => {
    const p = path.join(SHARED, f);
    if (!fs.existsSync(p)) throw new Error('缺少构建源文件: ' + f);
    return fs.readFileSync(p);
  });
  const out = Buffer.concat(chunks);
  const target = path.join(SHARED, 'bundle.js');
  fs.writeFileSync(target, out);
  const sha = crypto.createHash('sha256').update(out).digest('hex');
  console.log('[build] v8/shared/bundle.js  %d bytes  sha256:%s', out.length, sha.slice(0, 16));
  console.log('[build] 共拼接 %d 个源文件。', FILES.length);
}

main();
