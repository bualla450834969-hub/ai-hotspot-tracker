/**
 * core/data-loader.js — 数据加载器
 * 负责加载各个模块的数据，支持按需加载和错误处理
 */
(function() {
  'use strict';

  // ===== 数据加载器 =====
  const DataLoader = {
    // 已加载的数据模块
    loadedModules: {},

    /**
     * 加载单个数据模块
     * @param {string} moduleName - 模块名称
     * @param {string} basePath - 基础路径
     * @returns {Promise} 加载完成的 Promise
     */
    loadModule(moduleName, basePath) {
      return new Promise((resolve, reject) => {
        // 如果已经加载过，直接返回
        if (this.loadedModules[moduleName]) {
          resolve(this.loadedModules[moduleName]);
          return;
        }

        // 创建 script 标签加载数据
        const script = document.createElement('script');
        script.src = `${basePath}/data/${moduleName}.js?t=${Date.now()}`;
        
        script.onload = () => {
          const data = window[`DASHBOARD_DATA_${moduleName}`];
          if (data) {
            this.loadedModules[moduleName] = data;
            console.log(`[DataLoader] 模块 ${moduleName} 加载成功`);
            resolve(data);
          } else {
            const error = new Error(`模块 ${moduleName} 数据格式错误`);
            console.error(`[DataLoader]`, error);
            reject(error);
          }
        };
        
        script.onerror = () => {
          const error = new Error(`模块 ${moduleName} 加载失败`);
          console.error(`[DataLoader]`, error);
          reject(error);
        };
        
        document.head.appendChild(script);
      });
    },

    /**
     * 加载多个数据模块
     * @param {string[]} moduleNames - 模块名称数组
     * @param {string} basePath - 基础路径
     * @returns {Promise} 所有模块加载完成的 Promise
     */
    async loadModules(moduleNames, basePath) {
      const results = {};
      
      for (const moduleName of moduleNames) {
        try {
          const data = await this.loadModule(moduleName, basePath);
          results[moduleName] = data;
        } catch (error) {
          console.warn(`[DataLoader] 模块 ${moduleName} 加载失败，继续加载其他模块`);
          results[moduleName] = {};
        }
      }
      
      return results;
    },

    /**
     * 合并所有模块数据到全局 DASHBOARD_DATA
     * @param {Object} modulesData - 各模块数据对象
     */
    mergeData(modulesData) {
      window.DASHBOARD_DATA = window.DASHBOARD_DATA || {};
      
      Object.values(modulesData).forEach(moduleData => {
        Object.assign(window.DASHBOARD_DATA, moduleData);
      });
      
      console.log('[DataLoader] 所有数据合并完成');
    },

    /**
     * 获取指定模块的数据
     * @param {string} moduleName - 模块名称
     * @returns {any} 模块数据
     */
    getModuleData(moduleName) {
      return this.loadedModules[moduleName] || {};
    },

    /**
     * 重置加载状态
     */
    reset() {
      this.loadedModules = {};
      console.log('[DataLoader] 加载状态已重置');
    }
  };

  // 暴露到全局
  window.DataLoader = DataLoader;

  console.log('[DataLoader] 初始化完成');
})();
