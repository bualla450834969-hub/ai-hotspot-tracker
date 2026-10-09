/**
 * RedFox Hub Worker（V8.1 自动采集版）
 * 三大职责：
 *   1. fetch POST ：保留原“采集中转透传”，解决浏览器 CORS（手动采集，key 由前端带；
 *                   前端未带 key 时回退到 Worker 配置的 secret）。
 *   2. scheduled ：按 cron（HKT 每天 08:00 / 14:00）自动采集配置好的行业，原始结果写 KV。
 *   3. fetch GET ?action=snapshot&industry=<id>：读取 KV 最新快照，供前端“打开即最新”。
 *
 * 关键设计：Worker 只负责“定时采集 + 存原始 RedFox rows”，不做字段映射 / 去重 / 聚合；
 *          normalizeWork / buildDashboardData 全部仍在前端，保持单一实现，避免双份逻辑不同步。
 */

const ALLOWED_ORIGINS = [
  'https://bualla450834969-hub.github.io',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

const REDFOX_BASE = 'https://redfox.hk/story/api';
const PLATFORM_PREFIX = { douyin: 'dyData', xiaohongshu: 'xhsUser' };

// 定时采集的行业清单（要支持更多行业时，照此追加即可）
const SCHEDULED_INDUSTRIES = [
  {
    id: 'ai',
    name: 'AI',
    platforms: ['douyin', 'xiaohongshu'],
    keywords: ['AI', 'AI工具', 'AI教程', 'AI提示词', 'AI绘画', 'AI视频', 'AI写作', 'AI编程', 'AI智能体', 'AI副业', 'AI避坑', 'AI推荐', 'AI怎么选', 'AI排行榜', 'AI数字人', 'AI PPT', 'ChatGPT', 'AIGC', '大模型'],
  },
];

const SEARCH_TIMEOUT_MS = 15000;
const RETRIES = 2;
const CONCURRENCY = 3;
const HISTORY_CAP = 30;
const LIB_MAX_PER_PLATFORM = 800; // 每平台累积作品上限（超出保留最新）

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);

    // ① 手动触发采集：GET ?action=collect&key=<RedFox key>（鉴权防盗刷配额）
    if (request.method === 'GET' && url.searchParams.get('action') === 'collect') {
      const provided = url.searchParams.get('key') || request.headers.get('x-admin-key');
      if (!env.REDFOX_API_KEY || provided !== env.REDFOX_API_KEY)
        return json({ code: 4030, msg: 'forbidden: key mismatch' }, origin, 403);
      try {
        const wantInd = url.searchParams.get('industry') || 'ai';
        const targetInd = SCHEDULED_INDUSTRIES.find((x) => x.id === wantInd) || SCHEDULED_INDUSTRIES[0];
        const r = await collectIndustry(env, targetInd);
        return json({ code: 2000, msg: 'collect done', data: { collectedAtHK: r.collectedAtHK, counts: r.counts, failedKws: r.failedKws } }, origin, 200);
      } catch (e) {
        return json({ code: 5000, msg: 'collect failed: ' + e }, origin, 500);
      }
    }
    // ② 读取云端快照：GET ?action=snapshot&industry=ai
    if (request.method === 'GET' && url.searchParams.get('action') === 'snapshot') {
      const industry = (url.searchParams.get('industry') || '').trim();
      if (!industry) return json({ code: -1, msg: '缺少 industry' }, origin, 400);
      try {
        const raw = await env.REDFOX_KV.get('snapshot:' + industry);
        if (!raw) return json({ code: 4040, msg: '暂无云端快照', data: null }, origin, 200);
        return new Response(raw, {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
        });
      } catch (e) {
        return json({ code: -1, msg: '读取快照失败: ' + (e.message || String(e)) }, origin, 502);
      }
    }

    // ② 手动采集透传：POST
    if (request.method !== 'POST') {
      return new Response('POST only', { status: 405, headers: corsHeaders(origin) });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ code: -1, msg: '请求体不是 JSON' }, origin, 400);
    }

    const platform = body.platform; // "douyin" | "xiaohongshu"
    const keyword = (body.keyword || '').trim();
    const apiKey = (body.apiKey || '').trim() || (env.REDFOX_API_KEY || '');
    const offset = body.offset || 0;

    if (!apiKey) return json({ code: -1, msg: '缺少 RedFox API Key' }, origin, 400);
    if (!keyword) return json({ code: -1, msg: '缺少关键词' }, origin, 400);
    if (!PLATFORM_PREFIX[platform]) {
      return json({ code: -1, msg: 'platform 只能是 douyin / xiaohongshu' }, origin, 400);
    }

    try {
      const data = await redfoxSearch(apiKey, platform, keyword, offset);
      // 还原 RedFox 原始结构 {code:2000, data:{list,total}}，前端 searchOnce 据此判定
      return json({ code: 2000, data }, origin, 200);
    } catch (e) {
      return json({ code: -1, msg: String(e.message || e) }, origin, 502);
    }
  },

  // ③ 定时触发
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        for (const ind of SCHEDULED_INDUSTRIES) {
          try {
            await collectIndustry(env, ind);
          } catch (e) {
            console.error('[SCHEDULED] industry failed', ind.id, e);
          }
        }
      })()
    );
  },
};

/** 英译中：Cloudflare Workers AI 翻译模型（免费额度大、不依赖外部服务） */
async function translateText(env, text) {
  if (!text || !env.AI) return '';
  try {
    const resp = await env.AI.run('@cf/meta/m2m100-1.2b', {
      text: text,
      source_lang: 'en',
      target_lang: 'zh'
    });
    return (resp && resp.translated_text) || '';
  } catch (e) { return ''; }
}

/** 从 GitHub Search 采集 AI 热门开源项目，关联已采集社媒作品，生成 tech_signals */
async function fetchGitHubTechSignals(env, ind, allTitles) {
  // 只有需要技术雷达的行业（当前为 ai）才采集 GitHub
  if (ind.id !== 'ai') return { signals: [], summary: { blue_ocean: 0, exploding: 0, rising: 0, watching: 0 } };
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    // 一周内新建的 AI 项目，按星数降序 = 新爆发最快的（而非老的高星项目）
    const url = 'https://api.github.com/search/repositories?q=' +
      encodeURIComponent('topic:ai created:>' + weekAgo) +
      '&sort=stars&order=desc&per_page=50';
    const headers = { 'User-Agent': 'ai-hotspot-tracker', 'Accept': 'application/vnd.github+json' };
    if (env.GITHUB_TOKEN) headers['Authorization'] = 'Bearer ' + env.GITHUB_TOKEN;
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error('GitHub ' + resp.status);
    const j = await resp.json();
    const signals = (j.items || []).map(function (repo) {
      const created = new Date(repo.created_at);
      const daysOld = Math.max(1, Math.round((Date.now() - created.getTime()) / 86400000));
      const stars = repo.stargazers_count || 0;
      const name = repo.name || '';
      const lowerName = name.toLowerCase();
      let matched = 0;
      allTitles.forEach(function (t) { if (t && t.toLowerCase().indexOf(lowerName) >= 0) matched++; });
      let opp = '观察中';
      // 都是一周内新建的项目：按星数判断爆发阶段
      if (stars > 2000) opp = '正在爆发';
      else if (stars > 500) opp = '蓝海机会';
      else if (stars > 100) opp = '上升期';
      return {
        name: repo.full_name,
        source: 'github',
        stars: stars,
        forks: repo.forks_count || 0,
        description: repo.description || '',
        days_old: daysOld,
        star_growth_per_day: Math.round(stars / daysOld),
        is_new: daysOld < 30,
        analysis: {
          opportunity: opp,
          matched_hotwords: matched > 0 ? [name] : [],
          tech_heat: Math.min(100, Math.round(stars / 1000)),
          social_heat: Math.min(100, matched * 10),
          reason: name + ' 共 ' + stars + ' 星、' + (repo.forks_count || 0) + ' fork，创建 ' + daysOld + ' 天；社媒采集到 ' + matched + ' 条相关作品',
        },
      };
    });
    // 并行把英文描述翻译成中文（前端优先显示 description_zh）
    await Promise.all(signals.map(async function (s) {
      if (s.description) {
        s.description_zh = await translateText(env, s.description);
      }
    }));
    const summary = { blue_ocean: 0, exploding: 0, rising: 0, watching: 0 };
    signals.forEach(function (s) {
      const o = s.analysis.opportunity;
      if (o.indexOf('蓝海') >= 0) summary.blue_ocean++;
      else if (o.indexOf('爆发') >= 0) summary.exploding++;
      else if (o.indexOf('上升') >= 0) summary.rising++;
      else summary.watching++;
    });
    return { signals, summary };
  } catch (e) {
    console.error('[GITHUB] tech signals failed', e.message || e);
    return { signals: [], summary: { blue_ocean: 0, exploding: 0, rising: 0, watching: 0 } };
  }
}

/** 采集单个行业：平台×关键词（有限并发 + 重试 + 超时），原始 rows 写 KV */
async function collectIndustry(env, ind) {
  const apiKey = env.REDFOX_API_KEY;
  if (!apiKey) throw new Error('未配置 REDFOX_API_KEY secret');

  const jobs = [];
  ind.platforms.forEach((pl) => ind.keywords.forEach((kw) => jobs.push({ pl, kw })));

  const entries = [];
  const keywordStats = [];
  const failedKws = [];
  let cursor = 0;

  async function redfoxWithRetry(pl, kw) {
    let attempt = 0;
    let lastErr;
    while (attempt <= RETRIES) {
      try {
        return await redfoxSearch(apiKey, pl, kw, 0); // {list,total}
      } catch (e) {
        lastErr = e;
        attempt++;
        if (attempt > RETRIES) break;
        const msg = String((e && e.message) || e);
        const isRate = /429|rate|limit|too many|频繁|频/i.test(msg);
        const wait = isRate ? Math.min(800 * Math.pow(2, attempt - 1), 6000) : 400 * attempt;
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    throw lastErr || new Error('采集失败：' + kw);
  }

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        const data = await redfoxWithRetry(job.pl, job.kw);
        const rows = data.list || [];
        entries.push({ platform: job.pl, keyword: job.kw, rows });
        const avgLike = rows.length
          ? Math.round(rows.reduce((a, w) => a + (w.likeCount || w.workLikedCount || 0), 0) / rows.length)
          : 0;
        keywordStats.push({
          keyword: job.kw,
          platform: job.pl,
          total: data.total || rows.length,
          works: rows.length,
          avg_like: avgLike,
        });
      } catch (e) {
        keywordStats.push({ keyword: job.kw, platform: job.pl, total: 0, works: 0, error: String(e.message || e) });
        if (failedKws.indexOf(job.kw) < 0) failedKws.push(job.kw);
      }
    }
  }

  const pool = [];
  for (let i = 0; i < Math.min(CONCURRENCY, jobs.length); i++) pool.push(worker());
  await Promise.all(pool);

  const now = new Date();
  const nowIso = now.toISOString();
  const freshRows = entries.reduce((a, e) => a + e.rows.length, 0);

  // ===== 累积库：读取 → 合并本次（去重 + 记录命中关键词）→ 截断 → 写回 =====
  const libKey = 'lib:' + ind.id;
  let lib = {};
  try { lib = JSON.parse((await env.REDFOX_KV.get(libKey)) || '{}'); } catch (e) { lib = {}; }

  entries.forEach((e) => {
    const bucket = lib[e.platform] || (lib[e.platform] = {});
    e.rows.forEach((raw) => {
      const rid = rowIdOf(e.platform, raw);
      if (!rid) return;
      const picked = pickRow(e.platform, raw);
      if (bucket[rid]) {
        const ex = bucket[rid];
        ex.r = picked; // 用最新数据（点赞/评论会增长）
        ex.s = nowIso;
        if (ex.k.indexOf(e.keyword) < 0) ex.k.push(e.keyword);
      } else {
        bucket[rid] = { r: picked, k: [e.keyword], t: picked.publishTime || picked.workPublishTime || picked.createTime || '', s: nowIso };
      }
    });
  });

  // 每平台按发布/采集时间截断，保留最新 LIB_MAX_PER_PLATFORM 条
  Object.keys(lib).forEach((pl) => {
    const arr = Object.keys(lib[pl]).map((id) => [id, lib[pl][id]]);
    arr.sort((a, b) => {
      const ta = Date.parse(a[1].t || a[1].s) || 0;
      const tb = Date.parse(b[1].t || b[1].s) || 0;
      return tb - ta;
    });
    const nb = {};
    arr.slice(0, LIB_MAX_PER_PLATFORM).forEach((x) => { nb[x[0]] = x[1]; });
    lib[pl] = nb;
  });

  await env.REDFOX_KV.put(libKey, JSON.stringify(lib));

  // ===== 生成给前端的 snapshot.entries：按 平台×最近关键词 分组，每条 row 附 _kws =====
  const groupMap = {};
  const groupOrder = [];
  let libRows = 0;
  Object.keys(lib).forEach((pl) => {
    Object.keys(lib[pl]).forEach((rid) => {
      const item = lib[pl][rid];
      const recentKw = item.k[item.k.length - 1];
      const gk = pl + '|' + recentKw;
      if (!groupMap[gk]) { groupMap[gk] = { platform: pl, keyword: recentKw, rows: [] }; groupOrder.push(gk); }
      groupMap[gk].rows.push(Object.assign({ _kws: item.k.slice() }, item.r));
      libRows++;
    });
  });

  // GitHub 技术信号（仅AI行业）：关联已采集社媒作品标题，生成技术雷达数据
  const allTitles = [];
  Object.keys(lib).forEach((pl) => {
    Object.keys(lib[pl]).forEach((rid) => {
      const it = lib[pl][rid].r || {};
      allTitles.push((it.title || '') + ' ' + (it.desc || ''));
    });
  });
  const gh = await fetchGitHubTechSignals(env, ind, allTitles);

  const snapshot = {
    industry: ind.id,
    industryName: ind.name,
    collectedAt: nowIso,
    collectedAtHK: formatHKT(now),
    entries: groupOrder.map((gk) => groupMap[gk]),
    keywordStats,
    tech_signals: gh.signals,
    tech_summary: gh.summary,
    failedKws,
    counts: { jobs: jobs.length, freshRows, libRows, failedJobs: keywordStats.filter((k) => k.error).length, githubSignals: gh.signals.length },
  };
  await env.REDFOX_KV.put('snapshot:' + ind.id, JSON.stringify(snapshot));

  // 轻量采集历史（不含 rows），供前端趋势图
  try {
    const histKey = 'snapshot:' + ind.id + ':history';
    const hist = JSON.parse((await env.REDFOX_KV.get(histKey)) || '[]');
    hist.push({
      collectedAt: nowIso,
      collectedAtHK: snapshot.collectedAtHK,
      rows: libRows,
      freshRows,
      failedKws: failedKws.slice(),
      keywordMetrics: keywordStats.reduce((a, k) => { a[k.keyword] = k.total || 0; return a; }, {}),
    });
    while (hist.length > HISTORY_CAP) hist.shift();
    await env.REDFOX_KV.put(histKey, JSON.stringify(hist));
  } catch (e) {
    console.error('[SCHEDULED] history write failed', ind.id, e);
  }

  console.log('[SCHEDULED]', ind.id, snapshot.collectedAtHK, 'fresh=' + freshRows, 'lib=' + libRows, 'failed=' + failedKws.length);
  return snapshot;
}

/** 原始 row 唯一 id（累积去重用，row 层不做字段映射） */
function rowIdOf(platform, w) {
  return String(w.workId || w.awemeId || '');
}

/** 只保留前端 normalizeWork 所需字段以控制 KV 体积（字段名保持 RedFox 原样） */
function pickRow(platform, w) {
  if (platform === 'xiaohongshu') {
    return {
      workId: w.workId, workTitle: w.workTitle, workDesc: w.workDesc,
      accountNickname: w.accountNickname, workLikedCount: w.workLikedCount,
      workCollectedCount: w.workCollectedCount, workSharedCount: w.workSharedCount,
      workCommentsCount: w.workCommentsCount, workPublishTime: w.workPublishTime,
      workUrl: w.workUrl, coverUrl: w.coverUrl,
    };
  }
  return {
    workId: w.workId, awemeId: w.awemeId, title: w.title, desc: w.desc,
    accountName: w.accountName, nickname: w.nickname, likeCount: w.likeCount,
    diggCount: w.diggCount, collectCount: w.collectCount, shareCount: w.shareCount,
    commentCount: w.commentCount, publishTime: w.publishTime, createTime: w.createTime,
    workUrl: w.workUrl, coverUrl: w.coverUrl, cover: w.cover, duration: w.duration,
  };
}

/** 直连 RedFox 单次搜索；成功返回 data（{list,total}），否则抛错 */
async function redfoxSearch(apiKey, platform, keyword, offset) {
  const prefix = PLATFORM_PREFIX[platform];
  if (!prefix) throw new Error('未知平台: ' + platform);
  const target = `${REDFOX_BASE}/${prefix}/searchArticle`;

  const resp = await fetch(target, {
    method: 'POST',
    headers: { REDFOX_API_KEY: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, offset, sortType: '_0' }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });

  let j;
  try {
    j = await resp.json();
  } catch (e) {
    throw new Error('RedFox 返回非 JSON（HTTP ' + resp.status + '）');
  }

  if (j.code === 2000) return j.data || {};
  throw new Error(j.msg || 'RedFox code=' + j.code);
}

/** 把时间格式化为香港时间（HKT, UTC+8）字符串 */
function formatHKT(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce((a, p) => {
      a[p.type] = p.value;
      return a;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(obj, origin, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}
