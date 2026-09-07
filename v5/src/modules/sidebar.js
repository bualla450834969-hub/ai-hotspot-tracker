/**
 * modules/sidebar.js
 * 左侧导航栏模块 - 动态创建sidebar，按分组切换显示section
 * 不修改现有HTML结构，只控制显示/隐藏
 */
(function() {
  'use strict';

  // 导航分组配置（每个分组包含的section/元素ID）
  const NAV_GROUPS = [
    {
      id: 'overview',
      icon: '一',
      label: '概览',
      sections: ['hero', 'actionList', 'heroStats'],
      title: '数据概览'
    },
    {
      id: 'hotspots',
      icon: '二',
      label: '热点追踪',
      sections: ['works', 'hotwords', 'history', 'hotwordTable', 'worksTable', 'chartRanking', 'chartCategory', 'chartPublishTime', 'chartDuration', 'chartHook', 'insightsGrid'],
      title: '热点追踪'
    },
    {
      id: 'breakdown',
      icon: '三',
      label: '爆款拆解',
      sections: ['breakdown', 'breakdownGrid', 'saturationList', 'commentDemands', 'commentKw', 'chartScatter', 'chartCollect', 'matrixGrid'],
      title: '爆款拆解'
    },
    {
      id: 'content',
      icon: '四',
      label: '内容创作',
      sections: ['titleGen', 'titleFormulas', 'formulaGrid', 'leadScripts', 'scriptContainer', 'publishTime', 'ptChart', 'ptBestCards', 'ptPlatform', 'ptTips'],
      title: '内容创作'
    },
    {
      id: 'topics',
      icon: '五',
      label: '选题管理',
      sections: ['topics', 'topicsGrid', 'topicTracker', 'kanbanBoard', 'topicPerf', 'topicPerfContent'],
      title: '选题管理'
    },
    {
      id: 'launch',
      icon: '六',
      label: '起号运营',
      sections: ['launchOps', 'launchBanner', 'healthScore', 'healthBar', 'coreKwCloud', 'ratioBar', 'ratioLegend', 'launchTasks', 'pitfallList'],
      title: '起号运营'
    },
    {
      id: 'audience',
      icon: '七',
      label: '人群洞察',
      sections: ['audience', 'audienceChart', 'personaGrid', 'avgCommentRate', 'avgCollectRate', 'highCommentList'],
      title: '人群洞察'
    },
    {
      id: 'techradar',
      icon: '八',
      label: '技术雷达',
      sections: ['techradar', 'techSummary', 'techGrid', 'viralGenes', 'viralGenesContent'],
      title: '技术雷达'
    },
    {
      id: 'benchmark',
      icon: '九',
      label: '对标与发布',
      sections: ['compareSection', 'compareSummary', 'overlapTable', 'dyOnlyList', 'xhsOnlyList', 'authorList', 'competitorWorks', 'smallViral', 'formatBars', 'schedule', 'scheduleContent', 'commentScripts', 'commentScriptsContent', 'checklist', 'checklistContent', 'checklistProgress', 'favoritesGrid'],
      title: '对标与发布'
    }
  ];

  let currentPage = 'overview';
  let sidebarEl = null;
  let mainContentEl = null;

  // 创建sidebar
  function createSidebar() {
    if (document.getElementById('appSidebar')) return;

    const sidebar = document.createElement('aside');
    sidebar.id = 'appSidebar';
    sidebar.className = 'app-sidebar';

    // 品牌区
    const brand = document.createElement('div');
    brand.className = 'sidebar-brand';
    brand.innerHTML = `
      <div class="brand-carousel" id="brandCarousel">
        <div class="brand-slide brand-slide-logo active" id="brandSlideLogo">
          <div class="sidebar-logo" id="sbLogoContainer"></div>
        </div>
        <div class="brand-slide brand-slide-text" id="brandSlideText">
          <div class="sidebar-brand-text">
            <div class="sb-brand-name">PYRALUMA</div>
            <div class="sb-brand-tag">热点追踪工作台</div>
          </div>
        </div>
      </div>
    `;
    sidebar.appendChild(brand);

    // 导航列表
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';

    NAV_GROUPS.forEach(function(group) {
      if (group.id === 'techradar' && cfg('id') !== 'ai') return;
      const item = document.createElement('div');
      item.className = 'sidebar-nav-item' + (group.id === currentPage ? ' active' : '');
      item.dataset.page = group.id;
      item.innerHTML = `<span class="sb-icon">${group.icon}</span><span class="sb-label">${group.label}</span>`;
      item.addEventListener('click', function() {
        switchPage(group.id);
      });
      nav.appendChild(item);
    });

    sidebar.appendChild(nav);

    // 底部信息
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = `
      <div class="sb-update-time" id="sbUpdateTime">数据加载中...</div>
      <div class="sb-version">v4.0 · Sidebar Layout</div>
    `;
    sidebar.appendChild(footer);

    document.body.appendChild(sidebar);

    // 品牌轮播：logo与文字交替显示
    var carousel = document.getElementById('brandCarousel');
    var slideLogo = document.getElementById('brandSlideLogo');
    var slideText = document.getElementById('brandSlideText');
    if (carousel && slideLogo && slideText) {
      var currentSlide = 0;
      var slides = [slideLogo, slideText];
      setInterval(function() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
      }, 4000);
    }

    // 初始化侧边栏Logo（复用登录页Logo特效）
    var logoContainer = document.getElementById('sbLogoContainer');
    if (logoContainer && typeof createLogoSVG === 'function') {
      logoContainer.innerHTML = createLogoSVG('sb', 36, 36, 1.5);
      var sbLogoSvg = logoContainer.querySelector('svg');
      if (sbLogoSvg && typeof initLogoEffect === 'function') {
        initLogoEffect(sbLogoSvg, 'sb');
      }
    }
    sidebarEl = sidebar;

    // 给body加class
    document.body.classList.add('has-sidebar');

    // 隐藏登录页（只首次显示，进入工作台后永久隐藏）
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
    }

    // 立即重置滚动位置到顶部（登录页隐藏后内容从顶部开始）
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 禁用登录页的滚动渐显效果（强制内容完全清晰显示）
    document.body.setAttribute('data-reveal', '1');
    document.querySelectorAll('.hero, section').forEach(function(el) {
      el.style.filter = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });

    // 同步更新时间到侧边栏底部
    const updateTime = document.getElementById('updateTime');
    const sbUpdateTime = document.getElementById('sbUpdateTime');
    if (updateTime && sbUpdateTime) {
      sbUpdateTime.textContent = updateTime.textContent;
    }
  }

  // 切换页面
  function switchPage(pageId) {
    const group = NAV_GROUPS.find(function(g) { return g.id === pageId; });
    if (!group) return;

    currentPage = pageId;

    // 确保登录页已隐藏（进入工作台后不再显示）
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen && loginScreen.style.display !== 'none') {
      loginScreen.style.display = 'none';
    }

    // 更新导航激活状态
    document.querySelectorAll('.sidebar-nav-item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    // 只隐藏顶层section和hero（body的直接子元素）
    const topSections = document.querySelectorAll('body > .section, body > .hero');
    topSections.forEach(function(el) {
      el.style.display = 'none';
    });

    // 显示当前分组相关的顶层section
    group.sections.forEach(function(id) {
      const el = document.getElementById(id);
      if (el) {
        // 找到最近的顶层section祖先并显示
        let target = el;
        while (target && target.parentElement !== document.body) {
          target = target.parentElement;
        }
        if (target && (target.classList.contains('section') || target.classList.contains('hero'))) {
          target.style.display = '';
        }
        // 也显示元素本身
        el.style.display = '';
      }
    });

    // 概览页特殊处理：显示hero所有子元素
    if (pageId === 'overview') {
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.display = '';
        hero.querySelectorAll('*').forEach(function(el) {
          el.style.display = '';
        });
      }
    }

    // 更新页面标题
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = group.title + ' - 热点追踪工作台';

    // 延迟resize图表
    setTimeout(function() {
      if (window.charts) {
        Object.values(window.charts).forEach(function(chart) {
          if (chart && chart.resize) chart.resize();
        });
      }
      if (window.initGlow) window.initGlow();
    }, 150);

    window.scrollTo(0, 0);

    // 强制anim元素完成动画（避免隐藏/显示后停留在初始状态）
    setTimeout(function() {
      document.querySelectorAll('.anim').forEach(function(el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 50);
  }

  // 检查是否已滚过登录页
  function isPastLogin() {
    return window.scrollY > window.innerHeight * 0.4;
  }

  // 初始化
  function initSidebar() {
    if (isPastLogin()) {
      // 已滚过登录页，直接创建
      createSidebar();
      setTimeout(function() { switchPage('overview'); }, 200);
    } else {
      // 等待滚动过登录页
      let created = false;
      function onScroll() {
        if (!created && isPastLogin()) {
          created = true;
          createSidebar();
          setTimeout(function() { switchPage('overview'); }, 200);
          window.removeEventListener('scroll', onScroll);
        }
      }
      window.addEventListener('scroll', onScroll, {passive: true});
    }
  }

  // 暴露到window
  window.initSidebar = initSidebar;
  window.switchPage = switchPage;
  window.NAV_GROUPS = NAV_GROUPS;

  // DOM加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
})();
