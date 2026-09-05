/**
 * effects/glow.js — UFO动态光晕特效
 * 自动扫描所有带[data-glow]属性的元素，绑定鼠标跟随光晕
 * 特性：色相循环14s + 椭圆轨道漂移 + 呼吸脉动 + 鼠标跟随
 * 零业务依赖，可独立使用
 */
(function() {
  'use strict';

  const GLOW_SELECTOR = '[data-glow]';
  let animationId = null;
  const activeCards = new Set();

  /** 初始化所有光晕卡片 */
  function initCardGlow() {
    // 清理旧的监听器（通过标记避免重复绑定）
    document.querySelectorAll(GLOW_SELECTOR).forEach(card => {
      if (card._glowBound) return;
      card._glowBound = true;
      bindGlow(card);
    });

    // 启动全局动画循环
    if (!animationId) {
      animationId = requestAnimationFrame(animate);
    }
  }

  /** 绑定单个卡片的光晕 */
  function bindGlow(card) {
    let targetX = 50, targetY = 50;
    let currentX = 50, currentY = 50;
    let isHovering = false;
    let hue = Math.random() * 360;
    let orbitAngle = Math.random() * Math.PI * 2;
    let breathPhase = Math.random() * Math.PI * 2;

    card._glowState = { targetX, targetY, currentX, currentY, isHovering, hue, orbitAngle, breathPhase };

    card.addEventListener('mouseenter', () => {
      isHovering = true;
      card._glowState.isHovering = true;
      activeCards.add(card);
    });

    card.addEventListener('mouseleave', () => {
      isHovering = false;
      card._glowState.isHovering = false;
      // 光晕回到中心
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

  // DOM就绪后自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initCardGlow, 300));
  } else {
    setTimeout(initCardGlow, 300);
  }

  // 监听DOM变化，自动给新元素绑定光晕
  const observer = new MutationObserver((mutations) => {
    let needsRefresh = false;
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.matches && node.matches(GLOW_SELECTOR)) {
          needsRefresh = true;
        }
        if (node.nodeType === 1 && node.querySelector && node.querySelector(GLOW_SELECTOR)) {
          needsRefresh = true;
        }
      });
    });
    if (needsRefresh) setTimeout(initCardGlow, 100);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
