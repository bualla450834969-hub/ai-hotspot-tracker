/**
 * modules/publishTime.js
 * 函数: renderPublishTimeDetail
 * 依赖: ['publish_time_dist']
 */
(function() {
  'use strict';

  // renderPublishTimeDetail
  function renderPublishTimeDetail() {
    var works = DATA.works || [];
    if (!works.length) return;
    var hourData = {};
    for (var h = 0; h < 24; h++) {
      hourData[h] = { count: 0, totalLikes: 0, viralCount: 0, highLikeCount: 0 };
    }
    var platformHour = { douyin: {}, xiaohongshu: {} };
    for (var p in platformHour) {
      for (var h2 = 0; h2 < 24; h2++) platformHour[p][h2] = { count: 0, viralCount: 0, totalLikes: 0 };
    }

    works.forEach(function(w) {
      var pt = w.publishTime;
      if (!pt) return;
      var m = pt.match(/ (\d{2}):/);
      if (!m) return;
      var hour = parseInt(m[1]);
      var likes = w.likeCount || 0;
      var hd = hourData[hour];
      hd.count++;
      hd.totalLikes += likes;
      if (likes >= 10000) hd.viralCount++;
      if (likes >= 5000) hd.highLikeCount++;
      var plat = w.platform === 'xiaohongshu' ? 'xiaohongshu' : 'douyin';
      if (platformHour[plat]) {
        platformHour[plat][hour].count++;
        platformHour[plat][hour].totalLikes += likes;
        if (likes >= 10000) platformHour[plat][hour].viralCount++;
      }
    });

    // 计算爆款率，找出TOP3时段（样本量>=10）
    var hoursWithData = [];
    for (var h3 = 0; h3 < 24; h3++) {
      var d = hourData[h3];
      if (d.count >= 5) {
        var viralRate = d.viralCount / d.count * 100;
        var avgLikes = d.totalLikes / d.count;
        var score = viralRate * 0.5 + (d.highLikeCount / d.count * 100) * 0.3 + Math.min(avgLikes / 500, 100) * 0.2;
        hoursWithData.push({ hour: h3, count: d.count, avgLikes: avgLikes, viralRate: viralRate, score: score });
      }
    }
    hoursWithData.sort(function(a, b) { return b.score - a.score; });
    var bestHours = hoursWithData.slice(0, 3);
    var bestHourSet = {};
    bestHours.forEach(function(b) { bestHourSet[b.hour] = true; });

    // 渲染柱状图
    var maxCount = 0;
    for (var h4 = 0; h4 < 24; h4++) maxCount = Math.max(maxCount, hourData[h4].count);
    var chartHtml = '';
    for (var h5 = 0; h5 < 24; h5++) {
      var d5 = hourData[h5];
      var heightPct = maxCount > 0 ? (d5.count / maxCount * 100) : 0;
      var isBest = bestHourSet[h5];
      var viralLabel = (d5.count >= 5 && d5.viralCount > 0) ? (d5.viralCount / d5.count * 100).toFixed(0) + '%' : '';
      chartHtml += '<div class="pt-bar-wrap">';
      if (viralLabel) chartHtml += '<div class="pt-bar-viral">' + viralLabel + '</div>';
      chartHtml += '<div class="pt-bar' + (isBest ? ' best' : '') + '" style="height:' + Math.max(heightPct, 1) + '%" title="' + h5 + ':00 - ' + d5.count + '条作品, 平均点赞' + Math.round(d5.totalLikes / Math.max(d5.count,1)) + '"></div>';
      chartHtml += '<div class="pt-bar-label">' + h5 + '</div>';
      chartHtml += '</div>';
    }
    document.getElementById('ptChart').innerHTML = chartHtml;

    // 渲染TOP3最佳时段
    var rankEmoji = ['🥇', '🥈', '🥉'];
    var bestHtml = '';
    bestHours.forEach(function(b, i) {
      bestHtml += '<div class="pt-best-card">';
      bestHtml += '<div class="rank">' + rankEmoji[i] + '</div>';
      bestHtml += '<div class="time">' + b.hour + ':00 - ' + (b.hour + 1) + ':00</div>';
      bestHtml += '<div class="stats">样本<b>' + b.count + '</b>条<br>平均点赞<b>' + Math.round(b.avgLikes).toLocaleString() + '</b><br>爆款率<span class="viral-rate">' + b.viralRate.toFixed(1) + '%</span></div>';
      bestHtml += '</div>';
    });
    document.getElementById('ptBestCards').innerHTML = bestHtml;

    // 分平台最佳时段
    var platHtml = '';
    var platNames = { douyin: '抖音', xiaohongshu: '小红书' };
    for (var p2 in platformHour) {
      var bestH = -1, bestVR = -1, bestCount = 0, bestAvg = 0;
      for (var h6 = 0; h6 < 24; h6++) {
        var ph = platformHour[p2][h6];
        if (ph.count >= 5) {
          var vr = ph.viralCount / ph.count * 100;
          if (vr > bestVR) { bestVR = vr; bestH = h6; bestCount = ph.count; bestAvg = ph.totalLikes / ph.count; }
        }
      }
      if (bestH >= 0) {
        platHtml += '<div class="pt-platform-item">';
        platHtml += '<div class="plat-name">' + platNames[p2] + '最佳时段</div>';
        platHtml += '<div class="plat-best">' + bestH + ':00 - ' + (bestH + 1) + ':00</div>';
        platHtml += '<div style="color:var(--text-tertiary);font-size:11px;margin-top:2px;">爆款率' + bestVR.toFixed(1) + '% · 平均点赞' + Math.round(bestAvg).toLocaleString() + '</div>';
        platHtml += '</div>';
      }
    }
    document.getElementById('ptPlatform').innerHTML = platHtml;

    // 实操建议
    var tipsHtml = '<strong>💡 实操建议：</strong>';
    if (bestHours.length > 0) {
      tipsHtml += '优先在<strong>' + bestHours[0].hour + ':00前后</strong>发布，爆款率是平均水平的' + (bestHours[0].viralRate / Math.max(hoursWithData.reduce(function(s, x) { return s + x.viralRate; }, 0) / Math.max(hoursWithData.length, 1), 0.1)).toFixed(1) + '倍。';
    }
    tipsHtml += ' 避开<strong>13:00-14:00午间</strong>（'+cfg('name','该领域')+'内容互动最差）。';
    tipsHtml += ' 若一天发2条，选<strong>18点 + 20点</strong>覆盖晚高峰双波峰。';
    document.getElementById('ptTips').innerHTML = tipsHtml;
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "publishTime",
      requiredFields: ['works'],
      render: function(data) {
        try { renderPublishTimeDetail(data); } catch(e) { console.error("[publishTime]", e); }
      }
    });
  }
  window.renderPublishTimeDetail = renderPublishTimeDetail;
})();
