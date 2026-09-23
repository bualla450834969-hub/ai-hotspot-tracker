/**
 * modules/advanced/blueOcean.js
 * 自动拆分自 advancedAnalytics.js
 */
(function() {
  'use strict';
  
function renderBlueOcean() {
    const el = document.getElementById('blueOceanList');
    if (!el) return;
    const list = DASHBOARD_DATA.blue_ocean_keywords || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无蓝海关键词</div>'; return; }
    el.innerHTML = list.map((k, i) => `
      <div class="bo-item glass-card">
        <div class="bo-rank">${i+1}</div>
        <div class="bo-main">
          <div class="bo-keyword">${k.keyword} <span class="bo-platform ${k.platform}">${k.platform==='douyin'?'抖音':'小红书'}</span></div>
          <div class="bo-meta">均赞${k.avg_like} · ${k.works_count}作品 · 竞争度${Math.round(k.competition_score)}</div>
        </div>
        <div class="bo-score">
          <div class="bo-score-val" style="color:${k.blue_ocean_score>50?'#10b981':'#f59e0b'}">${k.blue_ocean_score}</div>
          <div class="bo-score-label">蓝海分</div>
        </div>
        <div class="bo-tag">${k.opportunity}</div>
      </div>`).join('');
  }

function renderAnomalyDetection() {
    try {
      const el = document.getElementById('anomalyList');
      if (!el) return;
      const list = DASHBOARD_DATA.data_anomalies || [];
      if (!list.length) { el.innerHTML = '<div class="empty-state">暂无异常数据</div>'; return; }
      el.innerHTML = list.map((a, i) => `
        <div class="anomaly-item glass-card">
          <div class="anomaly-rank ${a.type === '暴涨' ? 'surging' : 'declining'}">${a.type}</div>
          <div class="anomaly-main">
            <div class="anomaly-keyword">${a.keyword} <span class="bo-platform ${a.platform}">${a.platform==='douyin'?'抖音':'小红书'}</span></div>
            <div class="anomaly-meta">增长率 ${a.growth}% (均值 ${a.avg_growth}%) · Z值 ${a.z_score} · ${a.works_count}作品 · 均赞${a.avg_like}</div>
          </div>
          <div class="anomaly-suggestion">${a.suggestion}</div>
        </div>`).join('');
    } catch(e) { console.warn('[AA] anomaly:', e); }
  }

function renderGrowthRanking() {
    const el = document.getElementById('growthRankingList');
    if (!el) return;
    const list = DASHBOARD_DATA.keyword_growth_ranking || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无增长数据</div>'; return; }
    el.innerHTML = list.slice(0,15).map(k => `
      <div class="gr-row">
        <div class="gr-rank ${k.rank<=3?'top':''}">${k.rank}</div>
        <div class="gr-keyword">${k.keyword}</div>
        <div class="gr-platform ${k.platform}">${k.platform==='douyin'?'抖':'红'}</div>
        <div class="gr-growth">+${k.growth}%</div>
        <div class="gr-trend ${k.trend==='飙升'?'up':''}">${k.trend}</div>
      </div>`).join('');
  }

  // 注册到全局
  if (typeof window.registerModule === 'function') {
    window.registerModule('renderBlueOcean', renderBlueOcean);
    window.registerModule('renderAnomalyDetection', renderAnomalyDetection);
    window.registerModule('renderGrowthRanking', renderGrowthRanking);
  }
})();
