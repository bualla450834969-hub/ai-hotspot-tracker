/**
 * core/error.js — 错误处理模块
 * 单个模块出错不影响其他模块，出错时显示友好的错误提示
 */
(function() {
  'use strict';

  // ===== 错误处理器 =====
  const ErrorHandler = {
    /**
     * 安全执行函数，捕获错误
     * @param {Function} fn - 要执行的函数
     * @param {string} moduleName - 模块名称
     * @param {any} defaultValue - 出错时的默认返回值
     * @returns {any} 执行结果或默认值
     */
    safeExecute(fn, moduleName, defaultValue) {
      try {
        return fn();
      } catch (error) {
        console.error(`[ErrorHandler] 模块 ${moduleName} 出错:`, error);
        console.error(`[ErrorHandler] 错误堆栈:`, error.stack);
        return defaultValue;
      }
    },

    /**
     * 安全渲染，捕获渲染错误
     * @param {Function} renderFn - 渲染函数
     * @param {string} moduleName - 模块名称
     * @param {HTMLElement} container - 渲染容器
     */
    safeRender(renderFn, moduleName, container) {
      try {
        renderFn();
      } catch (error) {
        console.error(`[ErrorHandler] 渲染模块 ${moduleName} 出错:`, error);
        console.error(`[ErrorHandler] 错误堆栈:`, error.stack);
        
        // 显示友好的错误提示
        if (container) {
          container.innerHTML = `
            <div style="padding:20px;text-align:center;color:#ff6b6b;font-size:13px;">
              <div style="font-size:24px;margin-bottom:8px;">⚠️</div>
              <div>模块加载失败</div>
              <div style="font-size:11px;color:#888;margin-top:4px;">${moduleName}</div>
            </div>
          `;
        }
      }
    },

    /**
     * 全局错误监听
     */
    init() {
      // 捕获未处理的 JavaScript 错误
      window.addEventListener('error', function(event) {
        console.warn('[GlobalError]', event.message, event.filename + ':' + event.lineno);
        // 阻止默认行为，防止页面崩溃
        event.preventDefault();
        return true;
      });

      // 捕获未处理的 Promise 拒绝
      window.addEventListener('unhandledrejection', function(event) {
        console.warn('[GlobalError] Promise 拒绝:', event.reason);
        // 阻止默认行为
        event.preventDefault();
        return true;
      });

      console.log('[ErrorHandler] 初始化完成');
    }
  };

  // 暴露到全局
  window.ErrorHandler = ErrorHandler;

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ErrorHandler.init);
  } else {
    ErrorHandler.init();
  }
})();
