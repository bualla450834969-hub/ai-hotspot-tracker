/**
 * modules/advanced/commentAnalysis.js
 * 自动拆分自 advancedAnalytics.js
 */
(function() {
  'use strict';
  
function renderCommentSemantic() {
    const el = document.getElementById('commentSemanticContent');
    if (!el) return;
    const cs = DASHBOARD_DATA.comment_semantic || {};
    el.innerHTML = `
      <div class="cs-section">
        <div class="cs-title">😣 用户痛点 <span class="cs-count">${(cs.pain_points||[]).length}</span></div>
        <div class="cs-tags">${(cs.pain_points||[]).slice(0,8).map(p=>`<span class="cs-tag pain">${p.keyword}<span class="cs-tag-count">${p.count}</span></span>`).join('') || '<span class="empty-state">暂无</span>'}</div>
      </div>
      <div class="cs-section">
        <div class="cs-title">❓ 用户提问 <span class="cs-count">${(cs.questions||[]).length}</span></div>
        <div class="cs-tags">${(cs.questions||[]).slice(0,8).map(p=>`<span class="cs-tag question">${p.keyword}<span class="cs-tag-count">${p.count}</span></span>`).join('') || '<span class="empty-state">暂无</span>'}</div>
      </div>
      <div class="cs-section">
        <div class="cs-title">💰 购买意向 <span class="cs-count">${(cs.purchase_intent||[]).length}</span></div>
        <div class="cs-tags">${(cs.purchase_intent||[]).slice(0,8).map(p=>`<span class="cs-tag purchase">${p.keyword}<span class="cs-tag-count">${p.count}</span></span>`).join('') || '<span class="empty-state">暂无</span>'}</div>
      </div>`;
  }

function renderConversionSignals() {
    const el = document.getElementById('conversionSignalList');
    if (!el) return;
    const list = DASHBOARD_DATA.conversion_signals || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无明显转化信号作品（评论中未检测到购买意向关键词）</div>'; return; }
    el.innerHTML = list.map(s => `
      <div class="cv-item glass-card">
        <div class="cv-title">${s.title}</div>
        <div class="cv-meta">
          <span>${s.platform==='douyin'?'抖音':'小红书'}</span>
          <span>👍 ${s.likeCount}</span>
          <span>💬 ${s.commentCount}</span>
          <span class="cv-signal">转化信号 ${s.conversion_signal_count}</span>
        </div>
      </div>`).join('');
  }

  // 注册到全局
  if (typeof window.registerModule === 'function') {
    window.registerModule('renderCommentSemantic', renderCommentSemantic);
    window.registerModule('renderConversionSignals', renderConversionSignals);
  }
})();
