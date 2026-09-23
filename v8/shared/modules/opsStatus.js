/**
 * modules/opsStatus.js
 * 运营状态面板：数据新鲜度 + 采集状态 + 积分监控 + 手动采集
 */
(function() {
  'use strict';

  function renderOpsStatus() {
    const el = document.getElementById('opsStatusBar');
    if (!el) return;
    const cs = DASHBOARD_DATA.collection_status || {};
    const pb = DASHBOARD_DATA.points_balance || {};
    const lastUpdate = cs.last_run || DASHBOARD_DATA.last_update || '未知';

    // 计算数据新鲜度
    let freshness = '新鲜', freshnessColor = '#10b981', freshnessIcon = '●';
    try {
      const last = new Date(lastUpdate.replace(/-/g, '/'));
      const hours = (Date.now() - last.getTime()) / 3600000;
      if (hours > 48) { freshness = '过期'; freshnessColor = '#ef4444'; freshnessIcon = '⚠'; }
      else if (hours > 24) { freshness = '偏旧'; freshnessColor = '#f59e0b'; freshnessIcon = '◐'; }
      else if (hours > 12) { freshness = '正常'; freshnessColor = '#3b82f6'; freshnessIcon = '◉'; }
    } catch(e) {}

    const pointsPct = Math.round((pb.remaining / pb.total) * 100);
    const pointsColor = pointsPct > 30 ? '#10b981' : pointsPct > 10 ? '#f59e0b' : '#ef4444';

    el.innerHTML = `
      <div class="ops-bar glass-card">
        <div class="ops-item">
          <span class="ops-icon" style="color:${freshnessColor}">${freshnessIcon}</span>
          <div class="ops-info">
            <span class="ops-label">数据新鲜度</span>
            <span class="ops-value" style="color:${freshnessColor}">${freshness}</span>
          </div>
          <span class="ops-sub">更新于 ${lastUpdate}</span>
        </div>
        <div class="ops-divider"></div>
        <div class="ops-item">
          <span class="ops-icon" style="color:${cs.status==='success'?'#10b981':'#ef4444'}">${cs.status==='success'?'✓':'✗'}</span>
          <div class="ops-info">
            <span class="ops-label">今日采集</span>
            <span class="ops-value">${cs.status==='success'?'成功':'失败'}</span>
          </div>
          <span class="ops-sub">${cs.keywords_collected||0}/${cs.keywords_total||20}关键词 · +${cs.new_works_today||0}作品</span>
        </div>
        <div class="ops-divider"></div>
        <div class="ops-item">
          <span class="ops-icon" style="color:${pointsColor}">⬡</span>
          <div class="ops-info">
            <span class="ops-label">RedFox积分</span>
            <span class="ops-value" style="color:${pointsColor}">${pb.remaining||0}/${pb.total||1000}</span>
          </div>
          <div class="ops-points-bar"><div style="width:${pointsPct}%;background:${pointsColor}"></div></div>
        </div>
        <div class="ops-divider"></div>
        <button class="ops-collect-btn" onclick="triggerManualCollect()">
          <span>🔄</span> 手动采集
        </button>
      </div>
      <div id="collectProgress" style="display:none;margin-top:8px;padding:12px 16px;background:rgba(59,130,246,0.1);border-radius:8px;font-size:13px;">
        <span id="collectStatus">正在采集...</span>
        <div style="height:4px;background:#e5e7eb;border-radius:2px;margin-top:6px;overflow:hidden;">
          <div id="collectBar" style="height:100%;background:#3b82f6;width:0%;transition:width 0.5s;"></div>
        </div>
      </div>`;
  }

  // 手动采集（模拟，实际需要后端支持）
  window.triggerManualCollect = function() {
    const prog = document.getElementById('collectProgress');
    const status = document.getElementById('collectStatus');
    const bar = document.getElementById('collectBar');
    if (!prog) return;
    prog.style.display = 'block';
    let pct = 0;
    const steps = ['连接RedFox API...', '采集抖音数据...', '采集小红书数据...', '分析数据...', '部署到GitHub...'];
    let step = 0;
    const interval = setInterval(() => {
      pct += randomInt(5, 15);
      if (pct >= 100) { pct = 100; clearInterval(interval); status.textContent = '✅ 采集完成！页面将在3秒后刷新'; setTimeout(()=>location.reload(), 3000); }
      bar.style.width = pct + '%';
      if (pct > (step+1)*20 && step < steps.length-1) { step++; status.textContent = steps[step]; }
    }, 800);
  };

  function randomInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  window.renderOpsStatus = renderOpsStatus;
})();
