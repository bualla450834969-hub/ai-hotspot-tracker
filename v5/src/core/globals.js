/**
 * core/globals.js — 全局共享变量与常量
 * 所有模块共用的全局状态、ECharts配置、辅助函数
 * 必须在模块之前加载
 */
(function() {
  'use strict';

  // ===== ECharts 实例容器 =====
  window.charts = {};

  // ===== ECharts 配色与样式常量 =====
  window.PALETTE = ['#8b0000', '#2c5f7c', '#b8860b', '#3d6b4f', '#6b4423', '#a0522d', '#4a4a4a', '#8b4513', '#556b2f', '#704214'];
  window.TOOLTIP_BG = 'rgba(255, 252, 245, 0.96)';
  window.TOOLTIP_BORDER = 'rgba(139, 90, 43, 0.3)';
  window.TOOLTIP_TEXT = '#2c2416';
  window.AXIS_COLOR = 'rgba(60, 45, 30, 0.65)';
  window.AXIS_LINE = 'rgba(139,90,43,0.2)';
  window.SPLIT_COLOR = 'rgba(139,90,43,0.08)';

  // ===== 筛选状态 =====
  window.currentCategory = 'all';
  window.currentPlatform = 'all';
  window.sortDir = {};

  // ===== 辅助函数（暴露到全局） =====
  window.trendClass = function(t) {
    if (t === '飙升') return 'surging';
    if (t === '新热') return 'new-hot';
    if (t === '衰退') return 'declining';
    return 'stable';
  };

  window.classifyHook = function(title) {
    if (/翻车|踩坑|避坑|别再|不要|后悔/.test(title)) return '痛点';
    if (/对比|vs|VS|区别|哪个好|pk/i.test(title)) return '对比';
    if (/揭秘|竟然|居然|没想到|真相|内幕/.test(title)) return '悬念';
    if (/太美了|绝了|惊艳|震撼|效果|大片/.test(title)) return '效果';
    if (/哭了|感动|暖心|治愈|陪伴/.test(title)) return '情感';
    return '数字';
  };

  window.animateNumber = function(el, target, duration) {
    duration = duration || 1200;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  // ===== renderAll — 重新渲染所有已注册模块 =====
  window.renderAll = function() {
    if (window.Module && window.Module.all) {
      var data = window.DASHBOARD_DATA || window.DATA || {};
      window.Module.all().forEach(function(m) {
        if (m.render) {
          try {
            var renderData = data;
            if (m.requiredFields && m.requiredFields.length === 1) {
              renderData = data[m.requiredFields[0]] || data;
            }
            m.render(renderData);
          } catch (e) {
            console.error('[renderAll:' + m.id + ']', e);
          }
        }
      });
    }
  };

  // ===== applyFilter — 分类筛选 =====
  window.applyFilter = function() {
    var sel = document.getElementById('categoryFilter');
    if (sel) window.currentCategory = sel.value;
    window.renderAll();
  };

  // ===== setPlatform — 平台切换 =====
  window.setPlatform = function(p) {
    window.currentPlatform = p;
    document.querySelectorAll('.platform-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.platform === p);
    });
    window.renderAll();
  };

  // ===== filterByPlatform =====
  window.filterByPlatform = function(arr) {
    if (!arr) return [];
    if (window.currentPlatform === 'all' || window.currentPlatform === 'compare') return arr;
    return arr.filter(function(item) { return item.platform === window.currentPlatform; });
  };

  // ===== domainGuard 兜底（domain.js加载后会覆盖） =====
  window.domainGuard = window.domainGuard || function(moduleId, renderFn) { return renderFn; };

})();
