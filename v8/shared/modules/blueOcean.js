/* ===== modules/blueOcean.js ===== */
/**
 * modules/blueOcean.js
 * 蓝海关键词 + 关键词上升速率榜
 */
(function() {
  'use strict';

  function renderEmpty(containerId, msg) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-secondary);font-size:13px;">' + (msg || '暂无数据') + '</div>';
  }

  function renderBlueOcean(data) {
    var el = document.getElementById('blueOceanList');
    if (!el) return;
    var list = data || (window.DATA && window.DATA.blue_ocean_list) || [];
    if (!list.length) { renderEmpty('blueOceanList', '暂无蓝海关键词数据'); return; }
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:4px 0;">';
    list.forEach(function(b) {
      var score = b.score || 75;
      var color = score >= 85 ? '#30d158' : score >= 70 ? '#fbbf24' : '#f87171';
      html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;">';
      html += '<div style="font-size:14px;font-weight:600;margin-bottom:6px;">' + (b.keyword||b.name||'') + '</div>';
      html += '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">需求 ' + (b.demand||'中') + ' · 竞争 ' + (b.competition||'低') + '</div>';
      html += '<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;"><div style="width:' + score + '%;height:100%;background:' + color + ';border-radius:2px;"></div></div><span style="font-size:12px;color:' + color + ';font-weight:600;">' + score + '</span></div>';
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function renderGrowthRanking(data) {
    var el = document.getElementById('growthRankingList');
    if (!el) return;
    var list = data || (window.DATA && window.DATA.growth_ranking) || [];
    if (!list.length) { renderEmpty('growthRankingList', '暂无上升速率数据'); return; }
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0;">';
    list.forEach(function(g, i) {
      var growth = g.growth || 0;
      var arrow = growth > 50 ? '🚀' : growth > 20 ? '📈' : '📊';
      html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;">';
      html += '<div style="font-size:11px;color:#64748b;margin-bottom:4px;">#' + (i+1) + '</div>';
      html += '<div style="font-size:14px;font-weight:600;margin-bottom:6px;">' + (g.keyword||'') + '</div>';
      html += '<div style="font-size:13px;color:#30d158;font-weight:600;">' + arrow + ' +' + growth + '%</div>';
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  if (window.Module) {
    Module.register({
      id: 'blueOcean',
      requiredFields: ['blue_ocean_list'],
      render: function(data) { try { renderBlueOcean(data); } catch(e) { console.error('[blueOcean]', e); } }
    });
    Module.register({
      id: 'growthRanking',
      requiredFields: ['growth_ranking'],
      render: function(data) { try { renderGrowthRanking(data); } catch(e) { console.error('[growthRanking]', e); } }
    });
  }
  window.renderBlueOcean = renderBlueOcean;
  window.renderGrowthRanking = renderGrowthRanking;



// Run after data loads（兜底填充已由 Module 渲染系统接管，safeRender 为空操作）
  var safeRender = function(){};
  function start() {
    safeRender();
    // Re-run after a delay to catch late-loading sections
    TimerManager.setTimeout(safeRender, 1000, 'blue-ocean-render');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.__fillEmptySections = safeRender;
})();

