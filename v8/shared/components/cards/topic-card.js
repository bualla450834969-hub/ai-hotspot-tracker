/**
 * components/cards/topic-card.js
 * 选题卡片组件 - 新架构版本
 */
(function() {
  'use strict';

  function renderTopics() {
    const topics = window.DataLoader.getTopics();
    const formats = window.DataLoader.getDashboardData().content_formats || [];
    const fmtMap = {};
    formats.forEach(f => fmtMap[f.title] = f);
    
    const grid = document.getElementById('topicsGrid');
    if (!grid) return;

    const p = filterByPlatform(topics);
    const filtered = currentCategory === 'all' ? p : p.filter(h => h.category === currentCategory);

    const status = getKanbanStatus();
    grid.innerHTML = filtered.map((t, i) => {
      const fmt = fmtMap[t.title] || {};
      const st = status[t.title] || 'pending';
      const score = calcTopicScore(t);
      const adapt = getPlatformAdaptation(t);
      const mon = getMonetization(t);
      
      return `
        <div class="topic-card priority-${t.priority === '高' ? 'high' : t.priority === '中' ? 'medium' : 'low'} status-${st}" 
             id="topic-${i}" 
             onclick="cycleKanbanStatus(${i}, '${t.title.replace(/'/g, "\\'")}')">
          <div class="status-badge">${st === 'pending' ? '待拍摄' : st === 'shooting' ? '拍摄中' : '已发布'}</div>
          <div class="tc-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="tc-priority">${t.priority}优先</div>
          ${t.smart_priority ? '<span class="smart-priority ' + (t.smart_priority >= 60 ? 'high' : t.smart_priority >= 40 ? 'mid' : 'low') + '" title="信息差' + (t.priority_breakdown?.info_gap || 0) + ' 热度' + (t.priority_breakdown?.heat || 0) + ' 低竞争' + (t.priority_breakdown?.low_competition || 0) + '">智能 ' + t.smart_priority + '</span>' : ''}
          ${t.content_type ? '<span class="content-type-tag ' + t.content_type + '">' + t.content_type + '</span>' : ''}
          ${t.is_info_gap ? '<div class="info-gap-badge">💎 信息差</div>' : (t.is_forecast ? '<div class="forecast-badge">🔮 前瞻</div>' : '')}
          <div class="tc-title">${t.title}</div>
          ${t.heat_phase ? '<span class="heat-phase-badge ' + (t.heat_phase_color || '') + '">' + t.heat_phase + '</span>' : ''}
          <div class="tc-hook">${t.hook}</div>
          ${t.guide_comment ? '<div class="guide-comment">💬 小号引导：' + t.guide_comment + '</div>' : ''}
          <div style="display:flex;align-items:center;gap:12px;margin:6px 0">
            <div><span class="topic-score">${score.total}</span><span class="topic-score-label"> 综合分</span></div>
            <div style="flex:1">
              <div class="score-bar"><div class="score-bar-fill" style="width:${score.heat}%;background:#8b5cf6"></div></div>
              <div class="score-bar"><div class="score-bar-fill" style="width:${score.competition}%;background:#4ade80"></div></div>
              <div class="score-bar"><div class="score-bar-fill" style="width:${score.timing}%;background:#facc15"></div></div>
            </div>
          </div>
          <div class="adapt-tags">
            <span class="adapt-tag">抖音: ${adapt.dy.format}</span>
            <span class="adapt-tag">小红书: ${adapt.xhs.format}</span>
          </div>
          <div style="margin-top:6px">
            <span class="monetize-tag ${mon.cls}">${mon.name}</span>
            <span style="font-size:11px;color:var(--text-secondary)">变现潜力 ${mon.score}分 · ${mon.desc}</span>
          </div>
          ${t.conversion_path ? `<div class="conv-path">
            <div class="cp-title">转化路径 <span class="cp-level ${t.conversion_path.conversion_potential === '高' ? 'high' : t.conversion_path.conversion_potential === '中' ? 'medium' : 'low'}">${t.conversion_path.conversion_potential}转化</span></div>
            <div class="cp-row"><span class="cp-label">私域钩子：</span>${t.conversion_path.private_hook}</div>
            <div class="cp-row"><span class="cp-label">对应产品：</span>${t.conversion_path.product_match}</div>
          </div>` : ''}
        </div>
      `;
    }).join('');
  }

  function render() {
    window.ErrorHandler.safeExecute(() => {
      renderTopics();
      if (typeof generateSchedule === 'function') generateSchedule();
      if (typeof renderCommentScripts === 'function') renderCommentScripts();
      if (typeof renderChecklist === 'function') renderChecklist();
    }, '选题卡片');
  }

  window.renderTopicCard = render;
})();
