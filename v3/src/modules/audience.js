/**
 * modules/audience.js
 * 函数: renderAudience
 * 依赖: ['audience_personas']
 */
(function() {
  'use strict';

  // renderAudience
  function renderAudience() {
    const personas = DATA.audience_personas || [];
    if (!personas.length) {
      document.getElementById('personaGrid').innerHTML = '<p style="color:var(--text-secondary)">暂无人群画像数据</p>';
      return;
    }
  
    // 分布柱状图
    const chartDom = document.getElementById('audienceChart');
    if (chartDom && typeof echarts !== 'undefined') {
      const chart = echarts.init(chartDom);
      chart.setOption({
        grid: { left: 80, right: 20, top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#9ca3af', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        yAxis: { type: 'category', data: personas.map(p => p.name).reverse(), axisLabel: { color: '#d1d5db', fontSize: 12 } },
        series: [{
          type: 'bar',
          data: personas.map(p => Math.max(p.proportion, 0.5)).reverse(),
          itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#8b5cf6'},{offset:1,color:'#ec4899'}]), borderRadius: [0,4,4,0] },
          barWidth: 16,
          label: { show: true, position: 'right', color: '#c4b5fd', fontSize: 11, formatter: '{c}%' }
        }]
      });
    }
  
    // 画像卡片
    const grid = document.getElementById('personaGrid');
    grid.innerHTML = personas.map(p => `
      <div class="persona-card">
        <div class="persona-name">${p.name}</div>
        <div class="persona-cat">${p.category} · 占比 ${Math.max(p.proportion,0.1)}%</div>
        <div class="persona-meta">
          <span>${p.age}</span>
          <span>${p.gender}</span>
        </div>
        <div class="persona-tags">
          ${(p.traits||[]).map(t => '<span class="persona-tag">'+t+'</span>').join('')}
        </div>
        <div class="persona-section">
          <div class="persona-label">核心需求</div>
          <div class="persona-needs">
            ${(p.needs||[]).map(n => '<span class="need-tag">'+n+'</span>').join('')}
          </div>
        </div>
        <div class="persona-section">
          <div class="persona-label">内容偏好</div>
          <div class="persona-value">${p.content_pref}</div>
        </div>
        <div class="persona-section">
          <div class="persona-label">活跃时间</div>
          <div class="persona-value">${p.active_time}</div>
        </div>
        <div class="persona-section">
          <div class="persona-label">变现方式</div>
          <div class="persona-value" style="color:#c4b5fd">${p.monetization}</div>
        </div>
        <div class="persona-section">
          <div class="persona-label">痛点</div>
          <div class="persona-needs">
            ${(p.pain_points||[]).map(pp => '<span class="pain-tag">'+pp+'</span>').join('')}
          </div>
        </div>
        <div class="persona-bar"><div class="persona-bar-fill" style="width:${Math.min(Math.max(p.proportion,1),100)}%"></div></div>
      </div>
    `).join('');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "audience",
      requiredFields: ['audience_personas'],
      render: function(data) {
        try { renderAudience(data); } catch(e) { console.error("[audience]", e); }
      }
    });
  }
})();
