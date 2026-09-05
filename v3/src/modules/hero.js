/**
 * modules/hero.js
 * 函数: renderHeroStats, renderActions, renderInsights
 * 依赖: ['hotwords', 'works', 'topics']
 */
(function() {
  'use strict';

  // renderHeroStats
  function renderHeroStats(hw, works, topics) {
    const totalLikes = works.reduce((s,w)=>s+(w.likeCount||0),0);
    const surging = hw.filter(h=>h.trend==='飙升'||h.trend==='新热').length;
    const topSurging = hw.filter(h=>h.trend==='飙升').sort((a,b)=>b.total-a.total)[0];
    document.getElementById('heroStats').innerHTML = `
      <div class="hero-stat">
        <div class="hs-label">${topSurging?'今日飙升热词':'追踪关键词'}</div>
        <div class="hs-value" id="heroMainVal">${topSurging?topSurging.keyword:hw.length}</div>
        <div class="hs-sub">${topSurging?topSurging.total.toLocaleString()+' 条作品 · '+topSurging.category:new Set(hw.map(h=>h.category)).size+' 个细分赛道'}</div>
        ${surging>0?`<span class="hs-trend up">▲ ${surging} 个热词异动</span>`:`<span class="hs-trend flat">— 市场平稳</span>`}
      </div>
      <div class="hero-stat">
        <div class="hs-label">采集作品</div>
        <div class="hs-value green" id="heroWorksVal">${works.length}</div>
        <div class="hs-sub">总点赞 ${(totalLikes/10000).toFixed(1)} 万</div>
      </div>
      <div class="hero-stat">
        <div class="hs-label">飙升 / 新热</div>
        <div class="hs-value red" id="heroSurgingVal">${surging}</div>
        <div class="hs-sub">飙升 ${hw.filter(h=>h.trend==='飙升').length} · 新热 ${hw.filter(h=>h.trend==='新热').length}</div>
      </div>
      <div class="hero-stat">
        <div class="hs-label">选题建议</div>
        <div class="hs-value orange" id="heroTopicsVal">${topics.length}</div>
        <div class="hs-sub">标题 + 钩子 + 形式</div><span class="export-btn" onclick="exportTopics()" style="margin-left:12px;">📋 导出选题</span>
      </div>`;
    setTimeout(()=>{
      animateNumber(document.getElementById('heroWorksVal'), works.length);
      animateNumber(document.getElementById('heroSurgingVal'), surging);
      animateNumber(document.getElementById('heroTopicsVal'), topics.length);
    }, 300);
  }

  // renderActions
  function renderActions() {
    const actions = DATA.daily_actions || [];
    const el = document.getElementById('actionList');
    if (!actions.length) { el.innerHTML='<div class="empty-state">暂无行动建议</div>'; return; }
    el.innerHTML = actions.map(a => `
      <div class="action-item ${a.priority==='高'?'':a.priority==='中'?'medium':'low'}">
        <div class="action-icon">${a.priority==='高'?'▲':a.priority==='中'?'●':'○'}</div>
        <div class="action-content">
          <span class="action-type">${a.type}</span>
          <div class="action-text">${a.content}</div>
          ${a.detail?`<div class="action-detail">${a.detail}</div>`:''}
        </div>
      </div>`).join('');
  }

  // renderInsights
  function renderInsights(hw, works) {
    const ins = [];
    const topWork = [...works].sort((a,b)=>(b.likeCount||0)-(a.likeCount||0))[0];
    if (topWork) ins.push({type:'hot',text:`单条最高赞 <b>${(topWork.likeCount/10000).toFixed(1)}万</b> — 「${(topWork.title||'').slice(0,16)}…」· ${topWork._keyword}`});
    const topCollect = [...hw].sort((a,b)=>(b.collect_rate||0)-(a.collect_rate||0))[0];
    if (topCollect && topCollect.collect_rate>0) ins.push({type:'value',text:`收藏率最高 <b>${topCollect.keyword}</b>（${topCollect.collect_rate}%），适合做教程型内容`});
    const blueOcean = hw.filter(h=>h.total<1000&&h.max_like>10000).sort((a,b)=>b.max_like-a.max_like)[0];
    if (blueOcean) ins.push({type:'value',text:`蓝海机会 <b>${blueOcean.keyword}</b> 仅${blueOcean.total}条但最高赞${blueOcean.max_like.toLocaleString()}，优先切入`});
    const surging = hw.filter(h=>h.trend==='飙升');
    if (surging.length) ins.push({type:'hot',text:`飙升热词 ${surging.slice(0,3).map(h=>h.keyword).join(' / ')}`});
    const pt = DATA.publish_time_dist||[];
    const bestHour = pt.sort((a,b)=>b.count-a.count)[0];
    if (bestHour && bestHour.count>0) ins.push({type:'warn',text:`最佳发布时段 <b>${bestHour.hour}:00</b>（占比${bestHour.pct}%）`});
    const sat = DATA.saturation || [];
    const lowestSat = sat[0];
    if (lowestSat && lowestSat.saturation < 50) ins.push({type:'value',text:`最低饱和度 <b>${lowestSat.keyword}</b>（${lowestSat.saturation}）· ${lowestSat.stage}`});
    document.getElementById('insightsGrid').innerHTML = ins.slice(0,6).map(i=>`<div class="insight-item ${i.type}">${i.text}</div>`).join('');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "hero",
      requiredFields: ['hotwords', 'works', 'topics'],
      render: function(data) {
        try { renderHeroStats(data.hotwords, data.works, data.topics); renderActions(data); renderInsights(data); } catch(e) { console.error("[hero]", e); }
      }
    });
  }
})();
