/**
 * modules/leadScripts.js
 * 函数: renderLeadScripts
 * 依赖: 无
 */
(function() {
  'use strict';

  // renderLeadScripts
  function renderLeadScripts() {
    var scripts = cfg('lead_scripts_detail', []);
    var html = scripts.map(function(s) {
      return '<div class="script-card"><div class="sc-target">' + s.target + '</div><div class="sc-text">' + s.text + '</div><span class="sc-copy" onclick="copyScript(this)">📋 复制话术</span></div>';
    }).join('');
    var sc = document.getElementById('scriptContainer'); if (sc) sc.innerHTML = html;
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "leadScripts",
      requiredFields: [],
      render: function(data) {
        try { renderLeadScripts(data); } catch(e) { console.error("[leadScripts]", e); }
      }
    });
  }
  window.renderLeadScripts = renderLeadScripts;
})();
