/**
 * modules/works.js
 * 函数: renderWorksTable, renderSmallViral, renderAuthors, renderCompetitorWorks, renderFormatDist, filteredWorks
 * 依赖: ['works']
 */
(function() {
  'use strict';

  // renderWorksTable
  function renderWorksTable(works) {
    const sorted=[...works].sort((a,b)=>(b.likeCount||0)-(a.likeCount||0)).slice(0,20);
    document.querySelector('#worksTable tbody').innerHTML=sorted.map((w,i)=>`
      <tr><td>${i+1}</td><td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a href="${w.workUrl||'#'}" target="_blank" class="work-link" title="${w.title||''}">${w.title||''}</a></td><td>${w.accountName||''}</td><td>${(w.followerCount||0).toLocaleString()}</td><td class="like-num">${(w.likeCount||0).toLocaleString()}</td><td class="collect-num">${(w.collectCount||0).toLocaleString()}</td><td class="share-num">${(w.shareCount||0).toLocaleString()}</td><td>${w._keyword||''}</td><td><span class="tag medium">${classifyHook(w.title||'')}</span></td></tr>`).join('');
  }

  // renderSmallViral
  function renderSmallViral(works) {
    const list = DATA.small_account_viral || [];
    const el = document.getElementById('smallViral');
    if (!list.length) { el.innerHTML='<div class="empty-state">暂无小账号爆款数据</div>'; return; }
    el.innerHTML = list.slice(0,6).map(w=>`
      <div class="small-item">
        <div class="si-info">
          <div class="si-title"><a href="${w.workUrl||'#'}" target="_blank" class="work-link">${(w.title||'无标题').slice(0,22)}</a></div>
          <div class="si-meta">${w.accountName||''} · 粉丝${(w.followerCount/10000).toFixed(1)}万 · ${w._keyword||''}</div>
        </div>
        <div class="si-likes">${(w.likeCount/10000).toFixed(1)}万</div>
      </div>`).join('');
  }

  // renderAuthors
  function renderAuthors(works) {
    const m={}; works.forEach(w=>{
      const n=w.accountName||'未知';
      if(!m[n])m[n]={name:n,followers:w.followerCount||0,likes:0,count:0,max:0,titles:[],keywords:{},platforms:{},accountType:w.accountType||'',formats:{},commentKw:{}};
      m[n].likes+=(w.likeCount||0);
      m[n].count++;
      const plat = w.platform||'dy';
      m[n].platforms[plat]=(m[n].platforms[plat]||0)+1;
      if(w.accountType) m[n].accountType=w.accountType;
      if((w.likeCount||0)>m[n].max)m[n].max=w.likeCount||0;
      if(w.title)m[n].titles.push(w.title);
      // 评论关键词
      if(w.commentTopKeywords && typeof w.commentTopKeywords === 'object') {
        Object.entries(w.commentTopKeywords).forEach(([k,v])=>{ m[n].commentKw[k]=(m[n].commentKw[k]||0)+(v||0); });
      }
    });
    // 提取内容主题关键词
    const themeKeywords = cfg('works.theme_keywords', ['可灵','即梦','绘画','视频','数字人','工作流','Agent','提示词','教程','实测','对比','免费','神器','效率','自动化','Sora','Midjourney','ComfyUI','Dify','Coze','豆包','GPT','Claude','剪映','PPT','电商','带货','变现','副业','编程','代码','写作','翻译','配音','音乐','图片','头像','壁纸','表情包','游戏','动漫','影视','解说','测评','盘点','干货','避坑','新手','入门','进阶','高阶','开源','GitHub','模型','大模型','LLM','RAG','微调','训练'];
    // 内容形式标签
    const formatKeywords = {'教程':['教程','手把手','入门','教学','怎么','如何','步骤'],'实测':['实测','体验','测试','对比','测评','横评'],'盘点':['盘点','排行','TOP','合集','汇总','清单'],'干货':['干货','技巧','方法','攻略','指南','避坑'],'资讯':['最新','发布','上线','更新','新闻','快讯'],'变现':['变现','赚钱','副业','带货','收入','盈利']};
    Object.values(m).forEach(a=>{
      a.titles.forEach(t=>{
        const tl = t.toLowerCase();
        themeKeywords.forEach(k=>{ if(tl.includes(k.toLowerCase()))a.keywords[k]=(a.keywords[k]||0)+1; });
        Object.entries(formatKeywords).forEach(([fmt, kws])=>{
          if(kws.some(k=>tl.includes(k))) a.formats[fmt]=(a.formats[fmt]||0)+1;
        });
      });
    });
    const top=Object.values(m).sort((a,b)=>b.likes-a.likes).slice(0,10);
    document.getElementById('authorList').innerHTML=top.map((a,i)=>{
      const avg=Math.round(a.likes/a.count);
      const themes=Object.entries(a.keywords).sort((x,y)=>y[1]-x[1]).slice(0,4).map(k=>k[0]);
      const formats=Object.entries(a.formats).sort((x,y)=>y[1]-x[1]).slice(0,2).map(f=>f[0]);
      const platDy = a.platforms['dy']||0;
      const platXhs = a.platforms['xhs']||0;
      const platLabel = platDy>0 && platXhs>0 ? '双平台' : platDy>0 ? '抖音' : '小红书';
      const platColor = platDy>0 && platXhs>0 ? '#a78bfa' : platDy>0 ? '#60a5fa' : '#f472b6';
      const learnNote = avg > 50000 ? '高均赞：内容质量驱动，值得拆解爆款结构' : a.count > 10 ? '高频更新：量产策略，可学习选题节奏' : '单条爆款：钩子+选题精准，可复用其标题公式';
      const themeTags = themes.length ? themes.map(t=>'<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(139,92,246,0.15);color:#a78bfa;">'+t+'</span>').join('') : '<span style="font-size:10px;color:var(--text-tertiary);">综合AI内容</span>';
      const formatTags = formats.length ? formats.map(f=>'<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(52,211,153,0.15);color:#34d399;">'+f+'</span>').join('') : '';
      return `
      <div class="author-item" style="flex-direction:column;align-items:stretch;gap:6px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="author-rank ${i<3?'r'+(i+1):'other'}">${i+1}</div>
          <div class="author-info" style="flex:1;">
            <div class="author-name">${a.name}
              <span style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(251,191,36,0.15);color:#fbbf24;margin-left:6px;">${a.accountType||'未分类'}</span>
              <span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${platColor}22;color:${platColor};margin-left:4px;">${platLabel}</span>
            </div>
            <div class="author-followers">粉丝${(a.followers/10000).toFixed(1)}万 · ${a.count}条作品 · 均赞${(avg/10000).toFixed(1)}万</div>
          </div>
          <div class="author-likes">总赞${(a.likes/10000).toFixed(1)}万<div style="font-size:10px;opacity:.6;margin-top:2px;">最高${(a.max/10000).toFixed(1)}万</div></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;padding-left:36px;align-items:center;">
          <span style="font-size:10px;color:var(--text-tertiary);">内容标签：</span>${themeTags}
        </div>
        ${formatTags ? '<div style="display:flex;flex-wrap:wrap;gap:4px;padding-left:36px;align-items:center;"><span style="font-size:10px;color:var(--text-tertiary);">内容形式：</span>'+formatTags+'</div>' : ''}
        <div style="font-size:10px;color:#34d399;padding-left:36px;">💡 ${learnNote}</div>
      </div>`;
    }).join('');
  }

  // renderCompetitorWorks
  function renderCompetitorWorks() {
    var works = DATA.works || [];
    if (!works.length) return;
    // 按账号分组，取每个账号最新的1-2条
    var byAuthor = {};
    works.forEach(function(w) {
      var name = w.accountName || '未知';
      if (!byAuthor[name]) byAuthor[name] = [];
      byAuthor[name].push(w);
    });
    // 按总点赞排序取top5账号
    var authors = Object.entries(byAuthor).map(function(entry) {
      return { name: entry[0], works: entry[1], totalLikes: entry[1].reduce(function(s,w){return s+(w.likeCount||0);},0) };
    }).sort(function(a,b){return b.totalLikes-a.totalLikes;}).slice(0,5);

    var html = '<div style="margin-top:12px;">';
    html += '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;">📡 竞品最新作品（来自搜索数据）</div>';
    authors.forEach(function(a) {
      var topWorks = a.works.sort(function(x,y){return (y.likeCount||0)-(x.likeCount||0);}).slice(0,2);
      topWorks.forEach(function(w) {
        var title = (w.title || '无标题').slice(0,40);
        var likes = (w.likeCount||0).toLocaleString();
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">';
        html += '<div style="flex:1;min-width:0;"><div style="font-size:11px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + title + '</div>';
        html += '<div style="font-size:10px;color:var(--text-tertiary);">' + a.name + '</div></div>';
        html += '<div style="font-size:11px;color:#f87171;margin-left:8px;">❤' + likes + '</div>';
        html += '</div>';
      });
    });
    html += '</div>';
    var el = document.getElementById('competitorWorks');
    if (el) el.innerHTML = html;
  }

  // renderFormatDist
  function renderFormatDist() {
    const container = document.getElementById('formatBars');
    if (!container) return;
    const formats = DATA.content_formats_dist || [];
    if (!formats.length) { container.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#6b7280'];
    container.innerHTML = formats.map(function(f, i) {
      return '<div class="format-bar-row">' +
        '<span class="format-bar-label">' + f.format + '</span>' +
        '<div class="format-bar-track"><div class="format-bar-fill" style="width:' + Math.min(f.proportion * 2, 100) + '%;background:' + colors[i % colors.length] + '"></div></div>' +
        '<span class="format-bar-val">' + f.count + '条 · ' + f.proportion + '% · 均赞' + f.avg_likes.toLocaleString() + '</span>' +
        '</div>';
    }).join('');
  }

  // filteredWorks
  function filteredWorks() {
    const p = filterByPlatform(DATA.works||[]);
    if (currentCategory==='all') return p;
    const kws = new Set(filteredHotwords().map(h=>h.keyword));
    return p.filter(w=>kws.has(w._keyword));
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "works",
      requiredFields: ['works'],
      render: function(data) {
        try { renderWorksTable(data); renderSmallViral(data); renderAuthors(data); renderCompetitorWorks(data); renderFormatDist(data); } catch(e) { console.error("[works]", e); }
      }
    });
  }
  window.renderWorksTable = renderWorksTable;
  window.renderSmallViral = renderSmallViral;
  window.renderAuthors = renderAuthors;
  window.renderCompetitorWorks = renderCompetitorWorks;
  window.renderFormatDist = renderFormatDist;
  window.filteredWorks = filteredWorks;
})();
