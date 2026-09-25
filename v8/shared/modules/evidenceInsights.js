/* ===== modules/evidenceInsights.js ===== */
/**
 * V8.2 Alpha 1可信洞察管线。
 * 每份DATA对象只建立一次Evidence索引，并通过AppStore提供查询API。
 */
(function() {
  'use strict';

  var cachedData = null;
  var cachedAnalysis = null;

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char];
    });
  }

  function exposeStore(analysis) {
    if (!window.AppStore) return;
    var store = analysis.evidenceStore;
    AppStore.v82 = analysis;
    AppStore.evidenceStore = store;
    AppStore.getEvidence = function(id) { return store.getEvidence(id); };
    AppStore.getEvidenceByIds = function(ids) { return store.getEvidenceByIds(ids); };
    AppStore.getEvidenceByType = function(type) { return store.getEvidenceByType(type); };
    AppStore.getEvidenceByInsight = function(id) { return store.getEvidenceByInsight(id); };
  }

  function ensureAnalysis(data) {
    data = data && typeof data === 'object' ? data : {};
    if (cachedData !== data || !cachedAnalysis) {
      cachedData = data;
      cachedAnalysis = window.V82Evidence.buildAnalysis(data);
    }
    exposeStore(cachedAnalysis);
    return cachedAnalysis;
  }

  function ensureRoot() {
    var root = document.getElementById('v82EvidenceInsights');
    if (root) return root;
    var insights = document.getElementById('insightsGrid');
    if (!insights || !insights.parentNode) return null;
    root = document.createElement('div');
    root.id = 'v82EvidenceInsights';
    root.className = 'v82-evidence-insights';
    insights.parentNode.insertBefore(root, insights.nextSibling);
    return root;
  }

  function strengthLabel(strength) {
    var labels = { HIGH:'高', MEDIUM:'中', LOW:'低' };
    return labels[strength && strength.level] || '低';
  }

  function render(data) {
    var root = ensureRoot();
    if (!root || !window.V82Evidence) return;
    var analysis = ensureAnalysis(data);
    var cards = analysis.insights.slice(0, 3).map(function(insight) {
      return '<article class="v82-insight" data-insight-id="' + escapeHTML(insight.id) + '">' +
        '<div class="v82-insight-head"><span class="v82-source">真实数据推导</span>' +
        '<span class="v82-strength v82-strength-' + insight.evidenceStrength.level.toLowerCase() + '">依据强度 ' + strengthLabel(insight.evidenceStrength) + '</span></div>' +
        '<h3>' + escapeHTML(insight.title) + '</h3>' +
        '<p>' + escapeHTML(insight.description) + '</p>' +
        '<div class="v82-insight-actions"><button type="button" data-v82-action="evidence" data-insight-id="' + escapeHTML(insight.id) + '">查看证据</button>' +
        '<button type="button" data-v82-action="basis" data-insight-id="' + escapeHTML(insight.id) + '">查看依据</button></div></article>';
    }).join('');
    var insufficient = analysis.unsupportedInsights.map(function(item) {
      var name = item.type === 'user_voice' ? '用户声音' : '趋势判断';
      return '<div class="v82-insufficient"><strong>' + name + '</strong><span>数据不足</span><small>' + escapeHTML(item.reason) + '</small></div>';
    }).join('');
    root.innerHTML = '<div class="v82-section-head"><h2>有证据的内容模式</h2><span>每条结论均可回到原始样本</span></div>' +
      (cards ? '<div class="v82-insight-grid">' + cards + '</div>' : '<div class="v82-empty">当前作品缺少可归组的采集关键词，暂不生成内容模式。</div>') +
      (insufficient ? '<div class="v82-quality-gates">' + insufficient + '</div>' : '');
  }

  if (window.Module && window.V82Evidence) {
    Module.register({ id:'evidenceInsights', requiredFields:[], render:render });
  }
  window.ensureV82Analysis = ensureAnalysis;
})();
