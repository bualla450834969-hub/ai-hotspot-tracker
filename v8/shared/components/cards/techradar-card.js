/**
 * components/cards/techradar-card.js
 * 技术雷达卡片组件 - 新架构版本
 */
(function() {
  'use strict';

  function renderTechRadar() {
    const signals = window.DataLoader.getTechSignals();
    if (!signals || signals.length === 0) {
      const el = document.getElementById('techRadar');
      if (el) el.innerHTML = '<div class="card"><div style="padding:40px;text-align:center;color:var(--text-secondary)">技术雷达数据加载中...</div></div>';
      return;
    }

    // 按增长速度排序
    const sorted = [...signals].sort((a, b) => (b.growth_rate || 0) - (a.growth_rate || 0));
    
    const el = document.getElementById('techRadar');
    if (!el) return;

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>📡 技术雷达</h3>
          <span class="card-subtitle">GitHub 星标增长最快技术</span>
        </div>
        <div class="techradar-list">
          ${sorted.slice(0, 10).map((s, i) => `
            <div class="techradar-item">
              <div class="tr-rank">${i + 1}</div>
              <div class="tr-info">
                <div class="tr-name">${s.name}</div>
                <div class="tr-desc">${s.description || ''}</div>
              </div>
              <div class="tr-stats">
                <div class="tr-stat">
                  <span class="tr-value">${(s.stars || 0).toLocaleString()}</span>
                  <span class="tr-label">星标</span>
                </div>
                <div class="tr-stat">
                  <span class="tr-value ${s.growth_rate > 0 ? 'positive' : 'negative'}">
                    ${s.growth_rate > 0 ? '+' : ''}${s.growth_rate || 0}%
                  </span>
                  <span class="tr-label">周增长</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function render() {
    window.ErrorHandler.safeExecute(() => {
      renderTechRadar();
    }, '技术雷达');
  }

  window.renderTechRadarCard = render;
})();
