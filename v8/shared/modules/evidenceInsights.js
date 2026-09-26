/* ===== modules/evidenceInsights.js ===== */
/**
 * V8.2 Alpha 1可信洞察管线。
 * 每份DATA对象只建立一次Evidence索引，并通过AppStore提供查询API。
 */
(function() {
  'use strict';

  var cachedData = null;
  var cachedAnalysis = null;

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

  function render(data) {
    // 默认首页只保留分析能力和 AppStore 查询接口，不插入 Alpha 研究卡片。
    ensureAnalysis(data);
  }

  if (window.Module && window.V82Evidence) {
    Module.register({ id:'evidenceInsights', requiredFields:[], render:render });
  }
  window.ensureV82Analysis = ensureAnalysis;
})();
