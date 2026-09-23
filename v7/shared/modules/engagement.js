/**
 * modules/engagement.js
 * 函数: renderEngagement
 * 从works数据直接计算互动质量
 */
(function() {
  'use strict';

  function renderEngagement() {
    var works = (DATA.works || []).filter(function(w) { return (w.likeCount || 0) > 0; });
    if (!works.length) {
      var el1 = document.getElementById('avgCommentRate');
      if (el1) el1.textContent = '0%';
      var el2 = document.getElementById('avgCollectRate');
      if (el2) el2.textContent = '0%';
      var listEl = document.getElementById('highCommentList');
      if (listEl) listEl.innerHTML = '<div style="font-size:11px;color:var(--text-tertiary);">暂无数据</div>';
      return;
    }
    // 计算每条作品的评论率和收藏率（以点赞数为分母）
    var withRates = works.map(function(w) {
      var likes = w.likeCount || 1;
      return {
        title: w.title || '无标题',
        platform: w.platform || 'douyin',
        comment_rate: Math.round((w.commentCount || 0) / likes * 1000) / 10,
        collect_rate: Math.round((w.collectCount || 0) / likes * 1000) / 10,
        comments: w.commentCount || 0,
        collects: w.collectCount || 0,
        likes: likes
      };
    });
    var avgComment = Math.round(withRates.reduce(function(s, w) { return s + w.comment_rate; }, 0) / withRates.length * 10) / 10;
    var avgCollect = Math.round(withRates.reduce(function(s, w) { return s + w.collect_rate; }, 0) / withRates.length * 10) / 10;

    var el1 = document.getElementById('avgCommentRate');
    if (el1) el1.textContent = avgComment + '%';
    var el2 = document.getElementById('avgCollectRate');
    if (el2) el2.textContent = avgCollect + '%';

    var listEl = document.getElementById('highCommentList');
    if (!listEl) return;
    var top = withRates.sort(function(a, b) { return b.comment_rate - a.comment_rate; }).slice(0, 5);
    var html = top.map(function(w) {
      var shortTitle = w.title.length > 22 ? w.title.substring(0, 22) + '…' : w.title;
      var platLabel = w.platform === 'xiaohongshu' ? '小红书' : '抖音';
      return '<div class="engage-item"><span class="ei-title">' + shortTitle + '</span><span class="ei-rate">' + w.comment_rate + '%</span><span class="ei-plat">' + platLabel + '</span></div>';
    }).join('');
    listEl.innerHTML = html || '<div style="font-size:11px;color:var(--text-tertiary);">暂无数据</div>';
  }

  if (window.Module) {
    Module.register({
      id: "engagement",
      render: function() {
        try { renderEngagement(); } catch(e) { console.error("[engagement]", e); }
      }
    });
  }
  window.renderEngagement = renderEngagement;
})();
