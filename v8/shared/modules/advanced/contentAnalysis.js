/**
 * modules/advanced/contentAnalysis.js
 * 自动拆分自 advancedAnalytics.js
 */
(function() {
  'use strict';
  
function renderTitleGenes() {
    const el = document.getElementById('titleGeneList');
    if (!el) return;
    const list = DASHBOARD_DATA.title_gene_library || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    el.innerHTML = list.map(g => `
      <div class="tg-item glass-card">
        <div class="tg-header">
          <span class="tg-pattern">${g.pattern}</span>
          <span class="tg-count">${g.count}条</span>
          <span class="tg-like">均赞 ${g.avg_like}</span>
        </div>
        <div class="tg-formula">💡 ${g.formula}</div>
        ${g.examples && g.examples.length ? `<div class="tg-examples">${g.examples.map(e=>`<div class="tg-example">"${e}"</div>`).join('')}</div>` : ''}
      </div>`).join('');
  }

function renderCompletionRate() {
    const el = document.getElementById('completionRateChart');
    if (!el) return;
    const list = DASHBOARD_DATA.completion_rate_analysis || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    const max = Math.max(...list.map(d=>d.avg_completion));
    el.innerHTML = list.map(d => `
      <div class="cr-row">
        <div class="cr-label">${d.duration_bucket}</div>
        <div class="cr-bar-wrap"><div class="cr-bar" style="width:${(d.avg_completion/max*100)}%">${d.avg_completion}%</div></div>
        <div class="cr-sample">${d.sample_count}样本</div>
      </div>`).join('');
  }

function renderFormatROI() {
    const el = document.getElementById('formatROIList');
    if (!el) return;
    const list = DASHBOARD_DATA.content_format_roi || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    const max = Math.max(...list.map(d=>d.engagement_score));
    el.innerHTML = list.map(f => `
      <div class="roi-item">
        <div class="roi-header">
          <span class="roi-format">${f.format}</span>
          <span class="roi-count">${f.count}条</span>
        </div>
        <div class="roi-bars">
          <div class="roi-bar-row"><span>均赞</span><div class="roi-bar"><div style="width:${(f.avg_like/max*100)}%"></div></div><span>${f.avg_like}</span></div>
          <div class="roi-bar-row"><span>互动分</span><div class="roi-bar engagement"><div style="width:${(f.engagement_score/max*100)}%"></div></div><span>${f.engagement_score}</span></div>
        </div>
      </div>`).join('');
  }

  // 注册到全局
  if (typeof window.registerModule === 'function') {
    window.registerModule('renderTitleGenes', renderTitleGenes);
    window.registerModule('renderCompletionRate', renderCompletionRate);
    window.registerModule('renderFormatROI', renderFormatROI);
  }
})();
