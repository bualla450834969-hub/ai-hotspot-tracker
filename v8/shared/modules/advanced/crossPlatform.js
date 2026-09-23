/**
 * modules/advanced/crossPlatform.js
 * 自动拆分自 advancedAnalytics.js
 */
(function() {
  'use strict';
  
function renderCrossPlatform() {
    const el = document.getElementById('crossPlatformList');
    if (!el) return;
    const list = DASHBOARD_DATA.cross_platform_gaps || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无跨平台迁移机会（两平台热度接近）</div>'; return; }
    el.innerHTML = list.map(g => `
      <div class="cp-item glass-card">
        <div class="cp-keyword">${g.keyword}</div>
        <div class="cp-compare">
          <div class="cp-side xhs">
            <span class="cp-label">小红书</span>
            <span class="cp-val">均赞 ${g.xhs_avg_like}</span>
          </div>
          <div class="cp-arrow">→</div>
          <div class="cp-side dy">
            <span class="cp-label">抖音</span>
            <span class="cp-val">均赞 ${g.dy_avg_like}</span>
          </div>
        </div>
        <div class="cp-gap">热度差 ${g.gap_ratio}倍 · ${g.suggestion}</div>
      </div>`).join('');
  }

function renderCompetitorStrategy() {
    const el = document.getElementById('competitorList');
    if (!el) return;
    const list = DASHBOARD_DATA.competitor_strategy || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无对标数据</div>'; return; }
    el.innerHTML = list.map((c, i) => `
      <div class="comp-item glass-card">
        <div class="comp-rank">TOP${i+1}</div>
        <div class="comp-main">
          <div class="comp-name">${c.account}</div>
          <div class="comp-meta">${c.platform==='douyin'?'抖音':'小红书'} · ${c.works_count}作品 · 均赞${c.avg_like}</div>
          <div class="comp-strategy">📋 ${c.strategy}</div>
          <div class="comp-mix">${Object.entries(c.content_mix||{}).map(([k,v])=>`<span class="comp-mix-tag">${k} ${v}</span>`).join('')}</div>
        </div>
        <div class="comp-freq">${c.posting_freq}</div>
      </div>`).join('');
  }

function renderOwnPerformance() {
    try {
      const el = document.getElementById('ownPerfList');
      if (!el) return;
      const list = DASHBOARD_DATA.own_performance || [];
      const summary = DASHBOARD_DATA.own_performance_summary || {};
      if (!list.length) {
        el.innerHTML = '<div class="empty-state"><div style="font-size:32px;margin-bottom:8px">📊</div><div style="color:rgba(255,255,255,0.5);font-size:13px">暂无发布数据</div><div style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:4px">在飞书多维表格"选题建议表"中将状态改为"已发布"并填写播放量等数据</div></div>';
        return;
      }
      el.innerHTML = list.map((p, i) => `
        <div class="own-perf-item glass-card">
          <div class="own-perf-rank">${i+1}</div>
          <div class="own-perf-main">
            <div class="own-perf-title">${p.title}</div>
            <div class="own-perf-meta">${p.platform||'抖音'} · ${p.publish_date||'-'} · ${p.keyword||''}</div>
          </div>
          <div class="own-perf-stats">
            <div class="ops-stat"><span class="ops-num">${(p.views||0).toLocaleString()}</span><span class="ops-label">播放</span></div>
            <div class="ops-stat"><span class="ops-num">${(p.likes||0).toLocaleString()}</span><span class="ops-label">点赞</span></div>
            <div class="ops-stat"><span class="ops-num">${(p.collects||0).toLocaleString()}</span><span class="ops-label">收藏</span></div>
            <div class="ops-stat"><span class="ops-num">${p.completion_rate? (p.completion_rate*100).toFixed(1)+'%' : '-'}</span><span class="ops-label">完播</span></div>
          </div>
        </div>`).join('');
    } catch(e) { console.warn('[AA] ownPerf:', e); }
  }

  // 注册到全局
  if (typeof window.registerModule === 'function') {
    window.registerModule('renderCrossPlatform', renderCrossPlatform);
    window.registerModule('renderCompetitorStrategy', renderCompetitorStrategy);
    window.registerModule('renderOwnPerformance', renderOwnPerformance);
  }
})();
