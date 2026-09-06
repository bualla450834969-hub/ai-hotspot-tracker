/**
 * modules/techradar.js
 * 函数: renderTechRadar
 * 依赖: ['tech_signals']
 */
(function() {
  'use strict';

  // renderTechRadar
  function renderTechRadar() {
    var ts = window.DASHBOARD_DATA && window.DASHBOARD_DATA.tech_signals;
    if (!ts || !ts.signals || ts.signals.length === 0) {
      document.getElementById('techradar').parentElement.style.display = 'none';
      return;
    }
    var summary = ts.summary || {};
    var sumHtml = '';
    sumHtml += '<div class="tech-summary-card blue"><div class="num">' + (summary.blue_ocean || 0) + '</div><div class="label">🔵 蓝海机会</div></div>';
    sumHtml += '<div class="tech-summary-card fire"><div class="num">' + (summary.exploding || 0) + '</div><div class="label">🔥 正在爆发</div></div>';
    sumHtml += '<div class="tech-summary-card rise"><div class="num">' + (summary.rising || 0) + '</div><div class="label">📈 上升期</div></div>';
    sumHtml += '<div class="tech-summary-card watch"><div class="num">' + (summary.watching || 0) + '</div><div class="label">👀 观察中</div></div>';
    document.getElementById('techSummary').innerHTML = sumHtml;

    var grid = document.getElementById('techGrid');
    var html = '';
    ts.signals.slice(0, 12).forEach(function(sig) {
      var a = sig.analysis || {};
      var opp = a.opportunity || '';
      var badgeClass = 'watch';
      if (opp.indexOf('蓝海') >= 0) badgeClass = 'blue';
      else if (opp.indexOf('爆发') >= 0) badgeClass = 'fire';
      else if (opp.indexOf('上升') >= 0) badgeClass = 'rise';
      var name = sig.name || '';
      var shortName = name.indexOf('/') >= 0 ? name.split('/').pop() : name;
      var meta = '';
      if (sig.source === 'github') {
        var daysOld = sig.days_old ? sig.days_old + '天前创建' : '';
        meta = '<span>⭐ ' + (sig.stars || 0) + '</span><span>🍴 ' + (sig.forks || 0) + '</span><span>📈 ' + (sig.star_growth_per_day || 0) + '/天</span>' + (daysOld ? '<span>🕐 ' + daysOld + '</span>' : '');
      } else if (sig.source === 'huggingface') {
        meta = '<span>⬇️ ' + (sig.downloads || 0) + '</span><span>❤️ ' + (sig.likes || 0) + '</span><span>' + (sig.pipeline || '') + '</span>';
      }
      var newBadge = sig.is_new ? '<span class="new-badge">NEW</span>' : '';
      var matchKw = (a.matched_hotwords || []).map(function(k) { return '<span class="match-kw">' + k + '</span>'; }).join('');
      var techHeat = a.tech_heat || 0;
      var socialHeat = a.social_heat || 0;
      html += '<div class="tech-card">';
      html += '<div class="tech-source">' + (sig.source === 'github' ? 'GitHub' : 'HuggingFace') + '</div>';
      html += '<div class="tech-header"><div class="tech-name">' + newBadge + shortName + '</div><span class="tech-badge ' + badgeClass + '">' + opp + '</span></div>';
      var descZh = sig.description_zh || sig.description || '暂无描述';
      var descEn = sig.description_zh ? sig.description : '';
      html += '<div class="tech-desc">' + descZh + '</div>';
      if (descEn) html += '<div class="tech-desc-en">' + descEn + '</div>';
      html += '<div class="tech-meta">' + meta + '</div>';
      html += '<div class="tech-heat-bar"><div class="tech-fill t" style="width:' + techHeat + '%"></div></div>';
      html += '<div class="tech-heat-labels"><span>技术热度 ' + techHeat + '</span><span>社媒热度 ' + socialHeat + '</span></div>';
      html += '<div class="tech-heat-bar" style="margin-top:4px"><div class="tech-fill s" style="width:' + socialHeat + '%"></div></div>';
      if (matchKw) html += '<div class="tech-match">关联热词: ' + matchKw + '</div>';
      html += '<div class="tech-reason">' + (a.reason || '') + '</div>';
      html += '</div>';
    });
    grid.innerHTML = html;
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "techradar",
      requiredFields: ['tech_signals'],
      render: domainGuard("techradar", function(data) {
        try { renderTechRadar(data); } catch(e) { console.error("[techradar]", e); }
      })
    });
  }
  window.renderTechRadar = renderTechRadar;
})();
