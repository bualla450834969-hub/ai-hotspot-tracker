/**
 * 数据层 - 统一数据加载接口
 * 每个模块只需要自己需要的数据，不需要读全局对象
 */
const DataLoader = {
  // 缓存
  cache: {},
  
  /**
   * 获取全部数据（临时用，后面会拆分）
   */
  getDashboardData() {
    if (!this.cache.dashboard) {
      this.cache.dashboard = window.DASHBOARD_DATA || {};
    }
    return this.cache.dashboard;
  },

  /**
   * 获取热词数据
   */
  getHotwords() {
    const data = this.getDashboardData();
    return data.hotwords || [];
  },

  /**
   * 获取选题数据
   */
  getTopics() {
    const data = this.getDashboardData();
    return data.topics || [];
  },

  /**
   * 获取爆款拆解数据
   */
  getBreakdowns() {
    const data = this.getDashboardData();
    return data.breakdowns || [];
  },

  /**
   * 获取技术信号数据
   */
  getTechSignals() {
    const data = this.getDashboardData();
    return data.tech_signals || [];
  },

  /**
   * 获取作品数据
   */
  getWorks() {
    const data = this.getDashboardData();
    return data.works || [];
  },

  /**
   * 获取人群画像数据
   */
  getAudience() {
    const data = this.getDashboardData();
    return data.audience || {};
  },

  /**
   * 获取标题公式数据
   */
  getTitleFormulas() {
    const data = this.getDashboardData();
    return data.title_formulas || [];
  },

  /**
   * 获取爆款基因库数据
   */
  getViralGenes() {
    const data = this.getDashboardData();
    return data.viral_genes || {};
  },

  /**
   * 获取运营状态数据
   */
  getOpsStatus() {
    const data = this.getDashboardData();
    return data.ops_status || {};
  },

  /**
   * 获取发布时间数据
   */
  getPublishTime() {
    const data = this.getDashboardData();
    return data.publish_time || {};
  },

  /**
   * 获取引流话术数据
   */
  getLeadScripts() {
    const data = this.getDashboardData();
    return data.lead_scripts || {};
  },

  /**
   * 获取启动运营数据
   */
  getLaunchOps() {
    const data = this.getDashboardData();
    return data.launch_ops || {};
  },

  /**
   * 获取内容日历数据
   */
  getContentCalendar() {
    const data = this.getDashboardData();
    return data.content_calendar || [];
  },

  /**
   * 获取话题表现数据
   */
  getTopicPerf() {
    const data = this.getDashboardData();
    return data.topic_perf || {};
  },

  /**
   * 获取互动数据
   */
  getEngagement() {
    const data = this.getDashboardData();
    return data.engagement || {};
  },

  /**
   * 获取对标对比数据
   */
  getComparison() {
    const data = this.getDashboardData();
    return data.comparison || {};
  },

  /**
   * 获取高级分析数据
   */
  getAdvancedAnalytics() {
    const data = this.getDashboardData();
    return data.advanced_analytics || {};
  },

  /**
   * 获取脚本生成数据
   */
  getScriptGen() {
    const data = this.getDashboardData();
    return data.script_gen || {};
  },

  /**
   * 获取积分数据
   */
  getCredit() {
    const data = this.getDashboardData();
    return data.credit || {};
  },

  /**
   * 获取收藏数据
   */
  getFavorites() {
    const data = this.getDashboardData();
    return data.favorites || [];
  },

  /**
   * 获取看板数据
   */
  getKanban() {
    const data = this.getDashboardData();
    return data.kanban || {};
  },

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = {};
  }
};

// 导出到全局
window.DataLoader = DataLoader;
