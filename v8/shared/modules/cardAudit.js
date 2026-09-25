/* ===== modules/cardAudit.js（自动化卡片体检助手 · 正式模块）=====
 * runCardAudit   检测当前 DOM 所有 .section（空内容/undefined/NaN/暂无数据/占位符/代码泄漏）
 * runFullAudit   全程逐页巡检 + 自动重渲染修复（换行业后自动跑）
 * scheduleAutoAudit  等待滚过启动页、侧边栏就绪后自动体检
 */
(function(){
  'use strict';

  // ---------- 核心检测（基于 DOM，不依赖可见性）----------
  function runCardAudit() {
    var sections = document.querySelectorAll('.section');
    var problems = [];
    var stats = { total:0, visible:0, hidden:0, ok:0, failed:0 };
    sections.forEach(function(sec, idx){
      var titleEl = sec.querySelector('.section-title');
      var title = titleEl ? titleEl.textContent.trim() : '(无标题)';
      var style = window.getComputedStyle(sec);
      var isVisible = style.display !== 'none' && style.visibility !== 'hidden';
      stats.total++; if (isVisible) stats.visible++; else stats.hidden++;

      var bodyText='', contentNodes=0, hasCanvas=false, hasSvg=false, hasTable=false, hasForm=false;
      Array.from(sec.children).forEach(function(child){
        if (!child.classList.contains('section-header')) {
          var t = child.textContent.trim();
          if (t) bodyText += t+' ';
          if (child.children.length>0 || t.length>0) contentNodes++;
          if (child.querySelector('canvas')) hasCanvas=true;
          if (child.querySelector('svg')) hasSvg=true;
          if (child.querySelector('table')) hasTable=true;
          if (child.querySelector('input,button,textarea,select')) hasForm=true;
        }
      });
      bodyText = bodyText.trim();
      var hasRenderedContent = contentNodes>0 || hasCanvas || hasSvg;
      var issues=[];
      if (!hasRenderedContent) issues.push('无内容');
      var uc = (bodyText.match(/undefined/g)||[]).length; if (uc>0) issues.push('含undefined×'+uc);
      var ncn = (bodyText.match(/NaN/g)||[]).length; if (ncn>0) issues.push('含NaN×'+ncn);
      if (bodyText.indexOf('暂无数据')>=0) issues.push('显示暂无数据');
      if (!hasCanvas && !hasTable && !hasForm) {
        var meaningful = bodyText.replace(/[-–—\s0-9.%:：]/g,'');
        if (meaningful.length<5 && bodyText.length<40 && contentNodes>0) issues.push('占位符无数据');
      }
      if (bodyText.indexOf('function')>=0 || /setTimeout|querySelector/.test(bodyText)) {
        if (bodyText.length<400) issues.push('代码泄漏');
      }
      if (issues.length>0) {
        stats.failed++;
        problems.push({idx:idx, title:title, visible:isVisible, issues:issues, preview:bodyText.substring(0,50)});
      } else stats.ok++;
    });
    return { stats:stats, problems:problems };
  }

  // ---------- 工具 ----------
  function delay(ms){ return new Promise(function(res){ setTimeout(res,ms); }); }
  function getPages(){
    return Array.from(document.querySelectorAll('.sidebar-nav-item')).map(function(it){
      return { page:it.dataset.page, label:it.textContent.trim() };
    });
  }

  // ---------- 体检浮层 ----------
  var toastEl=null;
  function ensureToast(){
    if (toastEl && document.getElementById('auditToast')) return toastEl;
    toastEl = document.createElement('div');
    toastEl.id='auditToast';
    toastEl.style.cssText='position:fixed;right:20px;bottom:20px;z-index:9999;min-width:260px;max-width:340px;padding:14px 16px;border-radius:14px;background:rgba(20,22,32,0.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.12);box-shadow:0 12px 40px rgba(0,0,0,0.45);font-size:12px;color:#e8ecf4;line-height:1.6;transition:opacity .3s,transform .3s;';
    document.body.appendChild(toastEl);
    return toastEl;
  }
  function toast(html){ ensureToast().innerHTML=html; toastEl.style.opacity='1'; toastEl.style.transform='translateY(0)'; }
  function dismissToast(ms){
    setTimeout(function(){
      if(toastEl){ toastEl.style.opacity='0'; toastEl.style.transform='translateY(10px)';
        setTimeout(function(){ if(toastEl&&toastEl.parentNode) toastEl.parentNode.removeChild(toastEl); toastEl=null; },350); }
    }, ms);
  }

  // 扫描单个页面（切换→等待→检测，只收可见问题）
  function scanPage(page, label, wait){
    if (typeof window.switchPage==='function') window.switchPage(page);
    return delay(wait||520).then(function(){
      var r = runCardAudit();
      return r.problems.filter(function(p){ return p.visible; }).map(function(p){
        return { page:page, label:label, title:p.title, issues:p.issues, preview:p.preview };
      });
    });
  }

  // ---------- 全程巡检 ----------
  function runFullAudit(opts){
    opts = opts||{};
    var maxPasses = opts.maxPasses!=null ? opts.maxPasses : 2;
    if (window.__auditRunning) { console.log('[Audit] 已有体检进行中'); return Promise.resolve(window.__auditLast); }
    window.__auditRunning=true;

    var pages = getPages();
    var activeEl = document.querySelector('.sidebar-nav-item.active');
    var startPage = activeEl ? activeEl.dataset.page : 'overview';

    toast('<div style="font-weight:600;margin-bottom:6px;">🔍 工作台体检中…</div><div style="color:#9aa4b8;">准备中</div>');

    var chain = Promise.resolve([]);
    pages.forEach(function(pg, i){
      chain = chain.then(function(acc){
        toast('<div style="font-weight:600;margin-bottom:6px;">🔍 工作台体检中 ('+(i+1)+'/'+pages.length+')</div><div style="color:#9aa4b8;">'+pg.label+'</div>');
        return scanPage(pg.page, pg.label, 520).then(function(probs){ return acc.concat(probs); });
      });
    });

    return chain.then(function(all){
      // 自动修复轮：重渲染后复检
      var pass=0;
      function repairRound(cur){
        if (cur.length===0 || pass>=maxPasses) return Promise.resolve(cur);
        pass++;
        console.warn('[Audit] 第'+pass+'轮发现 '+cur.length+' 个问题，重渲染修复…', cur);
        try { if (typeof window.renderAll==='function') window.renderAll(); } catch(e){ console.error('[Audit] renderAll',e); }
        return delay(700).then(function(){
          var rc = Promise.resolve([]);
          pages.forEach(function(pg, j){
            rc = rc.then(function(acc){
              toast('<div style="font-weight:600;margin-bottom:6px;">🔧 修复复检 ('+(j+1)+'/'+pages.length+')</div><div style="color:#9aa4b8;">'+pg.label+'</div>');
              return scanPage(pg.page, pg.label, 620).then(function(probs){ return acc.concat(probs); });
            });
          });
          return rc.then(function(re){ return repairRound(re); });
        });
      }
      return repairRound(all).then(function(finalProbs){ return {finalProbs:finalProbs, pass:pass}; });
    }).then(function(res){
      var all = res.finalProbs, pass = res.pass;
      if (typeof window.switchPage==='function') window.switchPage(startPage||'overview');
      window.__auditRunning=false;
      window.__auditLast={ pages:pages.length, problems:all, repairedPasses:pass };
      console.log('[Audit] 体检完成：'+pages.length+'页，问题 '+all.length+'个', window.__auditLast);

      if (all.length===0){
        toast('<div style="font-weight:600;color:#34d399;">✅ 体检通过</div><div style="color:#9aa4b8;margin-top:4px;">'+pages.length+' 个板块全部正常</div>');
        dismissToast(3500);
      } else {
        var rows = all.slice(0,8).map(function(p){
          return '<div style="margin-top:4px;"><span style="color:#fbbf24;">['+p.label+']</span> '+p.title.slice(0,18)+' <span style="color:#f87171;">'+p.issues.join(',')+'</span></div>';
        }).join('');
        var more = all.length>8 ? '<div style="color:#9aa4b8;margin-top:4px;">…其余 '+(all.length-8)+' 项见控制台</div>' : '';
        toast('<div style="font-weight:600;color:#fbbf24;">⚠️ 体检完成，'+all.length+' 项待处理</div><div style="margin-top:4px;color:#9aa4b8;">多为数据缺失，需重新采集；详情见控制台</div>'+rows+more);
      }

      var sr = document.getElementById('manualAuditResult');
      if (sr){
        if (all.length===0) sr.innerHTML='<span style="color:#34d399;">✅ '+pages.length+' 个板块全部正常</span>';
        else sr.innerHTML='<span style="color:#fbbf24;">⚠️ '+all.length+' 项待处理：</span>'+all.map(function(p){
          return '<div style="margin-top:3px;">['+p.label+'] '+p.title.slice(0,16)+' '+p.issues.join(',')+'</div>';
        }).join('');
      }
      return window.__auditLast;
    });
  }

  window.runCardAudit=runCardAudit;
  window.runFullAudit=runFullAudit;
  console.log('[Audit] 卡片体检助手已固化（runFullAudit）');
})();
