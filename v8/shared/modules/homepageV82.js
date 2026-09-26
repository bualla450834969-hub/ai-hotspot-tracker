/* ===== modules/homepageV82.js ===== */
(function() {
  'use strict';

  // Research Workspace 保留为显式预览，不再替代默认的原版工作台。
  var params = new URLSearchParams(window.location.search);
  if (params.get('view') !== 'research') return;

  document.body.classList.add('v82-research');

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char];
    });
  }

  function ensureRoot() {
    var root = document.getElementById('v82ResearchHome');
    if (root) return root;
    root = document.createElement('main');
    root.id = 'v82ResearchHome';
    root.className = 'v82-home';
    var hero = document.querySelector('.hero');
    if (hero && hero.parentNode) hero.parentNode.insertBefore(root, hero);
    else document.body.appendChild(root);
    return root;
  }

  function state(type, title, description) {
    return '<div class="v82-state v82-state-' + type.toLowerCase() + '" data-state="' + type + '"><strong>' + esc(title) + '</strong><p>' + esc(description) + '</p></div>';
  }

  function strengthLabel(value) { return { HIGH:'高', MEDIUM:'中', LOW:'低' }[value] || '低'; }

  function insightCard(insight) {
    var sourceLabel = insight.type === 'need' ? '基于真实评论' : '基于真实作品 · 推导分析';
    return '<article class="v82-research-card"><span class="v82-data-source">' + sourceLabel + '</span>' +
      '<h3>' + esc(insight.title) + '</h3><p>' + esc(insight.description) + '</p>' +
      '<div class="v82-card-meta"><span>' + insight.evidenceIds.length + ' 条原始证据</span><span>证据强度：' + strengthLabel(insight.evidenceStrength.level) + '</span></div>' +
      '<div class="v82-card-actions">' +
      '<button type="button" data-v82-action="evidence" data-insight-id="' + esc(insight.id) + '">查看证据</button>' +
      '<button type="button" class="v82-secondary-action" data-v82-action="basis" data-insight-id="' + esc(insight.id) + '">计算依据</button></div></article>';
  }

  function section(number, id, title, summary, content) {
    return '<section class="v82-home-section" id="' + id + '"><header class="v82-home-section-head"><span>' + number + '</span><div><h2>' + title + '</h2><p>' + summary + '</p></div></header>' + content + '</section>';
  }

  function renderHeader(data, quality) {
    var industry = (data.summary && data.summary.industry) || (AppStore.industry && AppStore.industry.name) || '当前行业';
    if (AppStore.industry.id === 'ai') industry = 'AI';
    if (AppStore.industry.id === 'shufa') industry = '书法';
    var platformNames = { douyin:'抖音', xiaohongshu:'小红书' };
    var platforms = quality.platforms && quality.platforms.length ? quality.platforms.map(function(item) { return platformNames[item] || item; }).join('、') : '暂无平台信息';
    return '<header class="v82-research-header"><div><span class="v82-eyebrow">Industry Research</span><h1>' + esc(industry) + '</h1>' +
      '<p>行业内容研究 · 基于真实采集数据</p></div>' +
      '<div class="v82-context"><div><span>最后采集</span><strong>' + esc(quality.collectionTime || '未记录') + '</strong></div><div><span>数据来源</span><strong>' + esc(platforms) + '</strong></div></div>' +
      '<div class="v82-header-actions"><button type="button" class="v82-primary" data-v82-home-action="collect">重新采集</button><button type="button" data-v82-home-action="settings">行业设置</button></div></header>';
  }

  function renderQuality(quality) {
    var items = [[quality.worksCount,'作品'],[quality.keywordsCount,'关键词'],[quality.commentsCount,'评论'],[quality.platformsCount,'平台']].map(function(item) {
      return '<div><strong>' + item[0].toLocaleString() + '</strong><span>' + item[1] + '</span></div>';
    }).join('');
    var limitations = quality.limitations.map(function(item) { return '<li>' + esc(item) + '</li>'; }).join('');
    return section('02', 'v82DataQuality', '数据质量', '结论范围由当前样本决定，不使用综合评分。', '<div class="v82-quality-strip">' + items +
      '<div class="v82-quality-time"><span>最后采集</span><strong>' + esc(quality.collectionTime || '未记录') + '</strong></div></div>' +
      (limitations ? '<ul class="v82-limitations">' + limitations + '</ul>' : ''));
  }

  function renderInsights(number, id, title, summary, insights, emptyText) {
    var content = insights.length ? '<div class="v82-research-grid">' + insights.map(insightCard).join('') + '</div>' : state('NO_DATA', '暂无可验证结论', emptyText);
    return section(number, id, title, summary, content);
  }

  function renderUserVoice(analysis) {
    var content;
    if (!analysis.dataQuality.commentsCount) {
      content = state('DATA_INSUFFICIENT', '当前暂无评论样本', '因此暂时无法分析高频问题、用户痛点和用户需求。采集到真实评论后，这里将展示常见表达。');
    } else if (!analysis.userVoiceInsights.length) {
      content = state('DATA_INSUFFICIENT', '评论主题尚不足以形成结论', '已有评论样本，但没有达到可重复验证的主题门槛。');
    } else content = '<div class="v82-research-grid">' + analysis.userVoiceInsights.map(insightCard).join('') + '</div>';
    return section('05', 'v82UserVoice', '用户声音', '只分析真实评论 Evidence。', content);
  }

  function renderDeepDive(analysis) {
    if (!analysis.evidenceStore.count()) return section('06', 'v82DeepDive', '深入研究', '原始记录与完整研究范围。', state('NO_DATA', '暂无原始数据', '完成采集后可在这里查看作品、关键词和 Evidence。'));
    var works = analysis.evidenceStore.getEvidenceByType('work').slice(0, 8);
    var keywords = analysis.evidenceStore.getEvidenceByType('keyword').slice(0, 16);
    var rows = works.map(function(work) {
      return '<tr><td>' + esc(work.platform) + '</td><td>' + esc(work.title || '未提供标题') + '</td><td>' + esc(work.keyword || '未标注') + '</td><td>' + (work.metrics.likes == null ? '未采集' : work.metrics.likes.toLocaleString()) + '</td></tr>';
    }).join('');
    var tags = keywords.map(function(item) { return '<span>' + esc(item.keyword) + '</span>'; }).join('');
    return section('06', 'v82DeepDive', '进一步研究', '按需展开原始记录，首页默认保持简洁。', '<div class="v82-deep-links">' +
      '<details><summary><strong>浏览原始作品</strong><span>' + analysis.dataQuality.worksCount + ' 条记录</span></summary><div class="v82-table-wrap"><table><thead><tr><th>平台</th><th>标题</th><th>关键词</th><th>点赞</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>' +
      '<details><summary><strong>查看全部关键词</strong><span>' + analysis.dataQuality.keywordsCount + ' 个关键词</span></summary><div class="v82-keyword-list">' + tags + '</div></details>' +
      '<div class="v82-deep-link"><strong>Evidence 索引</strong><span>' + analysis.evidenceStore.count() + ' 条可追溯证据</span></div>' +
      '<div class="v82-deep-link"><strong>历史数据</strong><span>' + (analysis.dataQuality.historyDays >= 2 ? analysis.dataQuality.historyDays + ' 天记录' : '当前数据不足') + '</span></div></div>');
  }

  function render(data) {
    var root = ensureRoot();
    if (!window.ensureV82Analysis) { root.innerHTML = state('ERROR', '分析模块加载失败', '请刷新页面后重试。'); return; }
    var analysis = window.ensureV82Analysis(data);
    root.innerHTML = renderHeader(data, analysis.dataQuality) + renderQuality(analysis.dataQuality) +
      renderInsights('03', 'v82WhatsHot', '现在值得关注', '按真实作品样本量排序，每条结论均可查看证据。', analysis.hotInsights.slice(0, 4), '当前没有作品或采集关键词，无法判断热点。') +
      renderInsights('04', 'v82ContentPatterns', '内容表现模式', '只使用标题和真实互动字段，不推断播放量或转化。', analysis.contentPatternInsights.slice(0, 4), '当前样本尚未形成可验证的标题互动模式。') +
      renderUserVoice(analysis) + renderDeepDive(analysis);
  }

  function openSettings(prefill) {
    var panel = document.getElementById('settingsPanel');
    if (!panel) return;
    document.body.classList.add('v82-settings-open');
    panel.style.display = 'block';
    if (prefill) { var input = document.getElementById('industryInput'); if (input) input.value = AppStore.industry.name || ''; }
    panel.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  document.addEventListener('click', function(event) {
    var action = event.target.closest && event.target.closest('[data-v82-home-action]');
    if (!action) return;
    var type = action.getAttribute('data-v82-home-action');
    openSettings(type === 'collect');
    if (window.DynamicIndustryFlow) {
      DynamicIndustryFlow.renderManager();
      if (type === 'collect') DynamicIndustryFlow.openRecollect();
    }
  });

  if (window.Module) Module.register({ id:'homepageV82', requiredFields:[], render:render });
})();
