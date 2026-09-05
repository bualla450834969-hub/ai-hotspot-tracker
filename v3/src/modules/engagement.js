/**
 * modules/engagement.js
 * 函数: renderEngagement
 * 依赖: ['engagement_analysis']
 */
(function() {
  'use strict';

  // renderEngagement
  function renderEngagement() {
    var ea = DATA.engagement_analysis || {};
    var el1 = document.getElementById('avgCommentRate');
    if (el1) el1.textContent = (ea.avg_comment_rate || 0) + '%';
    var el2 = document.getElementById('avgCollectRate');
    if (el2) el2.textContent = (ea.avg_collect_rate || 0) + '%';
    var listEl = document.getElementById('highCommentList');
    if (!listEl) return;
    var list = ea.high_comment_works || [];
    var html = list.slice(0, 5).map(function(w) {
      return '<div class="engage-item"><span class="ei-title">' + w.title + '</span><span class="ei-rate">' + w.comment_rate + '%</span><span class="ei-plat">' + w.platform + '</span></div>';
    }).join('');
    listEl.innerHTML = html || '<div style="font-size:11px;color:var(--text-tertiary);">暂无数据</div>';
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "engagement",
      requiredFields: ['engagement_analysis'],
      render: function(data) {
        try { renderEngagement(data); } catch(e) { console.error("[engagement]", e); }
      }
    });
  }
})();
