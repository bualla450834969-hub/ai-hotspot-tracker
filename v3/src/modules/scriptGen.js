/**
 * modules/scriptGen.js
 * 函数: generateScript, closeScriptModal, copyScript
 * 依赖: 无
 */
(function() {
  'use strict';

  // generateScript
  function generateScript(title) {
    const topic = DATA.topics.find(function(t) { return t.title === title; });
    if (!topic) return;
    const persona = topic.target_persona || {};
    const needs = (persona.needs || []).slice(0, 2).join('、');
    const script = {
      opening: '【0-3秒】' + topic.hook + '\n画面：数字人正面出镜，背景用AI生成的' + topic.keyword + '相关场景\n字幕：大字突出关键词',
      body: '【3-30秒】核心内容\n1. 痛点引入：' + (needs ? '你是不是也在为"' + needs + '"发愁？' : '很多人不知道这个技巧') + '\n2. 方法拆解：分3步讲清楚' + topic.keyword + '的核心用法\n3. 案例展示：用AI生成的实际效果画面佐证\n画面：数字人口播+AI素材混剪，每5秒切一次画面',
      cta: '【最后5秒】引导行动\n"关注我，每天分享一个AI实用技巧"\n"评论区扣1，发你完整工具包"\n画面：数字人指向关注按钮+账号二维码',
      subtitles: '字幕要点：' + topic.keyword + '、' + (needs || '实用技巧') + '、关注领取\nBGM：轻快科技感纯音乐，音量-15db',
      seo: '标签：#AI #' + topic.keyword.replace(/\s/g, '') + ' #AI工具 #干货分享\n发布时间：' + (persona.active_time || '19:00-21:00')
    };
    const modal = document.getElementById('scriptModal');
    document.getElementById('scriptModalTitle').textContent = '脚本：' + topic.title.slice(0, 20);
    document.getElementById('scriptModalContent').innerHTML =
      '<div class="script-section"><div class="script-section-label">钩子标题</div><div class="script-section-content">' + topic.hook + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">开头（0-3秒）</div><div class="script-section-content">' + script.opening + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">正文（3-30秒）</div><div class="script-section-content">' + script.body + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">结尾CTA</div><div class="script-section-content">' + script.cta + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">字幕/BGM</div><div class="script-section-content">' + script.subtitles + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">标签/发布</div><div class="script-section-content">' + script.seo + '</div></div>';
    modal.classList.add('active');
    window._currentScript = '【钩子】' + topic.hook + '\n\n【开头】' + script.opening + '\n\n【正文】' + script.body + '\n\n【结尾】' + script.cta + '\n\n【字幕/BGM】' + script.subtitles + '\n\n【标签/发布】' + script.seo;
  }

  // closeScriptModal
  function closeScriptModal() {
    document.getElementById('scriptModal').classList.remove('active');
  }

  // copyScript
  function copyScript(el) {
    var text = el.previousElementSibling.textContent;
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    el.textContent = '✅ 已复制';
    setTimeout(function(){ el.textContent = '📋 复制话术'; }, 2000);
  }

  window.generateScript = generateScript;
  window.closeScriptModal = closeScriptModal;
  window.copyScript = copyScript;
})();
