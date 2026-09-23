/**
 * modules/cardDataSourceMap.js
 * 卡片数据源映射表
 * 用于检测哪些卡片没有数据，避免"空卡片"问题
 */
(function() {
  'use strict';

  // 卡片ID -> 数据源字段映射
  const CARD_DATA_SOURCE_MAP = {
    // 概览
    'hero': ['top_keywords', 'hot_works', 'audience_summary'],
    'actionList': ['action_items'],
    'heroStats': ['total_works', 'total_keywords', 'total_avg_like'],

    // 技术雷达
    'techradar': ['tech_radar'],
    'techSummary': ['tech_summary'],
    'techGrid': ['tech_grid'],

    // 热点追踪
    'works': ['hot_works'],
    'hotwords': ['hot_keywords'],
    'history': ['keyword_history'],
    'hotwordTable': ['hot_keywords'],
    'worksTable': ['hot_works'],
    'chartRanking': ['keyword_ranking'],
    'chartCategory': ['category_distribution'],
    'chartPublishTime': ['publish_time_distribution'],
    'chartDuration': ['duration_distribution'],
    'chartHook': ['hook_type_distribution'],
    'insightsGrid': ['insights'],
    'growthRanking': ['growth_ranking'],
    'blueOcean': ['blue_ocean_keywords'],
    'anomalyDetection': ['anomaly_detection'],

    // 爆款拆解
    'breakdown': ['breakdown_list'],
    'breakdownGrid': ['breakdown_list'],
    'saturationList': ['saturation_analysis'],
    'commentDemands': ['comment_demands'],
    'commentKw': ['comment_keywords'],
    'chartScatter': ['scatter_data'],
    'chartCollect': ['collect_rate_analysis'],
    'matrixGrid': ['content_matrix'],
    'commentSemantic': ['comment_semantic'],
    'conversionSignals': ['conversion_signals'],
    'viralGenes': ['viral_genes'],
    'viralGenesContent': ['viral_genes'],
    'completionRate': ['completion_rate'],
    'formatROI': ['format_roi'],

    // 人群洞察
    'audience': ['audience_summary'],
    'audienceChart': ['audience_demographics'],
    'personaGrid': ['persona_list'],
    'avgCommentRate': ['comment_rate_analysis'],
    'avgCollectRate': ['collect_rate_analysis'],
    'highCommentList': ['high_comment_works'],

    // 选题管理
    'topics': ['topic_suggestions'],
    'topicsGrid': ['topic_suggestions'],
    'topicTracker': ['topic_tracker'],
    'kanbanBoard': ['topic_kanban'],
    'topicPerf': ['topic_performance'],
    'topicPerfContent': ['topic_performance'],
    'crossPlatform': ['cross_platform_gaps'],
    'ownPerformance': ['own_performance'],

    // 内容创作
    'titleGen': ['title_generation'],
    'titleFormulas': ['title_formulas'],
    'formulaGrid': ['title_formulas'],
    'leadScripts': ['lead_scripts'],
    'scriptContainer': ['script_templates'],
    'titleGenes': ['title_genes'],

    // 发布执行
    'publishTime': ['publish_time_analysis'],
    'ptChart': ['publish_time_distribution'],
    'ptBestCards': ['best_publish_times'],
    'ptPlatform': ['platform_comparison'],
    'ptTips': ['publish_tips'],
    'bestPostingCombo': ['best_posting_combo'],
    'postingReminder': ['best_posting_combo'],
    'contentCalendar': ['content_calendar'],
    'schedule': ['publish_schedule'],
    'scheduleContent': ['publish_schedule'],
    'commentScripts': ['comment_scripts'],
    'commentScriptsContent': ['comment_scripts'],
    'checklist': ['publish_checklist'],
    'checklistContent': ['publish_checklist'],
    'checklistProgress': ['publish_checklist'],
    'favoritesGrid': ['favorites'],
    'launchOps': ['launch_ops'],
    'launchBanner': ['launch_banner'],
    'healthScore': ['health_score'],
    'healthBar': ['health_score'],
    'coreKwCloud': ['core_keywords'],
    'ratioBar': ['ratio_analysis'],
    'ratioLegend': ['ratio_analysis'],
    'launchTasks': ['launch_tasks'],
    'pitfallList': ['pitfalls'],

    // 对标分析
    'compareSection': ['comparison_summary'],
    'compareSummary': ['comparison_summary'],
    'overlapTable': ['keyword_overlap'],
    'dyOnlyList': ['douyin_only_keywords'],
    'xhsOnlyList': ['xhs_only_keywords'],
    'authorList': ['benchmark_authors'],
    'competitorWorks': ['competitor_works'],
    'smallViral': ['small_viral_works'],
    'formatBars': ['format_comparison'],
    'competitorStrategy': ['competitor_strategy']
  };

  // 检测哪些卡片没有数据
  function checkMissingData() {
    if (typeof DASHBOARD_DATA === 'undefined') return [];
    
    const missing = [];
    for (const [cardId, dataKeys] of Object.entries(CARD_DATA_SOURCE_MAP)) {
      const el = document.getElementById(cardId);
      if (!el) continue;
      
      // 检查是否有任何一个数据源有数据
      const hasData = dataKeys.some(key => {
        const val = DASHBOARD_DATA[key];
        if (!val) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'object') return Object.keys(val).length > 0;
        return true;
      });
      
      if (!hasData) {
        missing.push({
          cardId: cardId,
          expectedDataKeys: dataKeys
        });
      }
    }
    
    return missing;
  }

  // 暴露到全局
  window.CARD_DATA_SOURCE_MAP = CARD_DATA_SOURCE_MAP;
  window.checkMissingCardData = checkMissingData;

})();
