/**
 * modules/comparison.js
 * 函数: renderComparison
 * 依赖: ['comparison']
 */
(function() {
  'use strict';

  // renderComparison
  function renderComparison() {
    const comp = DATA.comparison || {};
    const ps = comp.platform_summary || {};
    const dy = ps.douyin || {};
    const xhs = ps.xiaohongshu || {};
    function fmt(n) { return n >= 10000 ? (n/10000).toFixed(1) + '万' : n.toLocaleString(); }
    document.getElementById('compareSummary').innerHTML = `
      <div class="compare-card douyin"><h4><span class="compare-tag dy">抖音</span>平台概览</h4>
        <div class="stat-row"><span class="stat-label">覆盖关键词</span><span class="stat-value">${dy.total_keywords || 0} 个</span></div>
        <div class="stat-row"><span class="stat-label">作品总量</span><span class="stat-value">${fmt(dy.total_works || 0)}</span></div>
        <div class="stat-row"><span class="stat-label">平均点赞</span><span class="stat-value">${fmt(dy.avg_like || 0)}</span></div>
      </div>
      <div class="compare-card xiaohongshu"><h4><span class="compare-tag xhs">小红书</span>平台概览</h4>
        <div class="stat-row"><span class="stat-label">覆盖关键词</span><span class="stat-value">${xhs.total_keywords || 0} 个</span></div>
        <div class="stat-row"><span class="stat-label">笔记总量</span><span class="stat-value">${fmt(xhs.total_works || 0)}</span></div>
        <div class="stat-row"><span class="stat-label">平均点赞</span><span class="stat-value">${fmt(xhs.avg_like || 0)}</span></div>
      </div>`;
    const tbody = document.querySelector('#overlapTable tbody');
    tbody.innerHTML = (comp.overlapping || []).map(o => `<tr>
      <td><strong>${o.keyword}</strong></td><td>${o.category || ''}</td>
      <td>${fmt(o.douyin_total)}</td><td>${fmt(o.xhs_total)}</td>
      <td>${fmt(o.douyin_max_like)}</td><td>${fmt(o.xhs_max_like)}</td>
      <td><span class="compare-tag ${o.hotter_platform === 'douyin' ? 'dy' : 'xhs'}">${o.hotter_platform === 'douyin' ? '抖音' : '小红书'}</span></td>
    </tr>`).join('');
    document.getElementById('dyOnlyList').innerHTML = (comp.douyin_only || []).map(i => `<div class="stat-row"><span class="stat-label">${i.keyword}</span><span class="stat-value">${fmt(i.total)}</span></div>`).join('');
    document.getElementById('xhsOnlyList').innerHTML = (comp.xhs_only || []).map(i => `<div class="stat-row"><span class="stat-label">${i.keyword}</span><span class="stat-value">${fmt(i.total)}</span></div>`).join('');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "comparison",
      requiredFields: ['comparison'],
      render: function(data) {
        try { renderComparison(data); } catch(e) { console.error("[comparison]", e); }
      }
    });
  }
  window.renderComparison = renderComparison;
})();
