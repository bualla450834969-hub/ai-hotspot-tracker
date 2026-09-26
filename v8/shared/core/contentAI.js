/* ===== core/contentAI.js ===== */
(function() {
  'use strict';

  var ANALYSIS_VERSION = 'v8.3-a1';
  var PROXY_KEY = 'content_ai_proxy_url';

  function currentIndustryId() {
    var current = window.IndustryStore && IndustryStore.getCurrent ? IndustryStore.getCurrent() : null;
    return current && current.id ? current.id : (window.CURRENT_INDUSTRY || 'ai');
  }

  function cleanWork(work) {
    work = work || {};
    return {
      workId: work.workId || work.sourceId || '', title: work.title || '',
      caption: work.caption || '', transcript: work.transcript || '',
      author: work.author || work.accountName || '', platform: work.platform || '',
      likes: Number(work.likes || work.likeCount || 0), comments: Number(work.comments || work.commentCount || 0),
      favorites: Number(work.collects || work.collectCount || 0), shares: Number(work.shares || work.shareCount || 0),
      publishTime: work.publishTime || '', keyword: work._keyword || '', url: work.url || work.workUrl || ''
    };
  }

  function workIdentity(work) {
    var clean = cleanWork(work);
    var seed = clean.workId || [clean.platform, clean.title, clean.author, clean.url].join('|');
    var hash = 2166136261;
    for (var i = 0; i < seed.length; i++) { hash ^= seed.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return clean.workId || ('work_' + (hash >>> 0).toString(36));
  }

  function cacheKey(work) {
    return ['content_ai_analysis', encodeURIComponent(currentIndustryId()), encodeURIComponent(workIdentity(work)), ANALYSIS_VERSION].join('__');
  }

  function error(code, message) { var e = new Error(message); e.code = code; return e; }

  function proxyUrl() { return String(StorageAdapter.getRaw(PROXY_KEY, '') || '').trim(); }

  function request(action, payload) {
    var url = proxyUrl();
    if (!url) return Promise.reject(error('PROVIDER_NOT_CONFIGURED', '尚未配置安全 AI 代理。'));
    return fetch(url, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action:action, payload:payload, client:{ feature:'hot-content-to-script', version:ANALYSIS_VERSION } })
    }).then(function(response) {
      if (!response.ok) throw error('PROVIDER_REQUEST_FAILED', 'AI 代理请求失败（HTTP ' + response.status + '）。');
      return response.json();
    }).then(function(body) {
      if (!body || body.ok === false) throw error('PROVIDER_INVALID_RESPONSE', (body && body.error) || 'AI 代理返回无效结果。');
      return body.data || body;
    });
  }

  function validAnalysis(value) {
    var keys = ['successReason','hook','structure','emotion','reusableMethod'];
    return value && keys.every(function(key) { return typeof value[key] === 'string' && value[key].trim(); });
  }

  function scriptsFrom(value) {
    if (value && Array.isArray(value.scripts)) return value.scripts;
    if (value && value.script && typeof value.script === 'object') return [value.script];
    return value;
  }

  function validScripts(value, expectedCount) {
    var scripts = scriptsFrom(value);
    var keys = ['title','coverTitle','hook','script','cta','hashtags','estimatedDuration'];
    return Array.isArray(scripts) && scripts.length === expectedCount && scripts.every(function(item) {
      return item && keys.every(function(key) { return typeof item[key] === 'string' && item[key].trim(); });
    });
  }

  var adapter = {
    analysisVersion: ANALYSIS_VERSION,
    getProxyUrl: proxyUrl,
    setProxyUrl: function(url) { return StorageAdapter.setRaw(PROXY_KEY, String(url || '').trim()); },
    getCachedAnalysis: function(work) { return StorageAdapter.getJSON(cacheKey(work), null); },
    analyzeContent: function(work) {
      var cached = this.getCachedAnalysis(work);
      if (validAnalysis(cached)) return Promise.resolve({ analysis:cached, cached:true });
      var clean = cleanWork(work);
      return request('analyzeContent', { industryId:currentIndustryId(), work:clean, analysisVersion:ANALYSIS_VERSION }).then(function(result) {
        var analysis = result.analysis || result;
        if (!validAnalysis(analysis)) throw error('PROVIDER_INVALID_RESPONSE', 'AI 拆解缺少必要字段。');
        StorageAdapter.setJSON(cacheKey(work), analysis);
        return { analysis:analysis, cached:false };
      });
    },
    generateScript: function(options) {
      options = options || {};
      var payload = {
        industryId:currentIndustryId(), work:cleanWork(options.work), analysis:options.analysis || null,
        duration:Number(options.duration || 60), platform:options.platform || 'douyin', tone:options.tone || 'natural',
        userInput:String(options.userInput || ''), action:options.action || 'generate', currentScript:options.currentScript || null
      };
      return request('generateScript', payload).then(function(result) {
        var expectedCount = payload.action === 'generate' ? 3 : 1;
        if (!validScripts(result, expectedCount)) throw error('PROVIDER_INVALID_RESPONSE', expectedCount === 3 ? '原创口播结果必须包含 3 个完整且不同的方案。' : '快捷改写必须返回 1 个完整方案。');
        return { scripts:scriptsFrom(result) };
      });
    },
    _test: { cleanWork:cleanWork, workIdentity:workIdentity, cacheKey:cacheKey, validAnalysis:validAnalysis, validScripts:validScripts }
  };

  window.ContentAIAdapter = adapter;
})();
