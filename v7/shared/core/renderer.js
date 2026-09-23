/**
 * 通用渲染器 — 表格、卡片、图表、数字动画、标签
 * 所有业务模块共用，不包含领域逻辑
 */
(function() {
  'use strict';

  const Renderer = {
    /** 数字动画 */
    animateNumber(el, target, duration = 800) {
      if (!el) return;
      const start = 0;
      const startTime = performance.now();
      function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    },

    /** 格式化大数字 */
    formatNum(n) {
      if (n >= 10000) return (n / 10000).toFixed(1) + '万';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
      return n?.toLocaleString() || '0';
    },

    /** 趋势标签 */
    trendClass(trend) {
      if (!trend) return '';
      if (trend > 0) return 'trend-up';
      if (trend < 0) return 'trend-down';
      return 'trend-flat';
    },

    /** 生成标签chip */
    chip(text, color = 'default') {
      const colors = {
        default: 'rgba(255,255,255,0.08)',
        primary: 'rgba(139,92,246,0.15)',
        success: 'rgba(48,209,88,0.15)',
        warning: 'rgba(251,191,36,0.15)',
        danger: 'rgba(248,113,113,0.15)',
        info: 'rgba(96,165,250,0.15)',
      };
      const textColors = {
        default: '#94a3b8', primary: '#a78bfa', success: '#30D158',
        warning: '#fbbf24', danger: '#f87171', info: '#60a5fa',
      };
      return `<span class="kw-chip" style="background:${colors[color]};color:${textColors[color]}">${text}</span>`;
    },

    /** 通用卡片容器 */
    card(content, extraClass = '') {
      return `<div class="glass-card ${extraClass}" data-glow>${content}</div>`;
    },

    /** 进度条 */
    progressBar(percent, color = '#8b5cf6', height = 6) {
      return `<div class="progress-bar" style="height:${height}px;background:rgba(255,255,255,0.08);border-radius:${height/2}px;overflow:hidden;">
        <div style="width:${percent}%;height:100%;background:${color};border-radius:${height/2}px;transition:width 0.5s;"></div>
      </div>`;
    },

    /** 空状态 */
    emptyState(message = '暂无数据') {
      return `<div style="text-align:center;padding:40px 20px;color:var(--text-tertiary);font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;opacity:0.3;">📭</div>${message}
      </div>`;
    },

    /** 复制到剪贴板 */
    copyToClipboard(text, btnEl) {
      navigator.clipboard.writeText(text).then(() => {
        if (btnEl) {
          const orig = btnEl.textContent;
          btnEl.textContent = '✓ 已复制';
          setTimeout(() => btnEl.textContent = orig, 1500);
        }
      });
    },

    /** 表格排序 */
    sortTable(tableEl, colIndex, asc = true) {
      const tbody = tableEl.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aVal = parseFloat(a.cells[colIndex]?.textContent?.replace(/[^0-9.]/g, '')) || 0;
        const bVal = parseFloat(b.cells[colIndex]?.textContent?.replace(/[^0-9.]/g, '')) || 0;
        return asc ? aVal - bVal : bVal - aVal;
      });
      rows.forEach(r => tbody.appendChild(r));
    },

    /** 折叠section */
    toggleSection(id) {
      const el = document.getElementById(id);
      if (!el) return;
      const content = el.querySelector('.section-content') || el;
      const btn = el.querySelector('.section-collapse-btn');
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? '' : 'none';
      if (btn) btn.textContent = isHidden ? '收起' : '展开';
    },

    /** 初始化折叠功能 */
    initCollapse() {
      document.querySelectorAll('.section-collapse-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const section = btn.closest('.section');
          if (section) this.toggleSection(section.id);
        });
      });
    },
  };

  window.Renderer = Renderer;
  window.animateNumber = Renderer.animateNumber;
  window.toggleSection = Renderer.toggleSection;
})();
