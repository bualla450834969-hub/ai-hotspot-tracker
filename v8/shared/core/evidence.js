/* ===== core/evidence.js ===== */
/**
 * V8.2 Alpha 1可信数据层：Evidence / Insight / Provenance / DataQuality。
 * 只读取V8.1数据，不修改works、hotwords或localStorage。
 */
(function() {
  'use strict';

  var SOURCE_TYPES = ['REAL', 'DERIVED', 'INFERRED'];
  var EVIDENCE_TYPES = ['work', 'comment', 'keyword'];
  var INSIGHT_TYPES = ['trend', 'pain_point', 'need', 'content_pattern', 'opportunity'];

  function text(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function nullableNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    var number = Number(value);
    return isFinite(number) ? number : null;
  }

  function stableHash(value) {
    var input = text(value);
    var hash = 2166136261;
    for (var i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function stableId(type, platform, sourceId, fallbackParts) {
    var identity = text(sourceId).trim();
    if (!identity) identity = 'key-' + stableHash((fallbackParts || []).map(text).join('|'));
    return ['evidence', type, text(platform || 'unknown'), encodeURIComponent(identity)].join(':');
  }

  function createProvenance(input) {
    input = input || {};
    var sourceType = SOURCE_TYPES.indexOf(input.sourceType) >= 0 ? input.sourceType : 'DERIVED';
    return {
      sourceType: sourceType,
      sourceFields: Array.isArray(input.sourceFields) ? input.sourceFields.slice() : [],
      formula: input.formula || null,
      sampleSize: nullableNumber(input.sampleSize) || 0,
      generatedBy: input.generatedBy || 'v8.2-analysis',
      generatedAt: input.generatedAt || new Date().toISOString(),
      limitations: Array.isArray(input.limitations) ? input.limitations.slice() : []
    };
  }

  function createEvidence(input) {
    input = input || {};
    if (EVIDENCE_TYPES.indexOf(input.type) < 0) return null;
    var platform = text(input.platform || 'unknown');
    var id = input.id || stableId(input.type, platform, input.sourceId, input.fallbackParts);
    return {
      id: id,
      type: input.type,
      platform: platform,
      sourceId: input.sourceId ? text(input.sourceId) : null,
      title: input.title ? text(input.title) : null,
      text: input.text ? text(input.text) : null,
      metrics: {
        likes: nullableNumber(input.metrics && input.metrics.likes),
        comments: nullableNumber(input.metrics && input.metrics.comments),
        shares: nullableNumber(input.metrics && input.metrics.shares),
        favorites: nullableNumber(input.metrics && input.metrics.favorites),
        views: nullableNumber(input.metrics && input.metrics.views)
      },
      keyword: input.keyword ? text(input.keyword) : null,
      author: input.author ? text(input.author) : null,
      url: input.url ? text(input.url) : null,
      publishedAt: input.publishedAt ? text(input.publishedAt) : null,
      collectedAt: input.collectedAt ? text(input.collectedAt) : null,
      provenance: createProvenance(input.provenance || { sourceType: 'REAL' })
    };
  }

  function EvidenceStore() {
    this.byId = new Map();
    this.byType = new Map();
    this.insightEvidence = new Map();
  }
  EvidenceStore.prototype.add = function(evidence) {
    if (!evidence || !evidence.id) return null;
    this.byId.set(evidence.id, evidence);
    if (!this.byType.has(evidence.type)) this.byType.set(evidence.type, []);
    var ids = this.byType.get(evidence.type);
    if (ids.indexOf(evidence.id) < 0) ids.push(evidence.id);
    return evidence;
  };
  EvidenceStore.prototype.getEvidence = function(id) { return this.byId.get(id) || null; };
  EvidenceStore.prototype.getEvidenceByIds = function(ids) {
    var self = this;
    return (ids || []).map(function(id) { return self.getEvidence(id); }).filter(Boolean);
  };
  EvidenceStore.prototype.getEvidenceByType = function(type) {
    return this.getEvidenceByIds(this.byType.get(type) || []);
  };
  EvidenceStore.prototype.linkInsight = function(insightId, evidenceIds) {
    this.insightEvidence.set(insightId, (evidenceIds || []).filter(function(id) { return this.byId.has(id); }, this));
  };
  EvidenceStore.prototype.getEvidenceByInsight = function(insightId) {
    return this.getEvidenceByIds(this.insightEvidence.get(insightId) || []);
  };
  EvidenceStore.prototype.count = function() { return this.byId.size; };

  function adaptV81Evidence(data) {
    data = data && typeof data === 'object' ? data : {};
    var store = new EvidenceStore();
    var collectedAt = data.last_update || null;
    var works = Array.isArray(data.works) ? data.works : [];
    works.forEach(function(work) {
      if (!work || typeof work !== 'object') return;
      store.add(createEvidence({
        type: 'work',
        platform: work.platform || work._platform || 'unknown',
        sourceId: work.workId || work.sourceId || null,
        fallbackParts: [work.workUrl || work.url, work.title, work.accountName || work.author, work.publishTime, work._keyword],
        title: work.title || work.name || null,
        text: work.content || work.title || null,
        metrics: {
          likes: work.likes != null ? work.likes : work.likeCount,
          comments: work.comments != null ? work.comments : work.commentCount,
          shares: work.shares != null ? work.shares : work.shareCount,
          favorites: work.collects != null ? work.collects : work.collectCount,
          views: work.views != null ? work.views : work.viewCount
        },
        keyword: work._keyword || work.keyword || null,
        author: work.author || work.accountName || null,
        url: work.url || work.workUrl || null,
        publishedAt: work.publishTime || work.published_at || null,
        collectedAt: work.crawlTime || collectedAt,
        provenance: { sourceType: 'REAL', sourceFields: ['works'], formula: null, sampleSize: 1, generatedBy: 'v8.1-compat' }
      }));
    });

    var comments = Array.isArray(data.comments) ? data.comments : [];
    comments.forEach(function(comment) {
      if (!comment || typeof comment !== 'object' || !text(comment.text || comment.content).trim()) return;
      store.add(createEvidence({
        type: 'comment',
        platform: comment.platform || 'unknown',
        sourceId: comment.commentId || comment.id || null,
        fallbackParts: [comment.workId, comment.text || comment.content, comment.author, comment.publishTime],
        text: comment.text || comment.content,
        metrics: { likes: comment.likes || comment.likeCount },
        keyword: comment.keyword || null,
        author: comment.author || comment.accountName || null,
        url: comment.url || null,
        publishedAt: comment.publishTime || null,
        collectedAt: comment.crawlTime || collectedAt,
        provenance: { sourceType: 'REAL', sourceFields: ['comments'], formula: null, sampleSize: 1, generatedBy: 'v8.1-compat' }
      }));
    });

    var hotwords = Array.isArray(data.hotwords) ? data.hotwords : [];
    hotwords.forEach(function(keyword) {
      if (!keyword || typeof keyword !== 'object' || !text(keyword.keyword).trim()) return;
      store.add(createEvidence({
        type: 'keyword',
        platform: keyword.platform || 'unknown',
        sourceId: [keyword.platform || 'unknown', keyword.keyword].join(':'),
        title: keyword.keyword,
        text: keyword.keyword,
        metrics: { likes: keyword.avg_like, comments: keyword.avg_comment, favorites: keyword.avg_collect, views: null },
        keyword: keyword.keyword,
        collectedAt: collectedAt,
        provenance: { sourceType: 'DERIVED', sourceFields: ['hotwords'], formula: 'keyword_aggregation', sampleSize: nullableNumber(keyword.works_count) || 0, generatedBy: 'v8.1-compat' }
      }));
    });
    return store;
  }

  function deriveDataQuality(data, store) {
    data = data && typeof data === 'object' ? data : {};
    var works = store.getEvidenceByType('work');
    var comments = store.getEvidenceByType('comment');
    var keywords = store.getEvidenceByType('keyword');
    var platforms = new Set(works.map(function(item) { return item.platform; }).filter(function(p) { return p && p !== 'unknown'; }));
    var history = Array.isArray(data.historical_trend) ? data.historical_trend : [];
    var missingFields = [];
    ['url', 'publishedAt', 'keyword'].forEach(function(field) {
      if (works.length && works.every(function(work) { return !work[field]; })) missingFields.push('works.' + field);
    });
    ['views'].forEach(function(field) {
      if (works.length && works.every(function(work) { return work.metrics[field] === null; })) missingFields.push('works.metrics.' + field);
    });
    var limitations = [];
    if (!works.length) limitations.push('作品样本不足，无法生成内容分析');
    if (!comments.length) limitations.push('评论样本不足，无法可靠分析用户声音');
    if (history.length < 2) limitations.push('缺少历史数据，无法判断增长趋势');
    if (platforms.size < 2) limitations.push('仅有单一平台样本，无法进行跨平台判断');
    return {
      worksCount: works.length,
      commentsCount: comments.length,
      keywordsCount: keywords.length,
      platformsCount: platforms.size,
      collectionTime: data.last_update || null,
      historyDays: history.length,
      missingFields: missingFields,
      availableSignals: {
        contentPatterns: works.length > 0,
        userVoice: comments.length > 0,
        trend: history.length >= 2,
        crossPlatform: platforms.size >= 2
      },
      limitations: limitations
    };
  }

  function evidenceCompleteness(evidence) {
    if (!evidence || !evidence.length) return 0;
    var total = evidence.length * 4;
    var present = evidence.reduce(function(sum, item) {
      return sum + (item.title ? 1 : 0) + (item.keyword ? 1 : 0) + (item.platform !== 'unknown' ? 1 : 0) + (item.url ? 1 : 0);
    }, 0);
    return total ? present / total : 0;
  }

  function deriveEvidenceStrength(evidence) {
    evidence = Array.isArray(evidence) ? evidence : [];
    var sources = new Set(evidence.map(function(item) { return item.platform; }).filter(function(p) { return p && p !== 'unknown'; })).size;
    var completeness = evidenceCompleteness(evidence);
    var level = evidence.length >= 20 && sources >= 2 && completeness >= 0.75 ? 'HIGH'
      : evidence.length >= 5 && completeness >= 0.5 ? 'MEDIUM' : 'LOW';
    return { level: level, sampleSize: evidence.length, sourceCount: sources, completeness: Math.round(completeness * 100) / 100 };
  }

  function createInsight(input, store) {
    input = input || {};
    if (INSIGHT_TYPES.indexOf(input.type) < 0 || SOURCE_TYPES.indexOf(input.sourceType) < 0) return null;
    var evidenceIds = Array.isArray(input.evidenceIds) ? input.evidenceIds.filter(function(id) { return !!store.getEvidence(id); }) : [];
    if (!evidenceIds.length) return null;
    var evidence = store.getEvidenceByIds(evidenceIds);
    var id = input.id || ['insight', input.type, stableHash([input.title, evidenceIds.join(',')].join('|'))].join(':');
    var insight = {
      id: id,
      type: input.type,
      title: text(input.title),
      description: text(input.description),
      sourceType: input.sourceType,
      evidenceStrength: deriveEvidenceStrength(evidence),
      metrics: input.metrics && typeof input.metrics === 'object' ? input.metrics : {},
      evidenceIds: evidenceIds,
      provenance: createProvenance(input.provenance),
      createdAt: input.createdAt || new Date().toISOString()
    };
    store.linkInsight(id, evidenceIds);
    return insight;
  }

  function buildContentPatternInsights(data, store) {
    var works = store.getEvidenceByType('work');
    var groups = new Map();
    works.forEach(function(work) {
      if (!work.keyword) return;
      if (!groups.has(work.keyword)) groups.set(work.keyword, []);
      groups.get(work.keyword).push(work.id);
    });
    return Array.from(groups.entries()).sort(function(a, b) { return b[1].length - a[1].length; }).slice(0, 5).map(function(entry) {
      var keyword = entry[0];
      var ids = entry[1];
      return createInsight({
        type: 'content_pattern',
        title: '“' + keyword + '”相关内容样本集中',
        description: '采集作品中有 ' + ids.length + ' 条由关键词“' + keyword + '”命中，可查看原始作品验证内容表现。',
        sourceType: 'DERIVED',
        metrics: { keyword: keyword, worksCount: ids.length },
        evidenceIds: ids,
        provenance: {
          sourceType: 'DERIVED',
          sourceFields: ['works._keyword', 'works.title', 'works.likeCount'],
          formula: 'group works by exact collection keyword; rank by matched work count',
          sampleSize: ids.length,
          generatedBy: 'v8.2-content-pattern',
          limitations: ['关键词来自采集任务，不等同于自然语言主题聚类']
        }
      }, store);
    }).filter(Boolean);
  }

  function buildAnalysis(data) {
    var store = adaptV81Evidence(data);
    var dataQuality = deriveDataQuality(data, store);
    var insights = dataQuality.availableSignals.contentPatterns ? buildContentPatternInsights(data, store) : [];
    var unsupportedInsights = [];
    if (!dataQuality.availableSignals.userVoice) unsupportedInsights.push({ type: 'user_voice', status: 'DATA_INSUFFICIENT', reason: '评论样本不足' });
    if (!dataQuality.availableSignals.trend) unsupportedInsights.push({ type: 'trend', status: 'DATA_INSUFFICIENT', reason: '历史数据不足' });
    return { evidenceStore: store, insights: insights, unsupportedInsights: unsupportedInsights, dataQuality: dataQuality };
  }

  var api = {
    stableHash: stableHash,
    stableId: stableId,
    createProvenance: createProvenance,
    createEvidence: createEvidence,
    createInsight: createInsight,
    EvidenceStore: EvidenceStore,
    adaptV81Evidence: adaptV81Evidence,
    deriveDataQuality: deriveDataQuality,
    deriveEvidenceStrength: deriveEvidenceStrength,
    buildContentPatternInsights: buildContentPatternInsights,
    buildAnalysis: buildAnalysis
  };
  window.V82Evidence = api;
})();
