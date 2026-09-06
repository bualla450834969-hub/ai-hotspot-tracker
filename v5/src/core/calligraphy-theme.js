/**
 * calligraphy-theme.js — 书法主题ECharts配色覆盖
 * 在globals.js之后、模块渲染之前加载
 * 覆盖全局颜色常量为深色宣纸风格
 */
(function() {
  'use strict';

  // ===== 覆盖全局ECharts配色 =====
  // 调色板：墨黑、朱砂红、赭石金、青黛、竹绿、紫檀
  window.PALETTE = [
    '#8b0000', // 朱砂红
    '#2c5f7c', // 青黛蓝
    '#b8860b', // 赭石金
    '#3d6b4f', // 竹绿
    '#6b4423', // 紫檀褐
    '#a0522d', // 赭色
    '#4a4a4a', // 墨灰
    '#8b4513', //  saddle brown
    '#556b2f', // 橄榄绿
    '#704214'  //  sepia
  ];

  // Tooltip - 宣纸底深墨字
  window.TOOLTIP_BG = 'rgba(255, 252, 245, 0.96)';
  window.TOOLTIP_BORDER = 'rgba(139, 90, 43, 0.3)';
  window.TOOLTIP_TEXT = '#2c2416';

  // 坐标轴 - 深褐色
  window.AXIS_COLOR = 'rgba(60, 45, 30, 0.65)';
  window.AXIS_LINE = 'rgba(139, 90, 43, 0.25)';
  window.SPLIT_COLOR = 'rgba(139, 90, 43, 0.08)';

  // ===== 图表渲染后统一修正文字颜色 =====
  // 处理模块中硬编码的白色文字
  function fixChartTextColors() {
    if (!window.charts) return;
    var darkText = 'rgba(60, 45, 30, 0.75)';
    var darkTextStrong = 'rgba(44, 36, 22, 0.9)';
    var darkAxisLine = 'rgba(139, 90, 43, 0.25)';
    var darkSplit = 'rgba(139, 90, 43, 0.08)';

    Object.keys(window.charts).forEach(function(key) {
      var chart = window.charts[key];
      if (!chart || typeof chart.setOption !== 'function') return;
      try {
        chart.setOption({
          textStyle: { color: darkText },
          title: { textStyle: { color: darkTextStrong } },
          legend: { textStyle: { color: darkText } },
          tooltip: {
            backgroundColor: 'rgba(255, 252, 245, 0.96)',
            borderColor: 'rgba(139, 90, 43, 0.3)',
            textStyle: { color: '#2c2416' }
          },
          xAxis: {
            axisLabel: { color: darkText },
            axisLine: { lineStyle: { color: darkAxisLine } },
            splitLine: { lineStyle: { color: darkSplit } },
            nameTextStyle: { color: darkText }
          },
          yAxis: {
            axisLabel: { color: darkText },
            axisLine: { lineStyle: { color: darkAxisLine } },
            splitLine: { lineStyle: { color: darkSplit } },
            nameTextStyle: { color: darkText }
          },
          series: [{
            label: { color: darkTextStrong },
            itemStyle: { borderColor: 'rgba(240, 232, 213, 0.6)' }
          }]
        });
      } catch(e) {
        // 忽略单个图表的修正错误
      }
    });
  }

  // 延迟执行，等待所有图表初始化完成
  setTimeout(fixChartTextColors, 2000);
  setTimeout(fixChartTextColors, 4000);
  setTimeout(fixChartTextColors, 6000);

  // 暴露到全局供手动调用
  window.fixChartTextColors = fixChartTextColors;

})();
