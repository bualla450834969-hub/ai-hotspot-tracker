/* ===== modules/evidenceDrawer.js ===== */
(function() {
  'use strict';

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char];
    });
  }

  function fmt(value) {
    if (value === null || value === undefined) return '未采集';
    var number = Number(value);
    return isFinite(number) ? number.toLocaleString() : '未采集';
  }

  function safeUrl(value) {
    try {
      var url = new URL(String(value || ''), window.location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (e) { return ''; }
  }

  function ensureDrawer() {
    var drawer = document.getElementById('v82EvidenceDrawer');
    if (drawer) return drawer;
    drawer = document.createElement('aside');
    drawer.id = 'v82EvidenceDrawer';
    drawer.className = 'v82-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = '<div class="v82-drawer-backdrop" data-v82-close></div><div class="v82-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="v82DrawerTitle">' +
      '<header><div><span class="v82-drawer-kicker">Evidence</span><h2 id="v82DrawerTitle">证据</h2></div><button type="button" class="v82-close" data-v82-close aria-label="关闭">×</button></header>' +
      '<div class="v82-drawer-body" id="v82DrawerBody"></div></div>';
    document.body.appendChild(drawer);
    return drawer;
  }

  function insightById(id) {
    var analysis = window.AppStore && AppStore.v82;
    if (!analysis) return null;
    return analysis.insights.find(function(item) { return item.id === id; }) || null;
  }

  function evidenceCard(item) {
    var title = item.title || item.text || '未提供标题';
    var originalUrl = safeUrl(item.url);
    var link = originalUrl ? '<a href="' + escapeHTML(originalUrl) + '" target="_blank" rel="noopener noreferrer">查看原始内容</a>' : '<span class="v82-muted">原始链接未采集</span>';
    return '<article class="v82-evidence-card"><div class="v82-evidence-meta"><span>' + escapeHTML(item.platform || 'unknown') + '</span><span>' + escapeHTML(item.keyword || '未标注关键词') + '</span></div>' +
      '<h3>' + escapeHTML(title) + '</h3>' +
      (item.text && item.text !== item.title ? '<p>' + escapeHTML(item.text).slice(0, 180) + '</p>' : '') +
      '<div class="v82-metrics"><span>赞 ' + fmt(item.metrics.likes) + '</span><span>评 ' + fmt(item.metrics.comments) + '</span><span>藏 ' + fmt(item.metrics.favorites) + '</span><span>分享 ' + fmt(item.metrics.shares) + '</span></div>' +
      '<div class="v82-evidence-link">' + link + '</div></article>';
  }

  function renderBasis(insight, evidence) {
    var p = insight.provenance || {};
    var s = insight.evidenceStrength || {};
    var limitations = (p.limitations || []).concat((AppStore.v82.dataQuality && AppStore.v82.dataQuality.limitations) || []);
    var sourceName = insight.sourceType === 'REAL' ? '原始采集数据' : insight.sourceType === 'DERIVED' ? '由原始样本计算得出' : '基于现有样本推断';
    var method = insight.metrics && insight.metrics.averageEngagement != null
      ? '分析了 ' + evidence.length + ' 条相关作品标题，并计算点赞、评论、收藏和分享的平均互动。'
      : '分析了 ' + evidence.length + ' 条相关原始样本，按明确的采集关键词归组。';
    return '<section class="v82-basis"><p class="v82-basis-summary">' + escapeHTML(method) + '</p><dl>' +
      '<div><dt>数据来源</dt><dd>' + escapeHTML(sourceName) + '</dd></div>' +
      '<div><dt>样本数量</dt><dd>' + evidence.length + ' 条</dd></div>' +
      '<div><dt>依据强度</dt><dd>' + escapeHTML(s.level || 'LOW') + '：来源 ' + (s.sourceCount || 0) + ' 个平台，字段完整度 ' + Math.round((s.completeness || 0) * 100) + '%</dd></div>' +
      '</dl><h3>需要注意</h3>' + (limitations.length ? '<ul>' + limitations.map(function(item) { return '<li>' + escapeHTML(item) + '</li>'; }).join('') + '</ul>' : '<p class="v82-muted">无额外限制记录</p>') +
      '<details class="v82-advanced"><summary>高级信息</summary><dl><div><dt>来源字段</dt><dd>' + escapeHTML((p.sourceFields || []).join('、') || '未记录') + '</dd></div><div><dt>计算公式</dt><dd>' + escapeHTML(p.formula || '未使用公式') + '</dd></div><div><dt>生成模块</dt><dd>' + escapeHTML(p.generatedBy || '未记录') + '</dd></div></dl></details></section>';
  }

  function open(insightId, mode) {
    var drawer = ensureDrawer();
    var insight = insightById(insightId);
    var body = document.getElementById('v82DrawerBody');
    if (!insight || !body) {
      if (body) body.innerHTML = '<div class="v82-empty">未找到对应洞察或证据。</div>';
    } else {
      var evidence = AppStore.getEvidenceByInsight(insightId);
      document.getElementById('v82DrawerTitle').textContent = insight.title;
      body.innerHTML = mode === 'basis' ? renderBasis(insight, evidence) :
        '<div class="v82-drawer-summary">共 ' + evidence.length + ' 条原始证据</div>' +
        (evidence.length ? evidence.map(evidenceCard).join('') : '<div class="v82-empty">该洞察当前没有可展示的原始证据。</div>');
    }
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function close() {
    var drawer = document.getElementById('v82EvidenceDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('click', function(event) {
    var action = event.target.closest && event.target.closest('[data-v82-action]');
    if (action) open(action.getAttribute('data-insight-id'), action.getAttribute('data-v82-action'));
    if (event.target.closest && event.target.closest('[data-v82-close]')) close();
  });
  document.addEventListener('keydown', function(event) { if (event.key === 'Escape') close(); });
  window.openEvidenceDrawer = open;
  window.closeEvidenceDrawer = close;
})();
