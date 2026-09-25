/* ===== modules/leadScripts.js ===== */
/**
 * modules/leadScripts.js
 * 函数: renderLeadScripts
 * 依赖: 无
 */
(function() {
  'use strict';

  // renderLeadScripts（优先用数据 comment_scripts，无则中性空状态，不硬编码行业内容）
  function renderLeadScripts() {
    var sc = document.getElementById('scriptContainer'); if (!sc) return;
    var scripts = (DATA.comment_scripts && DATA.comment_scripts.length) ? DATA.comment_scripts : cfg('lead_scripts_detail', []);
    if (!scripts.length) {
      sc.innerHTML = '<div style="padding:28px;text-align:center;color:var(--text-secondary);font-size:13px;line-height:1.8;">💬 采集到评论区需求后<br>将自动生成针对性的私域引流话术</div>';
      return;
    }
    sc.innerHTML = scripts.map(function(s) {
      return '<div class="script-card"><div class="sc-target">' + (s.type || s.target || '引流话术') + '</div><div class="sc-text">' + (s.text || '') + '</div><span class="sc-copy" onclick="copyScript(this)">📋 复制话术</span></div>';
    }).join('');
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


