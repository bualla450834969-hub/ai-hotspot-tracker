/**
 * components/cards/auto-migrate.js
 * 自动迁移所有旧模块到新架构
 * 用 ErrorHandler 包裹每个模块的渲染函数
 */
(function() {
  'use strict';

  // 旧模块列表
  const oldModules = [
    'hero.js',
    'hotwords.js',
    'works.js',
    'breakdown.js',
    'topics.js',
    'topicPerf.js',
    'publishTime.js',
    'titleFormulas.js',
    'leadScripts.js',
    'launchOps.js',
    'audience.js',
    'viralGenes.js',
    'techradar.js',
    'engagement.js',
    'comparison.js',
    'kanban.js',
    'favorites.js',
    'scriptGen.js',
    'opsStatus.js',
    'credit.js',
    'advancedAnalytics.js',
    'sidebar.js'
  ];

  // 包裹模块渲染函数
  function wrapModule(moduleId) {
    const mod = window.Module && window.Module.get(moduleId);
    if (!mod || !mod.render) return;

    const originalRender = mod.render;
    mod.render = function(data) {
      window.ErrorHandler.safeExecute(() => {
        originalRender(data);
      }, moduleId);
    };
  }

  // 初始化
  function init() {
    // 等所有模块都加载完
    setTimeout(() => {
      if (!window.Module) return;
      
      // 包裹所有模块
      const allMods = window.Module.all();
      allMods.forEach(mod => {
        wrapModule(mod.id);
      });
      
      console.log('[AutoMigrate] 已包裹', allMods.length, '个模块');
    }, 1000);
  }

  // 等框架初始化完再执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
