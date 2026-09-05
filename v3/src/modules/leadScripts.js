/**
 * modules/leadScripts.js
 * 函数: renderLeadScripts
 * 依赖: 无
 */
(function() {
  'use strict';

  // renderLeadScripts
  function renderLeadScripts() {
    var scripts = [
      { target: '🎯 技术极客（65.9%）', text: '评论区扣"1"，我把这套AI工作流的完整配置和提示词打包发你，都是自己实测过的，直接能用。' },
      { target: '🎨 视觉创作者（9.8%）', text: '想要这套AI出图的完整提示词和参数设置吗？评论区告诉我你用的是什么工具，我针对性发你。' },
      { target: '👀 泛AI关注者（22.5%）', text: '刚整理了一份《AI工具避坑指南》，把我花了几万块踩过的坑都写进去了，评论区"避坑"我发你。' },
      { target: '💼 职场效率人群', text: '这套AI工作流我自己用了半年，每天省2小时。想要的评论区"效率"，我把模板和教程一起发你。' },
      { target: '🚀 创业者/副业人群', text: '用AI做副业第一个月赚了XX，把完整的工具链和操作流程整理好了，评论区"副业"发你完整版。' },
    ];
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
})();
