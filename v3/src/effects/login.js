/**
 * effects/login.js — 登录页+品牌Logo特效
 * 4色块毛玻璃 + 随机移动光晕 + 边缘闪耀 + 滚动模糊渐显工作台
 */
(function() {
  'use strict';

  const config = window.DOMAIN_CONFIG || {};
  const brand = config.brand || {};

  // 创建登录页HTML
  function createLoginScreen() {
    const login = document.createElement('div');
    login.id = 'loginScreen';
    login.className = 'login-screen';
    login.innerHTML = `
      <div class="login-bg"></div>
      <div class="login-content">
        <div class="login-logo" id="loginLogo">
          <!-- 4个毛玻璃色块（品牌Logo） -->
          <div class="logo-shape logo-shape-1" data-glow data-glow-size="small"></div>
          <div class="logo-shape logo-shape-2" data-glow data-glow-size="small"></div>
          <div class="logo-shape logo-shape-3" data-glow data-glow-size="small"></div>
          <div class="logo-shape logo-shape-4" data-glow data-glow-size="small"></div>
        </div>
        <div class="login-brand">
          <div class="login-brand-en">${brand.name_en || 'PYRALUMA'}</div>
          <div class="login-brand-cn">${brand.name_cn || '璃火矩创'}</div>
          <div class="login-brand-slogan">${brand.slogan || 'AI Intelligence'}</div>
        </div>
        <div class="login-hint">
          <span class="login-scroll-icon">↑</span>
          <span>上滑进入工作台</span>
        </div>
      </div>
      <div class="login-blur-overlay" id="loginBlurOverlay"></div>
    `;
    document.body.insertBefore(login, document.body.firstChild);
    return login;
  }

  // 随机移动光晕（Logo内部）
  function initLogoGlow() {
    const shapes = document.querySelectorAll('.logo-shape');
    shapes.forEach((shape, i) => {
      let x = 50, y = 50;
      let targetX = Math.random() * 100;
      let targetY = Math.random() * 100;
      let hue = Math.random() * 360;
      let breath = Math.random() * Math.PI * 2;

      function animate() {
        // 随机改变目标位置
        if (Math.random() < 0.01) {
          targetX = 20 + Math.random() * 60;
          targetY = 20 + Math.random() * 60;
        }
        x += (targetX - x) * 0.02;
        y += (targetY - y) * 0.02;
        hue = (hue + 0.3) % 360;
        breath += 0.02;
        const opacity = 0.3 + Math.sin(breath) * 0.15;

        shape.style.setProperty('--mx', x + '%');
        shape.style.setProperty('--my', y + '%');
        shape.style.setProperty('--glow-hue', hue);
        shape.style.setProperty('--glow-opacity', opacity);
        shape.style.setProperty('opacity', '1');

        requestAnimationFrame(animate);
      }
      animate();

      // 鼠标跟随
      shape.addEventListener('mousemove', (e) => {
        const rect = shape.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / rect.width) * 100;
        targetY = ((e.clientY - rect.top) / rect.height) * 100;
      });
    });
  }

  // 边缘闪耀光点
  function initEdgeSparkle() {
    const shapes = document.querySelectorAll('.logo-shape');
    shapes.forEach(shape => {
      // 偶尔在边缘产生一个闪耀点
      setInterval(() => {
        if (Math.random() > 0.3) return;
        const sparkle = document.createElement('div');
        sparkle.className = 'edge-sparkle';
        const side = Math.floor(Math.random() * 4);
        const pos = Math.random() * 100;
        if (side === 0) { sparkle.style.left = pos + '%'; sparkle.style.top = '0'; }
        else if (side === 1) { sparkle.style.right = '0'; sparkle.style.top = pos + '%'; }
        else if (side === 2) { sparkle.style.left = pos + '%'; sparkle.style.bottom = '0'; }
        else { sparkle.style.left = '0'; sparkle.style.top = pos + '%'; }
        shape.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 800);
      }, 2000 + Math.random() * 3000);
    });
  }

  // 滚动模糊渐显
  function initScrollReveal() {
    const login = document.getElementById('loginScreen');
    const overlay = document.getElementById('loginBlurOverlay');
    if (!login) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      if (scrollY > 10 && scrollY > lastScroll) {
        // 上滑：模糊登录页，显示工作台
        const progress = Math.min(scrollY / (vh * 0.3), 1);
        login.style.filter = `blur(${progress * 20}px)`;
        login.style.opacity = 1 - progress;
        login.style.transform = `scale(${1 - progress * 0.05})`;
        overlay.style.opacity = progress * 0.5;

        if (progress >= 1) {
          login.style.display = 'none';
        }
      } else if (scrollY < 10) {
        // 回到顶部：恢复登录页
        login.style.display = '';
        login.style.filter = '';
        login.style.opacity = '';
        login.style.transform = '';
        overlay.style.opacity = '';
      }
      lastScroll = scrollY;
    });
  }

  // 初始化
  function init() {
    createLoginScreen();
    setTimeout(() => {
      initLogoGlow();
      initEdgeSparkle();
      initScrollReveal();
    }, 100);
  }

  window.initLoginLogo = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
