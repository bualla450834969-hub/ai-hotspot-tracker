/**
 * modules/advanced/publishOptimization.js
 * 自动拆分自 advancedAnalytics.js
 */
(function() {
  'use strict';
  
function renderBestPostingCombo() {
    const el = document.getElementById('bestPostingComboContent');
    if (!el) return;
    const data = DASHBOARD_DATA.best_posting_combo;
    if (!data) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }

    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data.recommendations) {
      list = data.recommendations.map(function(r) {
        return {
          day: r.day,
          hour: r.time,
          score: r.avg_like ? Math.round(r.avg_like / 300) : 70
        };
      });
      if (data.best_day && data.best_time) {
        list.unshift({
          day: data.best_day,
          hour: data.best_time,
          score: data.avg_like ? Math.round(data.avg_like / 300) : 90
        });
      }
    }

    if (!list.length) { el.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    var html = '<div class="bpc-grid">';
    list.forEach(function(c) {
      var cls = c.score >= 85 ? 'best' : (c.score >= 70 ? 'good' : '');
      html += '<div class="bpc-item ' + cls + '">' +
        '<div class="bpc-day">' + c.day + '</div>' +
        '<div class="bpc-hour">' + c.hour + '</div>' +
        '<div class="bpc-score">' + c.score + '分</div>' +
      '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

function renderPostingReminder() {
    const el = document.getElementById('postingReminder');
    if (!el) return;
    const now = new Date();
    const hour = now.getHours();
    const dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
    const today = dayNames[now.getDay()];
    const bpc = DASHBOARD_DATA.best_posting_combo;
    let best = null;
    if (bpc) {
      if (Array.isArray(bpc)) {
        best = bpc.find(c => c.day === today);
      } else if (bpc.recommendations) {
        best = bpc.recommendations.find(c => c.day === today);
        if (!best && bpc.best_day === today) {
          best = { day: bpc.best_day, hour: bpc.best_time };
        }
      }
    }
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

function renderContentCalendar() {
    try {
      var grid = document.getElementById('calendarGrid');
      if (!grid) { console.warn('[Calendar] calendarGrid not found'); return; }
      
      var topics = (typeof DASHBOARD_DATA !== 'undefined' && DASHBOARD_DATA.topics) ? DASHBOARD_DATA.topics : [];
      var bestCombo = (typeof DASHBOARD_DATA !== 'undefined' && DASHBOARD_DATA.best_posting_combo) ? DASHBOARD_DATA.best_posting_combo : {};
      var recs = bestCombo.recommendations || [];
      var bestDay = bestCombo.best_day || '周三';
      var bestTime = bestCombo.best_time || '18:00-20:00';

      var dayMap = {'周一':0,'周二':1,'周三':2,'周四':3,'周五':4,'周六':5,'周日':6};
      var dayScores = {};
      dayScores[dayMap[bestDay]] = 5;
      recs.forEach(function(r) { if (dayMap[r.day] !== undefined) dayScores[dayMap[r.day]] = (dayScores[dayMap[r.day]]||0) + 1; });

      var cells = [];
      for (var i = 0; i < 35; i++) {
        var dayIdx = i % 7;
        var weekNum = Math.floor(i / 7);
        var dayNum = weekNum * 7 + dayIdx + 1;
        var score = dayScores[dayIdx] || 0;
        var topic = topics[i % Math.max(topics.length, 1)];
        var isWeekend = dayIdx >= 5;
        var intensity = Math.min(score, 5);

        var bg, border, glow;
        if (intensity >= 4) {
          bg = 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(245,158,11,0.12))';
          border = '1px solid rgba(239,68,68,0.5)';
          glow = 'box-shadow: 0 0 12px rgba(239,68,68,0.2);';
        } else if (intensity >= 3) {
          bg = 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.08))';
          border = '1px solid rgba(245,158,11,0.4)';
          glow = 'box-shadow: 0 0 8px rgba(245,158,11,0.15);';
        } else if (intensity >= 2) {
          bg = 'rgba(16,185,129,0.08)';
          border = '1px solid rgba(16,185,129,0.3)';
          glow = '';
        } else {
          bg = 'rgba(255,255,255,0.03)';
          border = '1px solid rgba(255,255,255,0.08)';
          glow = '';
        }

        var titleColor = intensity >= 4 ? '#fbbf24' : intensity >= 3 ? '#fcd34d' : '#9ca3af';
        var timeBadge = '';
        if (intensity >= 4) {
          timeBadge = '<div style="margin-top:6px;padding:2px 6px;background:rgba(239,68,68,0.3);border-radius:4px;font-size:10px;color:#fca5a5;display:inline-block;">🔥 ' + bestTime + '</div>';
        } else if (intensity >= 3) {
          timeBadge = '<div style="margin-top:6px;padding:2px 6px;background:rgba(245,158,11,0.25);border-radius:4px;font-size:10px;color:#fde68a;display:inline-block;">⭐ ' + bestTime + '</div>';
        }

        var topicHtml = '';
        if (intensity >= 2 && topic && topic.title) {
          topicHtml = '<div style="color:' + titleColor + ';line-height:1.4;font-size:11px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + topic.title.slice(0,12) + '</div>';
        }

        cells.push(
          '<div style="min-height:80px;padding:10px;border-radius:10px;background:' + bg + ';border:' + border + ';' + glow + 'font-size:11px;overflow:hidden;transition:all 0.3s;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
              '<span style="font-weight:700;color:' + (isWeekend?'#fbbf24':'#e5e7eb') + ';font-size:13px;">' + dayNum + '</span>' +
              (intensity >= 4 ? '<span style="width:6px;height:6px;border-radius:50%;background:#ef4444;"></span>' : '') +
            '</div>' +
            topicHtml +
            timeBadge +
          '</div>'
        );
      }
      grid.innerHTML = cells.join('');
      console.log('[Calendar] Rendered', cells.length, 'days');
    } catch(e) { 
      console.warn('[Calendar] Error:', e.message); 
    }
  }

  // 注册到全局
  if (typeof window.registerModule === 'function') {
    window.registerModule('renderBestPostingCombo', renderBestPostingCombo);
    window.registerModule('renderPostingReminder', renderPostingReminder);
    window.registerModule('renderContentCalendar', renderContentCalendar);
  }
})();
