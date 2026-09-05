/**
 * modules/launchOps.js
 * 函数: renderLaunchOps
 * 从hotwords/topics/works实时生成起号运营追踪数据
 */
(function() {
  'use strict';

  function renderLaunchOps() {
    // 如果有预计算的launch_ops则直接用，否则从数据生成
    var lo = DATA.launch_ops;
    if (!lo) {
      lo = generateLaunchOps();
    }
    if (!lo) return;

    // 阶段横幅
    var phaseColors = {'打标期':'#fbbf24','验证期':'#60a5fa','放大期':'#30D158'};
    var pc = phaseColors[lo.phase] || '#a78bfa';
    var bannerEl = document.getElementById('launchBanner');
    if (bannerEl) bannerEl.innerHTML =
      '<div class="launch-phase-icon">' + (lo.phase==='打标期'?'🏷️':lo.phase==='验证期'?'📊':'🚀') + '</div>' +
      '<div class="launch-phase-info"><div class="launch-phase-name" style="color:'+pc+'">' + lo.phase + '</div>' +
      '<div class="launch-phase-desc">' + lo.desc + ' · 起号日 ' + lo.start_date + '</div></div>' +
      '<div class="launch-phase-day">第' + lo.days + '天<span>of 14天打标</span></div>';

    // 健康度
    var hs = lo.tag_health || 0;
    var hsEl = document.getElementById('healthScore');
    if (hsEl) {
      hsEl.textContent = hs;
      hsEl.className = 'health-score ' + (hs>=60?'':hs>=40?'mid':'low');
    }
    var ccEl = document.getElementById('coreCoverage');
    if (ccEl) ccEl.textContent = lo.core_coverage + '%';
    var hb = document.getElementById('healthBar');
    if (hb) {
      hb.style.width = hs + '%';
      hb.style.background = hs>=60 ? 'linear-gradient(90deg,#30D158,#4ade80)' : hs>=40 ? 'linear-gradient(90deg,#fbbf24,#f97316)' : 'linear-gradient(90deg,#f87171,#ef4444)';
    }
    var htEl = document.getElementById('healthTip');
    if (htEl) htEl.textContent = hs>=60 ? '标签健康，算法可精准推流' : hs>=40 ? '标签正在形成，继续保持垂直输出' : '标签混乱，建议减少泛内容，聚焦核心领域';

    // 关键词云
    var kws = lo.core_keywords || [];
    var kwEl = document.getElementById('coreKwCloud');
    if (kwEl) kwEl.innerHTML = kws.length ? kws.map(function(k){return '<span class="kw-chip">'+k+'</span>';}).join('') : '<span style="font-size:11px;color:var(--text-tertiary);">暂无核心关键词覆盖</span>';

    // 内容配比
    var r = lo.content_ratio || {};
    var total = (r.core||0)+(r.related||0)+(r.general||0) || 1;
    var corePct = Math.round((r.core||0)/total*100);
    var relPct = Math.round((r.related||0)/total*100);
    var genPct = 100-corePct-relPct;
    var rbEl = document.getElementById('ratioBar');
    if (rbEl) rbEl.innerHTML =
      '<div class="ratio-seg" style="width:'+corePct+'%;background:#30D158;">'+(corePct>10?corePct+'%':'')+'</div>' +
      '<div class="ratio-seg" style="width:'+relPct+'%;background:#60a5fa;">'+(relPct>10?relPct+'%':'')+'</div>' +
      '<div class="ratio-seg" style="width:'+genPct+'%;background:rgba(255,255,255,0.15);">'+(genPct>10?genPct+'%':'')+'</div>';
    var rlEl = document.getElementById('ratioLegend');
    if (rlEl) rlEl.innerHTML =
      '<span><span class="ratio-dot" style="background:#30D158;"></span>核心 '+corePct+'% (目标70%)</span>' +
      '<span><span class="ratio-dot" style="background:#60a5fa;"></span>关联 '+relPct+'% (目标20%)</span>' +
      '<span><span class="ratio-dot" style="background:rgba(255,255,255,0.15);"></span>泛内容 '+genPct+'% (目标10%)</span>';
    var rtEl = document.getElementById('ratioTip');
    if (rtEl) rtEl.textContent = corePct < 50 ? '⚠️ 核心内容占比过低，打标期建议核心内容>70%，否则算法无法识别账号标签' : corePct >= 70 ? '✅ 核心占比达标，标签识别良好' : '核心占比接近目标，继续保持';

    // 任务清单
    var tasks = lo.tasks || [];
    var ltEl = document.getElementById('launchTasks');
    if (ltEl) ltEl.innerHTML = tasks.map(function(t,i){
      return '<div class="task-item"><div class="task-check"></div><span>'+t+'</span></div>';
    }).join('');

    // 避坑提醒
    var pitfalls = (lo.pitfalls||[]).filter(function(p){return p.active;});
    var pfEl = document.getElementById('pitfallList');
    if (pfEl) pfEl.innerHTML = pitfalls.map(function(p){
      return '<div class="pitfall-item '+p.level+'"><span>'+(p.level==='high'?'🔴':p.level==='mid'?'🟡':'⚪')+'</span><span>'+p.text+'</span></div>';
    }).join('');
  }

  // 从现有数据生成起号运营信息
  function generateLaunchOps() {
    var hotwords = DATA.hotwords || [];
    var topics = DATA.topics || [];
    var works = DATA.works || [];

    // 核心关键词 = TOP10热词
    var coreKws = hotwords.slice(0, 10).map(function(h) { return h.keyword; });

    // 标签健康度 = 选题中覆盖核心关键词的比例
    var coreCoverage = 0;
    if (topics.length && coreKws.length) {
      var covered = topics.filter(function(t) {
        return coreKws.some(function(kw) { return (t.title || '').indexOf(kw) >= 0; });
      }).length;
      coreCoverage = Math.round(covered / topics.length * 100);
    }
    var tagHealth = Math.min(95, Math.round(coreCoverage * 0.7 + 20));

    // 内容配比 = 基于选题分类
    var coreCount = 0, relCount = 0, genCount = 0;
    topics.forEach(function(t) {
      var cat = t.category || '';
      if (cat.indexOf('AI') >= 0 || cat.indexOf('工具') >= 0 || cat.indexOf('工作流') >= 0) coreCount++;
      else if (cat.indexOf('教程') >= 0 || cat.indexOf('测评') >= 0) relCount++;
      else genCount++;
    });
    if (topics.length === 0) { coreCount = 14; relCount = 4; genCount = 2; }

    // 起号日 = 数据采集日
    var startDate = (DATA.last_update || '2026-09-01').slice(0, 10);
    var today = new Date();
    var start = new Date(startDate);
    var days = Math.max(1, Math.floor((today - start) / 86400000) + 1);

    return {
      phase: days <= 7 ? '打标期' : days <= 14 ? '验证期' : '放大期',
      desc: days <= 7 ? '聚焦垂直内容，让算法识别账号标签' : days <= 14 ? '验证标签精准度，测试爆款选题' : '放大爆款，矩阵化运营',
      start_date: startDate,
      days: Math.min(days, 14),
      tag_health: tagHealth,
      core_coverage: coreCoverage,
      core_keywords: coreKws,
      content_ratio: { core: coreCount, related: relCount, general: genCount },
      tasks: [
        '每日发布1条核心领域垂直内容（数字人口播+AI素材混剪）',
        '选题覆盖TOP5飙升热词，标题包含关键词',
        '发布时间选择18:00-21:00黄金时段',
        '前3秒钩子用数字/痛点/对比型',
        '评论区置顶引流话术，引导扣"1"领资料',
        '发布后30分钟内回复前10条评论',
        '关注5个对标账号，拆解其爆款结构'
      ],
      pitfalls: [
        { level: 'high', active: true, text: '不要发泛娱乐/蹭热点内容，会打乱账号标签' },
        { level: 'high', active: true, text: '不要频繁删视频/隐藏视频，影响账号权重' },
        { level: 'mid', active: true, text: '不要买粉/买赞，算法会识别异常流量' },
        { level: 'mid', active: true, text: '打标期不要接广告/带货，保持内容纯净度' },
        { level: 'low', active: true, text: '视频时长控制在60-90秒，完播率更优' }
      ]
    };
  }

  if (window.Module) {
    Module.register({
      id: "launchOps",
      render: function() {
        try { renderLaunchOps(); } catch(e) { console.error("[launchOps]", e); }
      }
    });
  }
  window.renderLaunchOps = renderLaunchOps;
  window.generateLaunchOps = generateLaunchOps;
})();
