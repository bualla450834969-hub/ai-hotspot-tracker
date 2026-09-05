/**
 * modules/credit.js
 * 函数: renderCreditMonitor
 * 依赖: 无
 */
(function() {
  'use strict';

  // renderCreditMonitor
  function renderCreditMonitor() {
    // 估算：每天约13次API调用，每次0.4积分 = 每天5.2积分
    var dailyCost = 5.2;
    var today = new Date();
    var dayOfMonth = today.getDate();
    var estimatedMonthly = dailyCost * 30;
    var usedSoFar = dailyCost * dayOfMonth;
    var pct = Math.min(usedSoFar / 1000 * 100, 100);
    var html = '<span>💰 积分</span>';
    html += '<div class="cm-bar"><div class="cm-fill" style="width:' + pct + '%"></div></div>';
    html += '<span>已用' + Math.round(usedSoFar) + '/1000</span>';
    // 插入到hero区域或导航栏
    var heroStats = document.querySelector('.hero-stats');
    if (heroStats && !document.getElementById('creditMonitor') && heroStats.parentNode) {
      var monitor = document.createElement('div');
      monitor.id = 'creditMonitor';
      monitor.className = 'credit-monitor';
      monitor.innerHTML = html;
      heroStats.parentNode.insertBefore(monitor, heroStats.nextSibling);
    }
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "credit",
      requiredFields: [],
      render: function(data) {
        try { renderCreditMonitor(data); } catch(e) { console.error("[credit]", e); }
      }
    });
  }
  window.renderCreditMonitor = renderCreditMonitor;
})();
