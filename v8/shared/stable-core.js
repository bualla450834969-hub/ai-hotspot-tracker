/* ============================================================
 * stable-core.js — V8.1 Stable 行业数据稳定核心
 * 必须在 bundle.js 与行业加载逻辑【之前】加载（普通脚本，立即执行）。
 *
 * 职责：
 *  1. 唯一数据源 window.AppStore；DATA / DASHBOARD_DATA 为其访问器别名，
 *     保证 window.DATA === window.DASHBOARD_DATA === AppStore.data，杜绝多入口。
 *  2. 统一行业上下文解析 parseIndustryContext()（builtin / local / dynamic）。
 *  3. localStorage 行业命名空间 NS（读新 key → 回退旧 key → 自动迁移）。
 *  4. ECharts 安全初始化：自动接管全局 echarts，容器无尺寸不 init、
 *     WeakMap 防重复、有限重试、dispose 清理；单图失败不拖垮页面。
 *  5. 模块级错误隔离 safeRender + showModuleFallback。
 *  6. TimerManager 统管 interval/timeout，切行业/页面时一次清理。
 *  7. AppErrorHandler 统一错误收口（局部错误不白屏、不整体替换 body）。
 *  8. 请求版本号 nextRequest/isCurrent，丢弃旧行业/旧批次异步回写。
 *  9. ?debug=1 调试面板。
 * 10. safeDivide / safeNum 数值安全，杜绝 NaN / Infinity。
 * ============================================================ */
(function () {
  'use strict';
  if (window.__stableCore) return;
  window.__stableCore = true;

  /* ---------- 1. 行业上下文解析（唯一入口） ---------- */
  // 中文行业名 → 英文 slug
  var SLUG_MAP = { '书法': 'shufa', '書法': 'shufa' };

  function parseIndustryContext(rawInd) {
    var ind = rawInd;
    if (ind === undefined || ind === null) {
      try {
        var params = new URLSearchParams(window.location.search);
        ind = params.get('industry') || params.get('ind');
      }
      catch (e) { ind = null; }
    }
    ind = ind || 'ai';
    if (SLUG_MAP[ind]) ind = SLUG_MAP[ind];

    var isLocal = ind.indexOf('local:') === 0;
    var isDynamic = /^ind_[a-z0-9]+$/i.test(ind);
    var name = isLocal ? decodeURIComponent(ind.slice(6)) : ind;
    return {
      type: isLocal ? 'local' : (isDynamic ? 'dynamic' : 'builtin'),
      id: ind,                                   // 完整 id（local:xx 或英文 slug）
      name: name,                                // 展示名
      configKey: isLocal ? ('custom_cfg_' + name) : (isDynamic ? ('industry_' + ind + '_config') : null),
      dataKey: isLocal ? ('custom_data_' + name) : (isDynamic ? ('industry_' + ind + '_data') : null),
      historyKey: isDynamic ? ('industry_' + ind + '_history') : null,
      base: (isLocal || isDynamic) ? null : ('../industries/' + ind + '/')
    };
  }

  var CTX = parseIndustryContext();

  /* ---------- 1.5 Industry Layer ---------- */
  var IndustryStore = {
    current: CTX,
    getCurrent: function () { return this.current; },
    resolve: function (raw) { return parseIndustryContext(raw); },
    setCurrent: function (raw) {
      this.current = parseIndustryContext(raw);
      return this.current;
    }
  };
  window.IndustryStore = IndustryStore;

  /* ---------- 2. 唯一数据源 AppStore ---------- */
  var AppStore = {
    schemaVersion: 2,
    industry: { id: CTX.id, name: CTX.name, type: CTX.type },
    data: null,
    status: { loading: false, error: null, ready: false },
    requestId: 0,
    renderCount: 0,
    /** 开启新一轮异步批次，返回版本号 */
    nextRequest: function () { return ++this.requestId; },
    /** 判断某批次是否仍为当前（旧批次回写应被丢弃） */
    isCurrent: function (rid) { return rid === this.requestId; }
  };
  window.AppStore = AppStore;

  // DATA / DASHBOARD_DATA 永远是 AppStore.data 的访问器别名
  function installDataAlias(prop) {
    Object.defineProperty(window, prop, {
      configurable: true,
      get: function () { return AppStore.data; },
      set: function (v) { AppStore.data = (v === null || v === undefined) ? {} : v; return AppStore.data; }
    });
  }
  installDataAlias('DATA');
  installDataAlias('DASHBOARD_DATA');

  /* ---------- 3. localStorage 行业命名空间 ---------- */
  var StorageAdapter = {
    getRaw: function (key, fallback) {
      try {
        var value = localStorage.getItem(key);
        return value === null ? (fallback === undefined ? null : fallback) : value;
      } catch (e) { AppErrorHandler.handle(e, 'StorageAdapter.getRaw:' + key); return fallback === undefined ? null : fallback; }
    },
    setRaw: function (key, value) {
      try { localStorage.setItem(key, String(value)); return true; }
      catch (e) { AppErrorHandler.handle(e, 'StorageAdapter.setRaw:' + key); return false; }
    },
    getJSON: function (key, fallback) {
      var raw = this.getRaw(key, null);
      if (raw === null) return fallback === undefined ? null : fallback;
      try { return JSON.parse(raw); }
      catch (e) { AppErrorHandler.handle(e, 'StorageAdapter.getJSON:' + key); return fallback === undefined ? null : fallback; }
    },
    setJSON: function (key, value) {
      try { return this.setRaw(key, JSON.stringify(value)); }
      catch (e) { AppErrorHandler.handle(e, 'StorageAdapter.setJSON:' + key); return false; }
    },
    remove: function (key) {
      try { localStorage.removeItem(key); return true; }
      catch (e) { AppErrorHandler.handle(e, 'StorageAdapter.remove:' + key); return false; }
    },
    getIndustryConfig: function (industry) {
      var ctx = typeof industry === 'string' ? parseIndustryContext(industry) : (industry || IndustryStore.getCurrent());
      return ctx.type !== 'builtin' ? this.getJSON(ctx.configKey, {}) : null;
    },
    saveIndustryConfig: function (industry, value) {
      var ctx = typeof industry === 'string' ? parseIndustryContext(industry) : industry;
      return !!ctx && ctx.type !== 'builtin' && this.setJSON(ctx.configKey, value);
    },
    getIndustryData: function (industry) {
      var ctx = typeof industry === 'string' ? parseIndustryContext(industry) : (industry || IndustryStore.getCurrent());
      return ctx.type !== 'builtin' ? this.getJSON(ctx.dataKey, {}) : null;
    },
    saveIndustryData: function (industry, value) {
      var ctx = typeof industry === 'string' ? parseIndustryContext(industry) : industry;
      return !!ctx && ctx.type !== 'builtin' && this.setJSON(ctx.dataKey, value);
    },
    listIndustries: function () { return this.getJSON('custom_industries', []) || []; },
    saveIndustryList: function (value) { return this.setJSON('custom_industries', value || []); }
  };
  window.StorageAdapter = StorageAdapter;

  var NS = {
    scope: function () { return 'hs_' + encodeURIComponent(IndustryStore.getCurrent().id); },
    _newKey: function (key) { return this.scope() + '__' + key; },
    /** 读：优先新 key；不存在则尝试旧 key 并一次性迁移 */
    _resolve: function (key) {
      var nk = this._newKey(key);
      if (StorageAdapter.getRaw(nk, null) !== null) return nk;
      if (StorageAdapter.getRaw(key, null) !== null) {
        try { StorageAdapter.setRaw(nk, StorageAdapter.getRaw(key)); }
        catch (e) { AppErrorHandler.handle(e, 'NS.migrate:' + key); }
      }
      return nk;
    },
    get: function (key, def) {
      try {
        var raw = StorageAdapter.getRaw(this._resolve(key), null);
        return raw === null ? (def === undefined ? null : def) : JSON.parse(raw);
      } catch (e) { AppErrorHandler.handle(e, 'NS.get:' + key); return def === undefined ? null : def; }
    },
    set: function (key, val) {
      try { StorageAdapter.setJSON(this._newKey(key), val); }
      catch (e) { AppErrorHandler.handle(e, 'NS.set:' + key); }
    },
    remove: function (key) {
      try { StorageAdapter.remove(this._newKey(key)); } catch (e) {}
    }
  };
  window.NS = NS;
  window.parseIndustryContext = parseIndustryContext;

  /* ---------- 3.5 数据契约补齐（唯一实现，渲染前调用） ---------- */
  var FIELD_DEFAULTS = {
    works: [], hotwords: [], topics: [], viral_genes: {},
    title_formulas: [], title_formulas_array: [], publish_time_dist: [],
    saturation: [], daily_actions: [], blue_ocean_list: [], growth_ranking: [],
    tech_signals: [], audience_personas: [], comment_scripts: [], format_roi: [],
    competitor_list: [], comment_semantic: {}, conversion_signals: [],
    cross_platform: [], launch_ops: [], pitfall_list: [], topic_performance: {},
    content_formats_dist: [], content_format_dist: [], summary: {}
  };
  window.normalizeDataContract = function () {
    var D = AppStore.data;
    if (!D || typeof D !== 'object') return;
    Object.keys(FIELD_DEFAULTS).forEach(function (k) {
      if (D[k] === undefined || D[k] === null) {
        var def = FIELD_DEFAULTS[k];
        D[k] = Array.isArray(def) ? [] : (typeof def === 'object' ? {} : def);
      }
    });
    // hotwords 每项补安全字段
    (D.hotwords || []).forEach(function (h) {
      if (h.max_like === undefined) h.max_like = 0;
      if (h.collect_rate === undefined) h.collect_rate = 0;
      if (!h.trend) h.trend = '稳定';
      if (!h.category) h.category = '其他';
    });
    // viral_genes 补字段
    if (D.viral_genes) {
      if (!D.viral_genes.hook_distribution) D.viral_genes.hook_distribution = [];
      if (!D.viral_genes.top_title_keywords) D.viral_genes.top_title_keywords = [];
      if (!D.viral_genes.structure_examples) D.viral_genes.structure_examples = [];
      if (D.viral_genes.sample_size === undefined) D.viral_genes.sample_size = (D.works || []).length;
      if (D.viral_genes.avg_title_length === undefined) D.viral_genes.avg_title_length = 20;
    }
    if (D.schemaVersion === undefined) D.schemaVersion = AppStore.schemaVersion;
  };

  /* ---------- 4. 数值安全 ---------- */
  function safeDivide(a, b, fallback) {
    a = Number(a); b = Number(b);
    if (!isFinite(a) || !isFinite(b) || b === 0) return fallback === undefined ? 0 : fallback;
    return a / b;
  }
  window.safeDivide = safeDivide;
  window.safeNum = function (v, def) {
    v = Number(v);
    return isFinite(v) ? v : (def === undefined ? 0 : def);
  };

  /* ---------- 5. TimerManager ---------- */
  var liveIntervals = {};
  var liveTimeouts = {};
  var TimerManager = {
    setInterval: function (fn, ms, tag) {
      var id = setInterval(fn, ms);
      liveIntervals[id] = { tag: tag || '' };
      return id;
    },
    setTimeout: function (fn, ms, tag) {
      var id = setTimeout(function () { delete liveTimeouts[id]; fn(); }, ms);
      liveTimeouts[id] = { tag: tag || '' };
      return id;
    },
    clearInterval: function (id) { clearInterval(id); delete liveIntervals[id]; },
    clearTimeout: function (id) { clearTimeout(id); delete liveTimeouts[id]; },
    /** 切换行业 / 卸载页面时清理全部定时器 */
    clearAll: function () {
      Object.keys(liveIntervals).forEach(function (id) { clearInterval(parseInt(id, 10)); });
      Object.keys(liveTimeouts).forEach(function (id) { clearTimeout(parseInt(id, 10)); });
      liveIntervals = {};
      liveTimeouts = {};
    },
    stats: function () {
      return { intervals: Object.keys(liveIntervals).length, timeouts: Object.keys(liveTimeouts).length,
        total: Object.keys(liveIntervals).length + Object.keys(liveTimeouts).length };
    }
  };
  window.TimerManager = TimerManager;

  /* ---------- 5.5 Event / Effects lifecycle ---------- */
  var managedEvents = [];
  var EventManager = {
    on: function (target, type, handler, options, tag) {
      if (!target || !target.addEventListener) return function () {};
      var existing = managedEvents.find(function (record) {
        return record.target === target && record.type === type && record.handler === handler && record.tag === (tag || '');
      });
      if (existing) return function () { EventManager.off(existing); };
      target.addEventListener(type, handler, options);
      var record = { target: target, type: type, handler: handler, options: options, tag: tag || '' };
      managedEvents.push(record);
      return function () { EventManager.off(record); };
    },
    off: function (record) {
      if (!record) return;
      try { record.target.removeEventListener(record.type, record.handler, record.options); } catch (e) {}
      var index = managedEvents.indexOf(record);
      if (index >= 0) managedEvents.splice(index, 1);
    },
    clear: function (tag) {
      managedEvents.slice().forEach(function (record) {
        if (!tag || record.tag === tag) EventManager.off(record);
      });
    },
    count: function () { return managedEvents.length; }
  };
  window.EventManager = EventManager;

  var effectCleanups = [];
  var EffectsManager = {
    register: function (cleanup, tag) {
      if (typeof cleanup === 'function') effectCleanups.push({ cleanup: cleanup, tag: tag || '' });
      return cleanup;
    },
    initPage: function () {
      if (typeof window.initCardGlow === 'function') window.initCardGlow();
    },
    destroyPage: function () {
      effectCleanups.splice(0).forEach(function (item) {
        try { item.cleanup(); } catch (e) { AppErrorHandler.handle(e, 'EffectsManager.destroy:' + item.tag); }
      });
      EventManager.clear('effect');
    },
    count: function () { return effectCleanups.length; }
  };
  window.EffectsManager = EffectsManager;

  /* ---------- 6. ECharts 安全初始化 ---------- */
  var chartRegistry = new Map();   // dom → 真实实例；可枚举以便统一销毁和泄漏计数
  function domReady(dom) {
    return !!dom && dom.isConnected === true && dom.clientWidth > 10 && dom.clientHeight > 10;
  }

  function registerChart(dom, inst) {
    if (!dom || !inst) return inst;
    chartRegistry.set(dom, inst);
    if (!inst.__stableDisposeWrapped && typeof inst.dispose === 'function') {
      var originalDispose = inst.dispose.bind(inst);
      inst.dispose = function () {
        chartRegistry.delete(dom);
        return originalDispose();
      };
      inst.__stableDisposeWrapped = true;
    }
    return inst;
  }

  /**
   * 容器无尺寸时返回一个"延迟代理"：缓存 setOption/resize 调用，
   * 容器一旦有尺寸即创建真实实例并按顺序重放，避免调用方 .setOption 报错。
   */
  function makeDeferred(ec, dom, theme, opts) {
    var queue = [];
    var real = null;
    var tries = 0;
    var requestId = AppStore.requestId;
    var iv = TimerManager.setInterval(function () {
      tries++;
      if (real) return;
      if (!AppStore.isCurrent(requestId) || !dom || !dom.isConnected) {
        TimerManager.clearInterval(iv);
        queue = [];
        chartRegistry.delete(dom);
        return;
      }
      if (domReady(dom)) {
        TimerManager.clearInterval(iv);
        if (!ec.getInstanceByDom(dom)) real = registerChart(dom, ec.__origInit(dom, theme, opts));
        else real = registerChart(dom, ec.getInstanceByDom(dom));
        var pending = queue; queue = [];
        pending.forEach(function (args) {
          try { real.setOption.apply(real, args); }
          catch (e) { AppErrorHandler.handle(e, 'chart.replay'); }
        });
      } else if (tries > 50) {
        TimerManager.clearInterval(iv); // 约 10s 仍无尺寸，放弃（不产生 0 尺寸实例）
      }
    }, 200, 'chart-defer');

    return {
      __deferred: true,
      setOption: function () { if (real) real.setOption.apply(real, arguments); else queue.push(Array.prototype.slice.call(arguments)); return this; },
      resize: function () { if (real) return real.resize.apply(real, arguments); return this; },
      showLoading: function () { if (real) real.showLoading.apply(real, arguments); return this; },
      hideLoading: function () { if (real) real.hideLoading.apply(real, arguments); return this; },
      on: function () { if (real) real.on.apply(real, arguments); return this; },
      dispose: function () { try { TimerManager.clearInterval(iv); if (real) real.dispose(); } catch (e) {} chartRegistry.delete(dom); return this; }
    };
  }

  function patchEcharts(ec) {
    if (!ec || typeof ec.init !== 'function' || ec.__patched) return ec;
    ec.__origInit = ec.init.bind(ec);
    ec.init = function (dom, theme, opts) {
      if (!dom) return ec.__origInit(dom, theme, opts);
      var existing = ec.getInstanceByDom ? ec.getInstanceByDom(dom) : null;
      if (existing) return registerChart(dom, existing);
      if (chartRegistry.has(dom)) chartRegistry.delete(dom);
      if (domReady(dom)) {
        return registerChart(dom, ec.__origInit(dom, theme, opts));
      }
      return makeDeferred(ec, dom, theme, opts); // 无尺寸：延迟代理，不在 0 尺寸 init
    };
    ec.__patched = true;
    ec.safeChartInit = function (dom, theme, opts) { return ec.init(dom, theme, opts); };
    return ec;
  }
  window.patchEcharts = patchEcharts;

  // echarts 由 CDN（UMD）加载。UMD 会先执行 `window.echarts = {}` 再由 factory 往该
  // 对象上填充 init 等方法，故不能只在"赋值瞬间"patch（那时还是无 init 的空对象）。
  // 改为：set 仅存引用；get（首次真正使用 echarts）时检测到已完整再懒 patch。
  var _ec;
  function _ensureEc() {
    if (_ec && typeof _ec.init === 'function' && !_ec.__patched) patchEcharts(_ec);
    return _ec;
  }
  try {
    Object.defineProperty(window, 'echarts', {
      configurable: true,
      get: _ensureEc,
      set: function (v) {
        _ec = v;
        if (v && typeof v.init === 'function' && !v.__patched) patchEcharts(v);
      }
    });
  } catch (e) {
    if (window.echarts) patchEcharts(window.echarts);
  }
  window.safeChartInit = function (dom, theme, opts) {
    return window.echarts ? window.echarts.init(dom, theme, opts) : null;
  };
  window.safeChartDispose = function (chart) {
    if (!chart || typeof chart.dispose !== 'function') return;
    try { chart.dispose(); }
    catch (e) { AppErrorHandler.handle(e, 'chart.dispose'); }
  };
  window.safeChartResize = function (chart) {
    if (!chart || typeof chart.resize !== 'function') return;
    try {
      if (typeof chart.isDisposed === 'function' && chart.isDisposed()) return;
      chart.resize();
    } catch (e) { AppErrorHandler.handle(e, 'chart.resize'); }
  };

  var ChartManager = {
    create: function (dom, theme, opts) { return window.safeChartInit(dom, theme, opts); },
    get: function (dom) { return chartRegistry.get(dom) || (window.echarts && window.echarts.getInstanceByDom ? window.echarts.getInstanceByDom(dom) : null); },
    update: function (dom, option, replace) {
      var chart = this.get(dom) || this.create(dom);
      if (chart && typeof chart.setOption === 'function') chart.setOption(option, !!replace);
      return chart;
    },
    resize: function (dom) { window.safeChartResize(this.get(dom)); },
    dispose: function (dom) {
      var chart = dom && typeof dom.dispose === 'function' ? dom : this.get(dom);
      window.safeChartDispose(chart);
      if (dom && dom.nodeType) chartRegistry.delete(dom);
    },
    disposeAll: function () {
      Array.from(chartRegistry.entries()).forEach(function (entry) {
        try { window.safeChartDispose(entry[1]); } catch (e) {}
        chartRegistry.delete(entry[0]);
      });
    },
    count: function () { return chartRegistry.size; }
  };
  window.ChartManager = ChartManager;

  /* ---------- 6.5 Data pipeline facade ---------- */
  var DataPipeline = {
    normalize: function (data) {
      if (data !== undefined) AppStore.data = data;
      if (typeof window.normalizeData === 'function') window.normalizeData();
      if (typeof window.normalizeDataContract === 'function') window.normalizeDataContract();
      return AppStore.data;
    },
    validate: function (data) {
      var value = data || AppStore.data;
      return { valid: !!value && typeof value === 'object', data: value || {} };
    },
    prepare: function (data) {
      var normalized = this.normalize(data);
      return this.validate(normalized).data;
    }
  };
  window.DataPipeline = DataPipeline;

  /* ---------- 7. 模块级错误隔离 ---------- */
  function showModuleFallback(name) {
    try {
      var el = document.getElementById(name);
      if (!el) return;
      var holder = el.querySelector('[id$="List"],[id$="Content"],[id$="Chart"],.bento,.glass-card');
      if (holder && !holder.dataset.fb) {
        holder.dataset.fb = '1';
        holder.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;line-height:1.7;">该模块数据缺失<br><span style="font-size:11px;opacity:.75;">重新采集本行业后自动填充</span></div>';
      }
    } catch (e) {}
  }
  function safeRender(name, fn) {
    try { fn(); }
    catch (err) { AppErrorHandler.handle(err, 'render:' + name); showModuleFallback(name); }
  }
  window.safeRender = safeRender;
  window.showModuleFallback = showModuleFallback;

  /* ---------- 8. AppErrorHandler ---------- */
  var errorLog = [];
  var AppErrorHandler = {
    errorModules: {},
    handle: function (err, where) {
      var rec = {
        where: where || '',
        message: (err && err.message) ? err.message : String(err),
        time: new Date().toISOString()
      };
      errorLog.push(rec);
      if (errorLog.length > 60) errorLog.shift();
      if (where) this.errorModules[where] = rec;
      console.error('[AppError]' + (where ? '[' + where + ']' : ''), err);
    },
    recent: function () { return errorLog.slice(); }
  };
  window.AppErrorHandler = AppErrorHandler;

  window.addEventListener('error', function (e) {
    AppErrorHandler.handle((e && e.error) || (e && e.message) || 'error', 'window.error');
  });
  window.addEventListener('unhandledrejection', function (e) {
    AppErrorHandler.handle(e && e.reason, 'unhandledrejection');
    if (e && e.preventDefault) e.preventDefault();
  });

  /* ---------- 9. 统一行业切换 ----------
   * 跨行业当前为整页加载：跳转前作废本页异步批次并清理全部定时器，
   * 新页面由本核心重新初始化，确保旧行业 timer/异步不延续。 */
  function switchIndustryContext(industryId) {
    try { if (typeof window.closeEvidenceDrawer === 'function') window.closeEvidenceDrawer(); } catch (e) {}
    try { if (typeof window.abortCollectionTask === 'function') window.abortCollectionTask(); } catch (e) {}
    AppStore.nextRequest();      // 作废在途异步
    try { EffectsManager.destroyPage(); } catch (e) {}
    try { ChartManager.disposeAll(); } catch (e) {}
    try { EventManager.clear(); } catch (e) {}
    try { TimerManager.clearAll(); } catch (e) {}
    IndustryStore.setCurrent(industryId);
    AppStore.status.loading = true;
    var param = /^ind_[a-z0-9]+$/i.test(industryId) ? 'industry' : 'ind';
    window.location.href = window.location.pathname + '?' + param + '=' + encodeURIComponent(industryId);
  }
  window.switchIndustryContext = switchIndustryContext;

  var AppLifecycle = {
    prepare: function (data) {
      AppStore.status.loading = true;
      AppStore.status.error = null;
      return DataPipeline.prepare(data);
    },
    render: function () {
      if (typeof window.renderAll === 'function') window.renderAll();
      AppStore.status.loading = false;
      AppStore.status.ready = true;
    },
    destroy: function () {
      EffectsManager.destroyPage();
      ChartManager.disposeAll();
      EventManager.clear();
      TimerManager.clearAll();
      AppStore.status.ready = false;
    },
    metrics: function () {
      return { activeTimers: TimerManager.stats().total, activeCharts: ChartManager.count(),
        eventListeners: EventManager.count(), activeEffects: EffectsManager.count() };
    }
  };
  window.AppLifecycle = AppLifecycle;

  /* ---------- 10. 调试面板（?debug=1） ---------- */
  try {
    var dbg = new URLSearchParams(window.location.search).get('debug');
    if (dbg === '1' || dbg === 'true') {
      TimerManager.setTimeout(function () {
        var root = document.body || document.documentElement;
        if (!root) return;
        var box = document.createElement('div');
        box.id = '__debugPanel';
        box.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:99999;background:rgba(15,18,28,.92);color:#7dd3fc;font:11px/1.65 monospace;padding:10px 12px;border:1px solid #334155;border-radius:8px;max-width:280px;box-shadow:0 8px 30px rgba(0,0,0,.5)';
        function render() {
          var d = AppStore.data || {};
          var chartCount = document.querySelectorAll('[_echarts_instance_]').length;
          var lastErrs = errorLog.slice(-2).map(function (e) {
            return '<span style="color:#fca5a5">· ' + e.where + '</span>';
          }).join('<br>');
          box.innerHTML =
            '<b style="color:#e2e8f0">V8.2 Alpha Debug</b><br>' +
            'industry: ' + AppStore.industry.id + '<br>' +
            'schema: v' + AppStore.schemaVersion + '<br>' +
            'works: ' + (d.works ? d.works.length : 0) + '<br>' +
            'hotwords: ' + (d.hotwords ? d.hotwords.length : 0) + '<br>' +
            'render#: ' + AppStore.renderCount + '<br>' +
            'requestId: ' + AppStore.requestId + '<br>' +
            'charts: ' + chartCount + '<br>' +
            'managedCharts: ' + ChartManager.count() + '<br>' +
            'activeTimers: ' + TimerManager.stats().total + '<br>' +
            'eventListeners: ' + EventManager.count() + '<br>' +
            'activeEffects: ' + EffectsManager.count() + '<br>' +
            'evidence: ' + (AppStore.v82 ? AppStore.v82.evidenceStore.count() : 0) + '<br>' +
            'insights: ' + (AppStore.v82 ? AppStore.v82.insights.length : 0) + '<br>' +
            'unsupported: ' + (AppStore.v82 ? AppStore.v82.unsupportedInsights.length : 0) + '<br>' +
            'quality: ' + (AppStore.v82 ? [AppStore.v82.dataQuality.worksCount, AppStore.v82.dataQuality.commentsCount, AppStore.v82.dataQuality.keywordsCount, AppStore.v82.dataQuality.platformsCount].join('/') : '0/0/0/0') + '<br>' +
            'errors: ' + errorLog.length +
            (lastErrs ? '<br>' + lastErrs : '');
        }
        root.appendChild(box);
        render();
        TimerManager.setInterval(render, 1000, 'debug');
      }, 300);
    }
  } catch (e) {}

})();
