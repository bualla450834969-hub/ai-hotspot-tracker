/**
 * effects/glow.js — UFO动态光晕特效
 * 自动扫描所有卡片元素，绑定鼠标跟随光晕
 * 特性：色相循环 + 椭圆轨道漂移 + 呼吸脉动 + 鼠标跟随
 * 零业务依赖，可独立使用
 */
(function() {
  'use strict';

  // 所有需要光晕的卡片选择器（与modules.css中的::before样式对应）
  const CARD_SELECTORS = [
    '.hero-stat', '.bento-card', '.breakdown-card', '.topic-card',
    '.insight-item', '.action-item', '.matrix-cell', '.small-item',
    '.formula-item', '.author-item', '.gene-card', '.persona-card',
    '.tech-card', '.tech-summary-card', '.kanban-card', '.schedule-item',
    '.checklist-item', '.compare-card', '.sat-item', '.tracker-bar',
    '.stat-card', '.glass-card', '.work-card', '.hotword-row',
    '[data-glow]'
  ].join(',');

  let animationId = null;
  const activeCards = new Set();

  /** 初始化所有光晕卡片 */
  function initCardGlow() {
    document.querySelectorAll(CARD_SELECTORS).forEach(card => {
      if (card._glowBound) return;
      // 跳过太小的元素和表格行
      if (card.offsetWidth < 30 || card.offsetHeight < 20) return;
      card._glowBound = true;
      card.setAttribute('data-glow', '');
      bindGlow(card);
    });

    if (!animationId) {
      animationId = requestAnimationFrame(animate);
    }
  }

  /** 绑定单个卡片的光晕 */
  function bindGlow(card) {
    card._glowState = {
      targetX: 50, targetY: 50,
      currentX: 50, currentY: 50,
      isHovering: false,
      hue: Math.random() * 360,
      orbitAngle: Math.random() * Math.PI * 2,
      breathPhase: Math.random() * Math.PI * 2
    };

    card.addEventListener('mouseenter', () => {
      card._glowState.isHovering = true;
      activeCards.add(card);
    });

    card.addEventListener('mouseleave', () => {
      card._glowState.isHovering = false;
      card._glowState.targetX = 50;
      card._glowState.targetY = 50;
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card._glowState.targetX = Math.max(0, Math.min(100, x));
      card._glowState.targetY = Math.max(0, Math.min(100, y));
    });
  }

  /** 全局动画循环 — 所有卡片共享一个rAF */
  let lastTime = 0;
  function animate(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    activeCards.forEach(card => {
      const s = card._glowState;
      if (!s) return;

      // 平滑跟随鼠标
      s.currentX += (s.targetX - s.currentX) * 0.12;
      s.currentY += (s.targetY - s.currentY) * 0.12;

      // 椭圆轨道漂移（UFO感）
      s.orbitAngle += dt * 0.5;
      const orbitX = Math.cos(s.orbitAngle) * 3;
      const orbitY = Math.sin(s.orbitAngle * 1.3) * 2;

      // 色相循环
      s.hue = (s.hue + dt * 25) % 360;

      // 呼吸脉动
      s.breathPhase += dt * 1.5;
      const breath = 0.85 + Math.sin(s.breathPhase) * 0.15;

      const finalX = s.currentX + orbitX;
      const finalY = s.currentY + orbitY;

      card.style.setProperty('--mx', finalX.toFixed(2) + '%');
      card.style.setProperty('--my', finalY.toFixed(2) + '%');
      card.style.setProperty('--glow-hue', s.hue.toFixed(0));
      card.style.setProperty('--glow-opacity', breath.toFixed(2));

      // 鼠标离开后，光晕回到中心并淡出
      if (!s.isHovering && Math.abs(s.currentX - 50) < 0.5 && Math.abs(s.currentY - 50) < 0.5) {
        activeCards.delete(card);
      }
    });

    animationId = requestAnimationFrame(animate);
  }

  /** 重新扫描（动态添加卡片后调用） */
  function refreshGlow() {
    initCardGlow();
  }

  // 导出
  window.initCardGlow = initCardGlow;
  window.refreshGlow = refreshGlow;

  // DOM就绪后自动初始化（延迟等模块渲染完成）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initCardGlow, 800));
  } else {
    setTimeout(initCardGlow, 800);
  }

  // 监听DOM变化，自动给新元素绑定光晕
  const observer = new MutationObserver((mutations) => {
    let needsRefresh = false;
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches && node.matches(CARD_SELECTORS)) needsRefresh = true;
          if (node.querySelector && node.querySelector(CARD_SELECTORS)) needsRefresh = true;
        }
      });
    });
    if (needsRefresh) setTimeout(initCardGlow, 200);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
