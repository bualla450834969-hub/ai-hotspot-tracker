/**
 * modules/hotwords.js
 * 函数: renderHotwordTable, renderCategory, renderRanking, renderHistory, showKeywordTrend, filteredHotwords
 * 依赖: ['hotwords']
 */
(function() {
  'use strict';

  // renderHotwordTable
  function renderHotwordTable(hw) {
    const sorted=[...hw].sort((a,b)=>b.total-a.total);
    const satMap = {};
    (DATA.saturation||[]).forEach(s=>satMap[s.keyword]=s.stage);
    document.querySelector('#hotwordTable tbody').innerHTML=sorted.map((h,i)=>`
      <tr><td>${i+1}</td><td><b style="color:var(--text);cursor:pointer;text-decoration:underline dotted" onclick="showKeywordTrend('${h.keyword.replace(/'/g,"\\'")}')" title="点击查看趋势">${h.keyword}</b></td><td>${h.category}</td><td>${h.total.toLocaleString()}</td><td class="like-num">${h.max_like.toLocaleString()}</td><td class="collect-num">${h.collect_rate}%</td><td><span class="tag ${trendClass(h.trend)}">${h.trend||'稳定'}</span></td><td><span class="tag ${satMap[h.keyword]==='萌芽期'?'sprout':satMap[h.keyword]==='上升期'?'rise':satMap[h.keyword]==='爆发期'?'boom':'decline'}">${satMap[h.keyword]||'稳定期'}</span></td><td><span class="tag ${h.efficiency_tag==='蓝海'?'blue-ocean':h.efficiency_tag==='红海'?'red-ocean':'medium'}">${h.efficiency_tag||'适中'}</span></td></tr>`).join('');
  }

  // renderCategory
  function renderCategory(hw) {
    const m={}; hw.forEach(h=>{m[h.category]=(m[h.category]||0)+h.total;});
    const data=Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({name:n,value:v}));
    if (charts.category) charts.category.dispose();
    charts.category=echarts.init(document.getElementById('chartCategory'));
    charts.category.setOption({color:PALETTE,tooltip:{trigger:'item',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:'{b}<br/>{c} ({d}%)'},legend:{type:'scroll',orient:'vertical',right:5,top:'center',textStyle:{color:'rgba(255,255,255,0.6)',fontSize:10}},series:[{type:'pie',radius:['38%','65%'],center:['38%','50%'],data,label:{color:'rgba(255,255,255,0.6)',fontSize:10,formatter:'{d}%'},itemStyle:{borderColor:'rgba(10,10,18,0.6)',borderWidth:2},animationDuration:1200}]});
  }

  // renderRanking
  function renderRanking(hw) {
    const sorted=[...hw].sort((a,b)=>b.total-a.total).slice(0,15);
    if (charts.ranking) charts.ranking.dispose();
    charts.ranking=echarts.init(document.getElementById('chartRanking'));
    charts.ranking.setOption({color:PALETTE,grid:{left:90,right:50,top:10,bottom:20},xAxis:{type:'value',axisLabel:{color:AXIS_COLOR,formatter:v=>v>=10000?(v/10000).toFixed(0)+'万':v},splitLine:{lineStyle:{color:SPLIT_COLOR}}},yAxis:{type:'category',data:sorted.map(d=>d.keyword).reverse(),axisLabel:{color:'rgba(255,255,255,0.7)',fontSize:11},axisLine:{lineStyle:{color:AXIS_LINE}}},series:[{type:'bar',data:sorted.map(d=>d.total).reverse(),itemStyle:{color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#0A84FF'},{offset:1,color:'#BF5AF2'}]),borderRadius:[0,4,4,0]},label:{show:true,position:'right',formatter:p=>p.value>=10000?(p.value/10000).toFixed(1)+'万':p.value,fontSize:10,color:'rgba(255,255,255,0.6)'},animationDuration:1200,animationEasing:'cubicOut'}],tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:p=>`${p[0].name}<br/>作品总数 ${p[0].value.toLocaleString()}`}});
  }

  // renderHistory
  function renderHistory(hw) {
    const hist = DATA.historical_trend || [];
    if (charts.hist) charts.hist.dispose();
    charts.hist = echarts.init(document.getElementById('chartHistory'));
    if (hist.length < 2) {
      charts.hist.setOption({title:{text:'数据积累中，跑满 2 天后显示趋势曲线',left:'center',top:'center',textStyle:{color:AXIS_COLOR,fontSize:13,fontWeight:'normal'}}});
      return;
    }
    const dates = hist.map(h=>h.date.slice(5));
    const topKws = [...hw].sort((a,b)=>b.total-a.total).slice(0,5).map(h=>h.keyword);
    const series = topKws.map((kw,i)=>({
      name:kw, type:'line', smooth:true, symbol:'circle', symbolSize:5,
      data: hist.map(h=>{const f=h.hotwords.find(x=>x.keyword===kw);return f?f.total:null;}),
      lineStyle:{width:2}, itemStyle:{color:PALETTE[i%PALETTE.length]},
    }));
    charts.hist.setOption({color:PALETTE,tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT}},legend:{data:topKws,textStyle:{color:'rgba(255,255,255,0.6)',fontSize:11},top:0},grid:{left:60,right:20,top:40,bottom:30},xAxis:{type:'category',data:dates,axisLabel:{color:AXIS_COLOR},axisLine:{lineStyle:{color:AXIS_LINE}}},yAxis:{type:'value',axisLabel:{color:AXIS_COLOR,formatter:v=>v>=10000?(v/10000).toFixed(0)+'万':v},splitLine:{lineStyle:{color:SPLIT_COLOR}}},series});
  }

  // showKeywordTrend
  function showKeywordTrend(keyword) {
    const trends = DATA.keyword_trends || {};
    const t = trends[keyword];
    const modal = document.getElementById('trendModal');
    document.getElementById('trendModalTitle').textContent = keyword + ' · 热度趋势';
    if (!t || !t.data || t.data.length < 2) {
      document.getElementById('trendModalBody').innerHTML = '<p style="color:var(--text-secondary)">历史数据不足，需积累更多天数据后显示趋势曲线。</p>';
    } else {
      const maxVal = Math.max(...t.data.map(d=>d.total), 1);
      let bars = '<div style="display:flex;align-items:flex-end;gap:6px;height:160px;margin-top:12px">';
      t.data.forEach(d => {
        const h = Math.round(d.total/maxVal*100);
        const dir = t.direction==='up' ? '#4ade80' : t.direction==='down' ? '#f87171' : '#facc15';
        bars += '<div style="flex:1;text-align:center"><div style="height:'+h+'%;background:linear-gradient(180deg,'+dir+','+dir+'66);border-radius:4px 4px 0 0;min-height:4px" title="'+d.date+': '+d.total.toLocaleString()+'"></div><div style="font-size:10px;color:var(--text-secondary);margin-top:4px">'+d.date.slice(5)+'</div></div>';
      });
      bars += '</div>';
      const growthColor = t.growth>0 ? '#4ade80' : t.growth<0 ? '#f87171' : 'var(--text-secondary)';
      bars += '<div style="margin-top:12px;font-size:14px">周期变化：<b style="color:'+growthColor+'">'+(t.growth>0?'+':'')+t.growth+'%</b> · '+ (t.direction==='up'?'上升期':t.direction==='down'?'衰退期':'平台期') +'</div>';
      document.getElementById('trendModalBody').innerHTML = bars;
    }
    modal.classList.add('active');
  }

  // filteredHotwords
  function filteredHotwords() { const p = filterByPlatform(DATA.hotwords||[]); return currentCategory==='all' ? p : p.filter(h=>h.category===currentCategory); }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "hotwords",
      requiredFields: ['hotwords'],
      render: function(data) {
        try { renderHotwordTable(data); renderCategory(data); renderRanking(data); } catch(e) { console.error("[hotwords]", e); }
      }
    });
  }
})();
