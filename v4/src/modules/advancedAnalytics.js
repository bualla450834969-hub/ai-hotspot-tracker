/**
 * modules/advancedAnalytics.js
 * 高级分析：蓝海词、跨平台迁移、标题基因库、评论语义、转化信号、完播率、上升速率、ROI、对标拆解、发布组合
 */
(function() {
  'use strict';

  // 蓝海关键词
  function renderBlueOcean() {
    const el = document.getElementById('blueOceanList');
    if (!el) return;
    const list = DASHBOARD_DATA.blue_ocean_keywords || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无蓝海关键词</div>'; return; }
    el.innerHTML = list.map((k, i) => `
      <div class="bo-item glass-card">
        <div class="bo-rank">${i+1}</div>
        <div class="bo-main">
          <div class="bo-keyword">${k.keyword} <span class="bo-platform ${k.platform}">${k.platform==='douyin'?'抖音':'小红书'}</span></div>
          <div class="bo-meta">均赞${k.avg_like} · ${k.works_count}作品 · 竞争度${Math.round(k.competition_score)}</div>
        </div>
        <div class="bo-score">
          <div class="bo-score-val" style="color:${k.blue_ocean_score>50?'#10b981':'#f59e0b'}">${k.blue_ocean_score}</div>
          <div class="bo-score-label">蓝海分</div>
        </div>
        <div class="bo-tag">${k.opportunity}</div>
      </div>`).join('');
  }

  // 跨平台选题迁移
  function renderCrossPlatform() {
    const el = document.getElementById('crossPlatformList');
    if (!el) return;
    const list = DASHBOARD_DATA.cross_platform_gaps || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无跨平台迁移机会（两平台热度接近）</div>'; return; }
    el.innerHTML = list.map(g => `
      <div class="cp-item glass-card">
        <div class="cp-keyword">${g.keyword}</div>
        <div class="cp-compare">
          <div class="cp-side xhs">
            <span class="cp-label">小红书</span>
            <span class="cp-val">均赞 ${g.xhs_avg_like}</span>
          </div>
          <div class="cp-arrow">→</div>
          <div class="cp-side dy">
            <span class="cp-label">抖音</span>
            <span class="cp-val">均赞 ${g.dy_avg_like}</span>
          </div>
        </div>
        <div class="cp-gap">热度差 ${g.gap_ratio}倍 · ${g.suggestion}</div>
      </div>`).join('');
  }

  // 标题基因库
  function renderTitleGenes() {
    const el = document.getElementById('titleGeneList');
    if (!el) return;
    const list = DASHBOARD_DATA.title_gene_library || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    el.innerHTML = list.map(g => `
      <div class="tg-item glass-card">
        <div class="tg-header">
          <span class="tg-pattern">${g.pattern}</span>
          <span class="tg-count">${g.count}条</span>
          <span class="tg-like">均赞 ${g.avg_like}</span>
        </div>
        <div class="tg-formula">💡 ${g.formula}</div>
        ${g.examples && g.examples.length ? `<div class="tg-examples">${g.examples.map(e=>`<div class="tg-example">"${e}"</div>`).join('')}</div>` : ''}
      </div>`).join('');
  }

  // 评论语义挖掘
  function renderCommentSemantic() {
    const el = document.getElementById('commentSemanticContent');
    if (!el) return;
    const cs = DASHBOARD_DATA.comment_semantic || {};
    el.innerHTML = `
      <div class="cs-section">
        <div class="cs-title">😣 用户痛点 <span class="cs-count">${(cs.pain_points||[]).length}</span></div>
        <div class="cs-tags">${(cs.pain_points||[]).slice(0,8).map(p=>`<span class="cs-tag pain">${p.keyword}<span class="cs-tag-count">${p.count}</span></span>`).join('') || '<span class="empty-state">暂无</span>'}</div>
      </div>
      <div class="cs-section">
        <div class="cs-title">❓ 用户提问 <span class="cs-count">${(cs.questions||[]).length}</span></div>
        <div class="cs-tags">${(cs.questions||[]).slice(0,8).map(p=>`<span class="cs-tag question">${p.keyword}<span class="cs-tag-count">${p.count}</span></span>`).join('') || '<span class="empty-state">暂无</span>'}</div>
      </div>
      <div class="cs-section">
        <div class="cs-title">💰 购买意向 <span class="cs-count">${(cs.purchase_intent||[]).length}</span></div>
        <div class="cs-tags">${(cs.purchase_intent||[]).slice(0,8).map(p=>`<span class="cs-tag purchase">${p.keyword}<span class="cs-tag-count">${p.count}</span></span>`).join('') || '<span class="empty-state">暂无</span>'}</div>
      </div>`;
  }

  // 转化信号
  function renderConversionSignals() {
    const el = document.getElementById('conversionSignalList');
    if (!el) return;
    const list = DASHBOARD_DATA.conversion_signals || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无明显转化信号作品（评论中未检测到购买意向关键词）</div>'; return; }
    el.innerHTML = list.map(s => `
      <div class="cv-item glass-card">
        <div class="cv-title">${s.title}</div>
        <div class="cv-meta">
          <span>${s.platform==='douyin'?'抖音':'小红书'}</span>
          <span>👍 ${s.likeCount}</span>
          <span>💬 ${s.commentCount}</span>
          <span class="cv-signal">转化信号 ${s.conversion_signal_count}</span>
        </div>
      </div>`).join('');
  }

  // 完播率分析
  function renderCompletionRate() {
    const el = document.getElementById('completionRateChart');
    if (!el) return;
    const list = DASHBOARD_DATA.completion_rate_analysis || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    const max = Math.max(...list.map(d=>d.avg_completion));
    el.innerHTML = list.map(d => `
      <div class="cr-row">
        <div class="cr-label">${d.duration_bucket}</div>
        <div class="cr-bar-wrap"><div class="cr-bar" style="width:${(d.avg_completion/max*100)}%">${d.avg_completion}%</div></div>
        <div class="cr-sample">${d.sample_count}样本</div>
      </div>`).join('');
  }

  // 关键词上升速率排名
  function renderGrowthRanking() {
    const el = document.getElementById('growthRankingList');
    if (!el) return;
    const list = DASHBOARD_DATA.keyword_growth_ranking || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无增长数据</div>'; return; }
    el.innerHTML = list.slice(0,15).map(k => `
      <div class="gr-row">
        <div class="gr-rank ${k.rank<=3?'top':''}">${k.rank}</div>
        <div class="gr-keyword">${k.keyword}</div>
        <div class="gr-platform ${k.platform}">${k.platform==='douyin'?'抖':'红'}</div>
        <div class="gr-growth">+${k.growth}%</div>
        <div class="gr-trend ${k.trend==='飙升'?'up':''}">${k.trend}</div>
      </div>`).join('');
  }

  // 内容形式ROI
  function renderFormatROI() {
    const el = document.getElementById('formatROIList');
    if (!el) return;
    const list = DASHBOARD_DATA.content_format_roi || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    const max = Math.max(...list.map(d=>d.engagement_score));
    el.innerHTML = list.map(f => `
      <div class="roi-item">
        <div class="roi-header">
          <span class="roi-format">${f.format}</span>
          <span class="roi-count">${f.count}条</span>
        </div>
        <div class="roi-bars">
          <div class="roi-bar-row"><span>均赞</span><div class="roi-bar"><div style="width:${(f.avg_like/max*100)}%"></div></div><span>${f.avg_like}</span></div>
          <div class="roi-bar-row"><span>互动分</span><div class="roi-bar engagement"><div style="width:${(f.engagement_score/max*100)}%"></div></div><span>${f.engagement_score}</span></div>
        </div>
      </div>`).join('');
  }

  // 对标账号策略
  function renderCompetitorStrategy() {
    const el = document.getElementById('competitorList');
    if (!el) return;
    const list = DASHBOARD_DATA.competitor_strategy || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无对标数据</div>'; return; }
    el.innerHTML = list.map((c, i) => `
      <div class="comp-item glass-card">
        <div class="comp-rank">TOP${i+1}</div>
        <div class="comp-main">
          <div class="comp-name">${c.account}</div>
          <div class="comp-meta">${c.platform==='douyin'?'抖音':'小红书'} · ${c.works_count}作品 · 均赞${c.avg_like}</div>
          <div class="comp-strategy">📋 ${c.strategy}</div>
          <div class="comp-mix">${Object.entries(c.content_mix||{}).map(([k,v])=>`<span class="comp-mix-tag">${k} ${v}</span>`).join('')}</div>
        </div>
        <div class="comp-freq">${c.posting_freq}</div>
      </div>`).join('');
  }

  // 最佳发布组合
  function renderBestPostingCombo() {
    const el = document.getElementById('bestPostingComboContent');
    if (!el) return;
    const list = DASHBOARD_DATA.best_posting_combo || [];
    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    el.innerHTML = `<div class="bpc-grid">${list.map(c => `
      <div class="bpc-item ${c.score>=85?'best':c.score>=70?'good':''}">
        <div class="bpc-day">${c.day}</div>
        <div class="bpc-hour">${c.hour}</div>
        <div class="bpc-score">${c.score}分</div>
      </div>`).join('')}</div>`;
  }

  // 发布时间提醒
  function renderPostingReminder() {
    const el = document.getElementById('postingReminder');
    if (!el) return;
    const now = new Date();
    const hour = now.getHours();
    const dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
    const today = dayNames[now.getDay()];
    const best = (DASHBOARD_DATA.best_posting_combo||[]).find(c => c.day === today);
    let msg, status;
    if (best) {
      const bestHour = parseInt(best.hour);
      if (Math.abs(hour - bestHour) <= 1) {
        msg = `现在是发布黄金时段！${today} ${best.hour} 是最佳发布时间`;
        status = 'hot';
      } else if (hour < bestHour) {
        msg = `距离今日最佳发布时间 ${best.hour} 还有 ${bestHour-hour} 小时`;
        status = 'upcoming';
      } else {
        msg = `今日最佳发布时间 ${best.hour} 已过，建议明天同一时段发布`;
        status = 'passed';
      }
    } else {
      msg = '建议在 18:00-22:00 发布，此时段用户活跃度最高';
      status = 'default';
    }
    el.innerHTML = `<div class="pr-bar pr-${status}"><span class="pr-icon">⏰</span><span>${msg}</span></div>`;
  }

  window.renderBlueOcean = renderBlueOcean;
  window.renderCrossPlatform = renderCrossPlatform;
  window.renderTitleGenes = renderTitleGenes;
  window.renderCommentSemantic = renderCommentSemantic;
  window.renderConversionSignals = renderConversionSignals;
  window.renderCompletionRate = renderCompletionRate;
  window.renderGrowthRanking = renderGrowthRanking;
  window.renderFormatROI = renderFormatROI;
  window.renderCompetitorStrategy = renderCompetitorStrategy;
  window.renderBestPostingCombo = renderBestPostingCombo;
  window.renderAnomalyDetection = renderAnomalyDetection;
  window.renderOwnPerformance = renderOwnPerformance;
  window.renderPostingReminder = renderPostingReminder;

  // 数据异常检测
  function renderAnomalyDetection() {
    try {
      const el = document.getElementById('anomalyList');
      if (!el) return;
      const list = DASHBOARD_DATA.data_anomalies || [];
      if (!list.length) { el.innerHTML = '<div class="empty-state">暂无异常数据</div>'; return; }
      el.innerHTML = list.map((a, i) => `
        <div class="anomaly-item glass-card">
          <div class="anomaly-rank ${a.type === '暴涨' ? 'surging' : 'declining'}">${a.type}</div>
          <div class="anomaly-main">
            <div class="anomaly-keyword">${a.keyword} <span class="bo-platform ${a.platform}">${a.platform==='douyin'?'抖音':'小红书'}</span></div>
            <div class="anomaly-meta">增长率 ${a.growth}% (均值 ${a.avg_growth}%) · Z值 ${a.z_score} · ${a.works_count}作品 · 均赞${a.avg_like}</div>
          </div>
          <div class="anomaly-suggestion">${a.suggestion}</div>
        </div>`).join('');
    } catch(e) { console.warn('[AA] anomaly:', e); }
  }


  // 自有数据回传（飞书多维表格）
  function renderOwnPerformance() {
    try {
      const el = document.getElementById('ownPerfList');
      if (!el) return;
      const list = DASHBOARD_DATA.own_performance || [];
      const summary = DASHBOARD_DATA.own_performance_summary || {};
      if (!list.length) {
        el.innerHTML = '<div class="empty-state"><div style="font-size:32px;margin-bottom:8px">📊</div><div style="color:rgba(255,255,255,0.5);font-size:13px">暂无发布数据</div><div style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:4px">在飞书多维表格"选题建议表"中将状态改为"已发布"并填写播放量等数据</div></div>';
        return;
      }
      el.innerHTML = list.map((p, i) => `
        <div class="own-perf-item glass-card">
          <div class="own-perf-rank">${i+1}</div>
          <div class="own-perf-main">
            <div class="own-perf-title">${p.title}</div>
            <div class="own-perf-meta">${p.platform||'抖音'} · ${p.publish_date||'-'} · ${p.keyword||''}</div>
          </div>
          <div class="own-perf-stats">
            <div class="ops-stat"><span class="ops-num">${(p.views||0).toLocaleString()}</span><span class="ops-label">播放</span></div>
            <div class="ops-stat"><span class="ops-num">${(p.likes||0).toLocaleString()}</span><span class="ops-label">点赞</span></div>
            <div class="ops-stat"><span class="ops-num">${(p.collects||0).toLocaleString()}</span><span class="ops-label">收藏</span></div>
            <div class="ops-stat"><span class="ops-num">${p.completion_rate? (p.completion_rate*100).toFixed(1)+'%' : '-'}</span><span class="ops-label">完播</span></div>
          </div>
        </div>`).join('');
    } catch(e) { console.warn('[AA] ownPerf:', e); }
  }

})();
