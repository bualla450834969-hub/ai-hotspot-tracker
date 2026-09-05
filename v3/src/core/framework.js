/**
 * 核心框架 — 模块注册、初始化、导航、筛选
 * 所有业务模块通过 Module.register() 注册，框架自动管理生命周期
 */
(function() {
  'use strict';

  // ===== 模块注册表 =====
  const modules = {};
  const moduleOrder = [];

  const Module = {
    /**
     * 注册一个业务模块
     * @param {Object} mod - 模块定义
     * @param {string} mod.id - 模块唯一ID（对应section的id）
     * @param {string[]} mod.requiredFields - 依赖的DATA字段，缺数据自动隐藏
     * @param {Function} mod.render - 渲染函数(data)
     * @param {Function} [mod.init] - 初始化函数（只执行一次）
     * @param {Function} [mod.destroy] - 销毁函数
     */
    register(mod) {
      if (!mod.id || !mod.render) {
        console.warn('[Module] 注册失败，缺少id或render:', mod);
        return;
      }
      modules[mod.id] = mod;
      moduleOrder.push(mod.id);
      if (mod.init) mod.init();
    },

    get(id) { return modules[id]; },
    all() { return moduleOrder.map(id => modules[id]); },

    /** 检查模块所需数据是否存在 */
    hasData(mod) {
      if (!mod.requiredFields) return true;
      const DATA = window.DASHBOARD_DATA || {};
      return mod.requiredFields.every(f => {
        const val = DATA[f];
        return val !== undefined && val !== null &&
               !(Array.isArray(val) && val.length === 0);
      });
    },
  };

  // ===== 安全数据访问 =====
  const Safe = {
    /** 安全获取嵌套字段，不存在返回默认值 */
    get(obj, path, def) {
      if (!obj) return def;
      const keys = path.split('.');
      let cur = obj;
      for (const k of keys) {
        if (cur == null || cur[k] === undefined) return def;
        cur = cur[k];
      }
      return cur === undefined ? def : cur;
    },
    arr(val) { return Array.isArray(val) ? val : []; },
    num(val, def) { return typeof val === 'number' ? val : (def || 0); },
    str(val, def) { return typeof val === 'string' ? val : (def || ''); },
  };

  // ===== 渲染调度 =====
  function renderAll() {
    const DATA = window.DASHBOARD_DATA || {};
    const config = window.DOMAIN_CONFIG || {};
    const mods = config.modules || {};

    moduleOrder.forEach(id => {
      const mod = modules[id];
      if (!mod) return;

      // 模块开关检查
      if (mods[id] === false) {
        hideSection(id);
        return;
      }

      // 数据依赖检查
      if (!Module.hasData(mod)) {
        hideSection(id);
        return;
      }

      // 渲染
      try {
        showSection(id);
        mod.render(DATA);
      } catch (e) {
        console.error(`[Module] ${id} 渲染失败:`, e);
        // 单个模块崩溃不影响其他模块
      }
    });

    // 更新导航
    updateNav();
  }

  function hideSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
  function showSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  }

  function updateNav() {
    const config = window.DOMAIN_CONFIG || {};
    const order = config.nav_order || [];
    const mods = config.modules || {};
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    nav.innerHTML = order.filter(id => {
      if (mods[id] === false) return false;
      const mod = modules[id];
      return mod ? Module.hasData(mod) : true;
    }).map(id => {
      const label = getSectionLabel(id);
      return `<a class="nav-link" data-target="${id}">${label}</a>`;
    }).join('');

    // 绑定导航点击
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const target = document.getElementById(link.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function getSectionLabel(id) {
    const labels = {
      hero: '工作台', techradar: '技术雷达', hotwords: '热点',
      breakdown: '爆款', topics: '选题', topicPerf: '效果',
      publishTime: '发布时间', titleFormulas: '标题公式',
      leadScripts: '引流话术', launchOps: '起号运营', audience: '受众',
      works: '作品', viralGenes: '爆款基因', insights: '洞察',
      schedule: '排期', commentScripts: '评论话术', checklist: '清单',
    };
    return labels[id] || id;
  }

  // ===== 平台筛选 =====
  let currentPlatform = 'all';
  function setPlatform(p) {
    currentPlatform = p;
    document.querySelectorAll('.platform-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.platform === p);
    });
    renderAll();
  }
  function filterByPlatform(arr) {
    if (!arr) return [];
    if (currentPlatform === 'all' || currentPlatform === 'compare') return arr;
    return arr.filter(item => item.platform === currentPlatform);
  }

  // ===== 分类筛选 =====
  let currentCategory = '';
  function applyFilter() {
    const sel = document.getElementById('categoryFilter');
    currentCategory = sel ? sel.value : '';
    renderAll();
  }

  // ===== 初始化 =====
  function init() {
    const DATA = window.DASHBOARD_DATA || {};
    const config = window.DOMAIN_CONFIG || {};

    // 更新时间
    const updateEl = document.getElementById('updateTime');
    if (updateEl) {
      updateEl.textContent = Safe.str(DATA.last_update, '暂无数据');
      // 数据新鲜度
      if (DATA.last_update) {
        const hours = (new Date() - new Date(DATA.last_update.replace(/-/g, '/'))) / 3600000;
        if (hours > 24) {
          updateEl.style.color = config.theme?.danger || '#f87171';
          updateEl.innerHTML = DATA.last_update + ' <span style="color:#f87171;font-size:11px;">⚠️ ' + (config.copy?.data_fresh_warning || '数据超过24小时未更新') + '</span>';
        }
      }
    }

    // 分类筛选器
    const cats = [...new Set(Safe.arr(DATA.hotwords).map(h => h.category).filter(Boolean))];
    const sel = document.getElementById('categoryFilter');
    if (sel) {
      sel.innerHTML = '<option value="">全部分类</option>' +
        cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // 页面标题
    document.title = config.display_name || '热点追踪工作台';

    // 渲染所有模块
    renderAll();

    // 滚动动画
    initScrollReveal();

    // 导航隐藏
    initNavHide();

    // 延迟初始化
    setTimeout(() => { if (typeof initSectionCollapse === 'function') initSectionCollapse(); }, 1500);
    setTimeout(() => { if (typeof checkDataFreshness === 'function') checkDataFreshness(); }, 2000);
    setTimeout(() => { if (typeof initCardGlow === 'function') initCardGlow(); }, 500);
  }

  // ===== 滚动显现动画 =====
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.section, .glass-card, .hero-stat').forEach(el => {
      el.classList.add('anim-item');
      observer.observe(el);
    });
  }

  // ===== 导航栏滚动隐藏 =====
  function initNavHide() {
    let lastScroll = 0;
    const nav = document.querySelector('.top-nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      const cur = window.scrollY;
      nav.style.transform = cur > lastScroll && cur > 100 ? 'translateY(-100%)' : 'translateY(0)';
      lastScroll = cur;
    });
  }

  // ===== 全局搜索 =====
  function doGlobalSearch(query) {
    if (!query) { renderAll(); return; }
    const q = query.toLowerCase();
    const DATA = window.DASHBOARD_DATA || {};
    // 筛选选题
    const topics = Safe.arr(DATA.topics).filter(t =>
      Safe.str(t.title).toLowerCase().includes(q) ||
      Safe.str(t.hook).toLowerCase().includes(q) ||
      Safe.str(t.keyword).toLowerCase().includes(q)
    );
    // 筛选热词
    const hotwords = Safe.arr(DATA.hotwords).filter(h =>
      Safe.str(h.keyword).toLowerCase().includes(q)
    );
    // 只渲染筛选结果（简化版）
    console.log('[Search] 选题:', topics.length, '热词:', hotwords.length);
    return { topics, hotwords };
  }

  // ===== 导出到全局（不自动init，由页面末尾在所有模块加载后调用initFramework()）=====
  window.Module = Module;
  window.Safe = Safe;
  window.renderAll = renderAll;
  window.setPlatform = setPlatform;
  window.filterByPlatform = filterByPlatform;
  window.applyFilter = applyFilter;
  window.doGlobalSearch = doGlobalSearch;
  window.initFramework = init;
  // 兼容原模板的全局DATA引用（所有模块IIFE内引用的DATA）
  // 必须用赋值而非const，避免遮蔽已存在的全局DATA
  try { window.DATA = window.DASHBOARD_DATA || {}; } catch(e) {}
  // 同时尝试赋值给全局词法环境的DATA（如果是var声明的全局变量）
  if (typeof DATA !== 'undefined') {
    try { DATA = window.DASHBOARD_DATA || {}; } catch(e) {}
  }
  window.currentPlatform = 'all';
})();
