/**
 * modules/launchOps.js
 * 函数: renderLaunchOps
 * 依赖: ['launch_ops']
 */
(function() {
  'use strict';

  // renderLaunchOps
  function renderLaunchOps() {
    var lo = DATA.launch_ops;
    if(!lo) return;
    // 阶段横幅
    var phaseColors = {'打标期':'#fbbf24','验证期':'#60a5fa','放大期':'#30D158'};
    var pc = phaseColors[lo.phase] || '#a78bfa';
    document.getElementById('launchBanner').innerHTML =
      '<div class="launch-phase-icon">' + (lo.phase==='打标期'?'🏷️':lo.phase==='验证期'?'📊':'🚀') + '</div>' +
      '<div class="launch-phase-info"><div class="launch-phase-name" style="color:'+pc+'">' + lo.phase + '</div>' +
      '<div class="launch-phase-desc">' + lo.desc + ' · 起号日 ' + lo.start_date + '</div></div>' +
      '<div class="launch-phase-day">第' + lo.days + '天<span>of 14天打标</span></div>';
    // 健康度
    var hs = lo.tag_health || 0;
    var hsEl = document.getElementById('healthScore');
    hsEl.textContent = hs;
    hsEl.className = 'health-score ' + (hs>=60?'':hs>=40?'mid':'low');
    document.getElementById('coreCoverage').textContent = lo.core_coverage + '%';
    var hb = document.getElementById('healthBar');
    hb.style.width = hs + '%';
    hb.style.background = hs>=60 ? 'linear-gradient(90deg,#30D158,#4ade80)' : hs>=40 ? 'linear-gradient(90deg,#fbbf24,#f97316)' : 'linear-gradient(90deg,#f87171,#ef4444)';
    document.getElementById('healthTip').textContent = hs>=60 ? '标签健康，算法可精准推流' : hs>=40 ? '标签正在形成，继续保持垂直输出' : '标签混乱，建议减少泛内容，聚焦核心领域';
    // 关键词云
    var kws = lo.core_keywords || [];
    document.getElementById('coreKwCloud').innerHTML = kws.length ? kws.map(function(k){return '<span class="kw-chip">'+k+'</span>';}).join('') : '<span style="font-size:11px;color:var(--text-tertiary);">暂无核心关键词覆盖</span>';
    // 内容配比
    var r = lo.content_ratio || {};
    var total = (r.core||0)+(r.related||0)+(r.general||0) || 1;
    var corePct = Math.round((r.core||0)/total*100);
    var relPct = Math.round((r.related||0)/total*100);
    var genPct = 100-corePct-relPct;
    document.getElementById('ratioBar').innerHTML =
      '<div class="ratio-seg" style="width:'+corePct+'%;background:#30D158;">'+(corePct>10?corePct+'%':'')+'</div>' +
      '<div class="ratio-seg" style="width:'+relPct+'%;background:#60a5fa;">'+(relPct>10?relPct+'%':'')+'</div>' +
      '<div class="ratio-seg" style="width:'+genPct+'%;background:rgba(255,255,255,0.15);">'+(genPct>10?genPct+'%':'')+'</div>';
    document.getElementById('ratioLegend').innerHTML =
      '<span><span class="ratio-dot" style="background:#30D158;"></span>核心 '+corePct+'% (目标70%)</span>' +
      '<span><span class="ratio-dot" style="background:#60a5fa;"></span>关联 '+relPct+'% (目标20%)</span>' +
      '<span><span class="ratio-dot" style="background:rgba(255,255,255,0.15);"></span>泛内容 '+genPct+'% (目标10%)</span>';
    var ratioTip = corePct < 50 ? '⚠️ 核心内容占比过低，打标期建议核心内容>70%，否则算法无法识别账号标签' : corePct >= 70 ? '✅ 核心占比达标，标签识别良好' : '核心占比接近目标，继续保持';
    document.getElementById('ratioTip').textContent = ratioTip;
    // 任务清单
    var tasks = lo.tasks || [];
    document.getElementById('launchTasks').innerHTML = tasks.map(function(t,i){
      return '<div class="task-item"><div class="task-check"></div><span>'+t+'</span></div>';
    }).join('');
    // 避坑提醒
    var pitfalls = (lo.pitfalls||[]).filter(function(p){return p.active;});
    document.getElementById('pitfallList').innerHTML = pitfalls.map(function(p){
      return '<div class="pitfall-item '+p.level+'"><span>'+(p.level==='high'?'🔴':p.level==='mid'?'🟡':'⚪')+'</span><span>'+p.text+'</span></div>';
    }).join('');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "launchOps",
      // requiredFields removed: launch_ops not in DATA, renders empty state
      render: function(data) {
        try { renderLaunchOps(data); } catch(e) { console.error("[launchOps]", e); }
      }
    });
  }
  window.renderLaunchOps = renderLaunchOps;
})();
