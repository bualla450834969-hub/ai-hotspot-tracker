/**
 * 错误处理工具 - 单个模块出错不影响其他模块
 */
const ErrorHandler = {
  /**
   * 安全执行函数，出错了显示错误提示
   */
  safeExecute(fn, componentName, fallbackHtml = '') {
    try {
      return fn();
    } catch (error) {
      console.error(`[${componentName}] 出错了:`, error);
      return fallbackHtml || this.getErrorHtml(componentName, error);
    }
  },

  /**
   * 获取错误提示 HTML
   */
  getErrorHtml(componentName, error) {
    return `
      <div class="card error-card">
        <div class="error-icon">⚠️</div>
        <div class="error-title">${componentName} 加载失败</div>
        <div class="error-message">${error.message || '未知错误'}</div>
      </div>
    `;
  },

  /**
   * 安全渲染组件，用 try-catch 包裹
   */
  safeRender(renderFn, componentName, container) {
    if (!container) return;
    
    const originalContent = container.innerHTML;
    
    try {
      const html = renderFn();
      container.innerHTML = html;
    } catch (error) {
      console.error(`[${componentName}] 渲染失败:`, error);
      container.innerHTML = this.getErrorHtml(componentName, error);
    }
  }
};

// 导出到全局
window.ErrorHandler = ErrorHandler;
