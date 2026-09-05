/**
 * modules/topicPerf.js
 * 函数: renderTopicPerf, recordPerf, calcHitRate, getPerfData, savePerfData
 * 依赖: ['topic_performance']
 */
(function() {
  'use strict';

  // renderTopicPerf
  function renderTopicPerf() {
    const perf = DATA.topic_performance;
    if (!perf) { document.getElementById('topicPerfContent').innerHTML='<p style="color:var(--text-secondary)">暂无数据</p>'; return; }
    let html = '<div class="gene-grid">';
    html += '<div class="gene-card"><h4>选题总数</h4><div class="gene-val">'+(perf.total_topics||0)+'</div></div>';
    html += '<div class="gene-card"><h4>已发布</h4><div class="gene-val">'+(perf.published||0)+'</div></div>';
    html += '<div class="gene-card"><h4>命中率</h4><div class="gene-val">'+(perf.hit_rate||0)+'%</div></div>';
    html += '</div>';
    if (perf.note) { html += '<p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">'+perf.note+'</p>'; }
    document.getElementById('topicPerfContent').innerHTML = html;
  }

  // recordPerf
  function recordPerf(title) {
    var views = prompt('请输入播放量（数字）：', '');
    if (views === null) return;
    var likes = prompt('请输入点赞数（数字）：', '');
    if (likes === null) return;
    var followers = prompt('请输入涨粉数（数字）：', '');
    if (followers === null) return;
    var perf = getPerfData();
    perf[title] = { views: parseInt(views)||0, likes: parseInt(likes)||0, followers: parseInt(followers)||0, date: new Date().toLocaleDateString() };
    savePerfData(perf);
    renderTopics();
    updateTracker();
    alert('效果数据已保存！');
  }

  // calcHitRate
  function calcHitRate() {
    var perf = getPerfData();
    var published = Object.keys(perf).length;
    if (published === 0) return { rate: 0, avgViews: 0, avgLikes: 0, total: 0 };
    var totalViews = 0, totalLikes = 0, hits = 0;
    Object.values(perf).forEach(function(p) {
      totalViews += p.views; totalLikes += p.likes;
      if (p.views >= 10000) hits++;
    });
    return { rate: Math.round(hits/published*100), avgViews: Math.round(totalViews/published), avgLikes: Math.round(totalLikes/published), total: published };
  }

  // getPerfData
  function getPerfData() {
    try { return JSON.parse(localStorage.getItem('topic_perf') || '{}'); } catch(e) { return {}; }
  }

  // savePerfData
  function savePerfData(d) { localStorage.setItem('topic_perf', JSON.stringify(d)); }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "topicPerf",
      requiredFields: [],
      render: function(data) {
        try { renderTopicPerf(data); } catch(e) { console.error("[topicPerf]", e); }
      }
    });
  }
  window.renderTopicPerf = renderTopicPerf;
  window.recordPerf = recordPerf;
  window.calcHitRate = calcHitRate;
  window.getPerfData = getPerfData;
  window.savePerfData = savePerfData;
})();
