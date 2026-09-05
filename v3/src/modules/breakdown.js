/**
 * modules/breakdown.js
 * 函数: renderBreakdowns, renderMatrix, renderFormulas, renderCollect, renderScatter, renderSaturation, renderCommentDemands, renderCommentKw, renderHook, renderDuration, renderPublishTime
 * 依赖: ['works', 'hot_breakdowns']
 */
(function() {
  'use strict';

  // renderBreakdowns
  function renderBreakdowns() {
    const list = DATA.hot_breakdowns || [];
    const el = document.getElementById('breakdownGrid');
    if (!list.length) { el.innerHTML='<div class="empty-state">暂无爆款拆解数据</div>'; return; }
    el.innerHTML = list.map((b,i)=>`
      <div class="breakdown-card">
        <div class="bd-header">
          <div class="bd-title">${i+1}. ${b.title}</div>
          <div style="display:flex;align-items:center;gap:6px;"><button class="fav-btn ${isFavorite(i) ? 'active' : ''}" onclick="toggleFavorite(${i})" title="收藏">${isFavorite(i) ? '⭐' : '☆'}</button><div class="bd-likes">${(b.likes/10000).toFixed(1)}万</div></div>
        </div>
        <div class="bd-row"><span class="bd-label">钩子</span><span class="bd-val">${b.hook}型</span></div>
        <div class="bd-row"><span class="bd-label">结构</span><span class="bd-val">${b.structure}</span></div>
        <div class="bd-row"><span class="bd-label">CTA</span><span class="bd-val">${b.cta}</span></div>
        ${b.target_persona ? `<div class="bd-row"><span class="bd-label">人群</span><span class="bd-val"><span style="color:#22d3ee;font-weight:600">${b.target_persona.name}</span> · ${b.target_persona.age} · ${(b.target_persona.needs||[]).slice(0,2).join(' / ')}</span></div>` : ''}
        <div class="bd-meta">
          <span>${b.author} · ${b.duration}</span>
          <span>${b.interaction} · <a href="${b.work_url||'#'}" target="_blank" class="work-link">原视频</a></span>
        </div>
      </div>`).join('');
  }

  // renderMatrix
  function renderMatrix() {
    const matrix = DATA.keyword_matrix || [];
    const el = document.getElementById('matrixGrid');
    if (!matrix.length) { el.innerHTML='<div class="empty-state">暂无矩阵数据</div>'; return; }
    el.innerHTML = matrix.map(m=>{
      const cls = m.level.includes('超热')?'super':m.level.includes('热门')?'hot':m.level.includes('上升')?'rise':'blue';
      return `<div class="matrix-cell ${cls}">
        <div class="mc-cat">${m.category}</div>
        <div class="mc-level">${m.level}</div>
        <div class="mc-stats">${m.count}关键词 · ${m.total.toLocaleString()}作品 · 最高赞${(m.max_like/10000).toFixed(1)}万</div>
        <div class="mc-kws">${m.keywords.join(' · ')}</div>
      </div>`;
    }).join('');
  }

  // renderFormulas
  function renderFormulas() {
    const list = DATA.title_formulas || [];
    const el = document.getElementById('formulaList');
    if (!list.length) { el.innerHTML='<div class="empty-state">暂无标题公式</div>'; return; }
    el.innerHTML = list.map(f=>`
      <div class="formula-item">
        <div class="f-name">${f.formula}</div>
        <div class="f-example">${f.example}</div>
        <div class="f-stats">命中 ${f.count} 条 · 平均点赞 ${f.avg_likes.toLocaleString()}</div>
      </div>`).join('');
  }

  // renderCollect
  function renderCollect(hw) {
    const sorted=[...hw].filter(h=>h.collect_rate>0).sort((a,b)=>b.collect_rate-a.collect_rate).slice(0,10);
    if (charts.collect) charts.collect.dispose();
    charts.collect=echarts.init(document.getElementById('chartCollect'));
    charts.collect.setOption({color:PALETTE,grid:{left:75,right:30,top:10,bottom:20},xAxis:{type:'value',axisLabel:{color:AXIS_COLOR,formatter:'{value}%'},splitLine:{lineStyle:{color:SPLIT_COLOR}}},yAxis:{type:'category',data:sorted.map(d=>d.keyword).reverse(),axisLabel:{color:'rgba(255,255,255,0.7)',fontSize:10},axisLine:{lineStyle:{color:AXIS_LINE}}},series:[{type:'bar',data:sorted.map(d=>d.collect_rate).reverse(),itemStyle:{color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#30D158'},{offset:1,color:'#64D2FF'}]),borderRadius:[0,4,4,0]},label:{show:true,position:'right',formatter:'{c}%',fontSize:10,color:'rgba(48,209,88,0.8)'},animationDuration:1000}],tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:'rgba(48,209,88,0.3)',textStyle:{color:TOOLTIP_TEXT}}});
  }

  // renderScatter
  function renderScatter(works) {
    const top=[...works].sort((a,b)=>(b.likeCount||0)-(a.likeCount||0)).slice(0,30);
    const data=top.map(w=>[w.likeCount||0,w.collectCount||0,w.title||'']);
    if (charts.scatter) charts.scatter.dispose();
    charts.scatter=echarts.init(document.getElementById('chartScatter'));
    charts.scatter.setOption({color:PALETTE,grid:{left:50,right:15,top:15,bottom:30},xAxis:{name:'点赞',nameTextStyle:{color:AXIS_COLOR,fontSize:10},type:'value',axisLabel:{color:AXIS_COLOR,formatter:v=>v>=10000?(v/10000).toFixed(0)+'万':v},splitLine:{lineStyle:{color:SPLIT_COLOR}}},yAxis:{name:'收藏',nameTextStyle:{color:AXIS_COLOR,fontSize:10},type:'value',axisLabel:{color:AXIS_COLOR,formatter:v=>v>=10000?(v/10000).toFixed(0)+'万':v},splitLine:{lineStyle:{color:SPLIT_COLOR}}},series:[{type:'scatter',data,symbolSize:d=>Math.max(8,Math.min(28,Math.sqrt(d[0])/12)),itemStyle:{color:'rgba(10,132,255,0.5)',borderColor:'#64D2FF',borderWidth:1}}],tooltip:{backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:p=>`${(p.data[2]||'').slice(0,25)}<br/>点赞 ${p.data[0].toLocaleString()}<br/>收藏 ${p.data[1].toLocaleString()}`}});
  }

  // renderSaturation
  function renderSaturation(hw) {
    const sat = DATA.saturation || [];
    const filtered = currentCategory==='all' ? sat : sat.filter(s=>hw.some(h=>h.keyword===s.keyword));
    const el = document.getElementById('saturationList');
    if (!filtered.length) { el.innerHTML='<div class="empty-state">暂无饱和度数据</div>'; return; }
    const maxSat = Math.max(...filtered.map(s=>s.saturation), 1);
    el.innerHTML = filtered.slice(0,12).map(s=>{
      const pct = Math.min(100, s.saturation/maxSat*100);
      const color = s.saturation<50?'#30D158':s.saturation<150?'#64D2FF':s.saturation<300?'#FF9F0A':'#FF453A';
      return `<div class="sat-item">
        <div class="sat-name">${s.keyword}</div>
        <div class="sat-bar"><div class="sat-fill" style="width:${pct}%;background:${color};"></div></div>
        <div class="sat-val">${s.saturation}</div>
        <div class="sat-advice"><span class="tag ${s.stage==='萌芽期'?'sprout':s.stage==='上升期'?'rise':s.stage==='爆发期'?'boom':'decline'}">${s.stage}</span></div>
      </div>`;
    }).join('');
  }

  // renderCommentDemands
  function renderCommentDemands() {
    const d = DATA.comment_demands || {};
    const el = document.getElementById('commentDemands');
    let html = '';
    if (d.questions && d.questions.length) {
      html += '<div class="demand-section"><div class="demand-label q">用户在问</div><div class="demand-tags">';
      html += d.questions.map(q=>`<span class="demand-tag">${q.demand}<span class="dc">${q.count}</span></span>`).join('');
      html += '</div></div>';
    }
    if (d.complaints && d.complaints.length) {
      html += '<div class="demand-section"><div class="demand-label c">用户在吐槽</div><div class="demand-tags">';
      html += d.complaints.map(q=>`<span class="demand-tag">${q.demand}<span class="dc">${q.count}</span></span>`).join('');
      html += '</div></div>';
    }
    if (d.needs && d.needs.length) {
      html += '<div class="demand-section"><div class="demand-label n">用户在求</div><div class="demand-tags">';
      html += d.needs.map(q=>`<span class="demand-tag">${q.demand}<span class="dc">${q.count}</span></span>`).join('');
      html += '</div></div>';
    }
    el.innerHTML = html || '<div class="empty-state">暂无评论需求数据</div>';
  }

  // renderCommentKw
  function renderCommentKw(works) {
    const kws = DATA.comment_keywords || [];
    const el = document.getElementById('commentKw');
    if (!kws.length) { el.innerHTML='<div class="empty-state">暂无评论关键词数据</div>'; return; }
    el.innerHTML = kws.slice(0,20).map((k,i)=>`<span class="kw-tag ${i<5?'hot':''}" style="font-size:${Math.max(11,16-i*0.4)}px;">${k.keyword} <span style="opacity:.5;font-size:10px;">${k.count}</span></span>`).join('');
  }

  // renderHook
  function renderHook(works) {
    const hs={}; works.forEach(w=>{const h=classifyHook(w.title||'');if(!hs[h])hs[h]={count:0,likes:0};hs[h].count++;hs[h].likes+=(w.likeCount||0);});
    const data=Object.entries(hs).map(([n,v])=>({name:n,value:Math.round(v.likes/v.count)}));
    if (charts.hook) charts.hook.dispose();
    charts.hook=echarts.init(document.getElementById('chartHook'));
    charts.hook.setOption({color:PALETTE,grid:{left:45,right:15,top:15,bottom:25},xAxis:{type:'category',data:data.map(d=>d.name),axisLabel:{color:'rgba(255,255,255,0.7)',fontSize:10},axisLine:{lineStyle:{color:AXIS_LINE}}},yAxis:{type:'value',axisLabel:{color:AXIS_COLOR},splitLine:{lineStyle:{color:SPLIT_COLOR}}},series:[{type:'bar',data:data.map(d=>d.value),itemStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#FF9F0A'},{offset:1,color:'#FF453A'}]),borderRadius:[4,4,0,0]},label:{show:true,position:'top',fontSize:10,color:'rgba(255,255,255,0.5)'},animationDuration:1000}],tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:p=>`${p[0].name}型<br/>平均点赞 ${p[0].value.toLocaleString()}`}});
  }

  // renderDuration
  function renderDuration(works) {
    const ranges = [
      { range: '0-15秒', min: 0, max: 15 },
      { range: '15-30秒', min: 15, max: 30 },
      { range: '30-60秒', min: 30, max: 60 },
      { range: '1-3分钟', min: 60, max: 180 },
      { range: '3分钟+', min: 180, max: Infinity },
    ];
    const counts = ranges.map(() => 0);
    const likes = ranges.map(() => 0);
    (works || []).forEach(w => {
      const durMs = w.duration || 0;
      if (durMs <= 0) return;
      const sec = durMs / 1000;
      for (let i = 0; i < ranges.length; i++) {
        if (sec >= ranges[i].min && sec < ranges[i].max) {
          counts[i]++;
          likes[i] += (w.likeCount || 0);
          break;
        }
      }
    });
    const dist = ranges.map((r, i) => ({
      range: r.range, count: counts[i],
      avg_likes: counts[i] > 0 ? Math.round(likes[i] / counts[i]) : 0
    }));
    if (charts.dur) charts.dur.dispose();
    charts.dur = echarts.init(document.getElementById('chartDuration'));
    charts.dur.setOption({color:PALETTE,grid:{left:45,right:15,top:15,bottom:25},xAxis:{type:'category',data:dist.map(d=>d.range),axisLabel:{color:AXIS_COLOR,fontSize:9,interval:0,rotate:15},axisLine:{lineStyle:{color:AXIS_LINE}}},yAxis:{type:'value',axisLabel:{color:AXIS_COLOR},splitLine:{lineStyle:{color:SPLIT_COLOR}}},series:[{type:'bar',data:dist.map(d=>({value:d.count,itemStyle:{color:d.avg_likes>5000?'#30D158':'#0A84FF'}})),label:{show:true,position:'top',fontSize:9,color:'rgba(255,255,255,0.5)',formatter:p=>`${p.value}条`},barWidth:'50%',animationDuration:1000}],tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:p=>{const d=dist[p[0].dataIndex];return `${d.range}<br/>作品数 ${d.count}<br/>平均点赞 ${d.avg_likes.toLocaleString()}`;}}});
  }

  // renderPublishTime
  function renderPublishTime(works) {
    // 从works实时计算发布时间分布
    const hourCount = new Array(24).fill(0);
    const hourLikes = new Array(24).fill(0);
    const hourViral = new Array(24).fill(0);
    (works || []).forEach(w => {
      const pt = w.publishTime;
      if (!pt) return;
      const m = pt.match(/ (\d{2}):/);
      if (!m) return;
      const h = parseInt(m[1]);
      hourCount[h]++;
      hourLikes[h] += (w.likeCount || 0);
      if ((w.likeCount || 0) >= 10000) hourViral[h]++;
    });
    const dist = hourCount.map((cnt, h) => ({
      hour: h,
      count: cnt,
      avg_likes: cnt > 0 ? Math.round(hourLikes[h] / cnt) : 0,
      viral_count: hourViral[h],
      viral_rate: cnt > 0 ? Math.round(hourViral[h] / cnt * 100) : 0
    }));
    if (charts.pt) charts.pt.dispose();
    charts.pt = echarts.init(document.getElementById('chartPublishTime'));
    charts.pt.setOption({
      color: PALETTE,
      grid: { left: 40, right: 15, top: 25, bottom: 25 },
      xAxis: {
        type: 'category',
        data: dist.map(d => d.hour + '时'),
        axisLabel: { color: AXIS_COLOR, fontSize: 9, interval: 2 },
        axisLine: { lineStyle: { color: AXIS_LINE } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: AXIS_COLOR },
        splitLine: { lineStyle: { color: SPLIT_COLOR } }
      },
      series: [{
        type: 'bar',
        data: dist.map(d => ({
          value: d.count,
          itemStyle: {
            color: d.viral_rate >= 10
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#FFD60A' }, { offset: 1, color: '#FF9F0A' }])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#0A84FF' }, { offset: 1, color: '#5E5CE6' }]),
            borderRadius: [4, 4, 0, 0]
          }
        })),
        animationDuration: 1000
      }],
      tooltip: {
        trigger: 'axis',
        backgroundColor: TOOLTIP_BG,
        borderColor: TOOLTIP_BORDER,
        textStyle: { color: TOOLTIP_TEXT },
        formatter: p => {
          const d = dist[p[0].dataIndex];
          return `${d.hour}时<br/>作品数 ${d.count}<br/>平均点赞 ${d.avg_likes.toLocaleString()}<br/>爆款数 ${d.viral_count}（${d.viral_rate}%）`;
        }
      }
    });
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "breakdown",
      requiredFields: ['works'],
      render: function(data) {
        try { renderBreakdowns(); renderMatrix(); renderFormulas(); renderCollect(DATA.hotwords); renderScatter(data); renderSaturation(DATA.hotwords); renderCommentDemands(); renderCommentKw(); renderHook(data); renderDuration(data); renderPublishTime(data); } catch(e) { console.error("[breakdown]", e); }
      }
    });
  }
  window.renderBreakdowns = renderBreakdowns;
  window.renderMatrix = renderMatrix;
  window.renderFormulas = renderFormulas;
  window.renderCollect = renderCollect;
  window.renderScatter = renderScatter;
  window.renderSaturation = renderSaturation;
  window.renderCommentDemands = renderCommentDemands;
  window.renderCommentKw = renderCommentKw;
  window.renderHook = renderHook;
  window.renderDuration = renderDuration;
  window.renderPublishTime = renderPublishTime;
})();
