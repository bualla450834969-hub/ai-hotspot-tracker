/* ===== modules/benchmarkExtras.js（内容形式ROI + 对标账号，数据驱动正式渲染）===== */
(function() {
  'use strict';
  function renderFormatROI() {
    var el = document.getElementById('formatROIList'); if (!el) return;
    var rois = DATA.format_roi || [];
    if (!rois.length) { el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-secondary);font-size:13px;">暂无数据，采集后自动生成</div>'; return; }
    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' + rois.map(function(r){
      var pct = Math.max(0, Math.min(100, r.roi||0));
      return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:14px;font-weight:600;">'+r.format+'</span><span style="font-size:12px;color:#fbbf24;font-weight:700;">ROI '+pct+'</span></div>' +
        '<div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#8b5cf6,#ec4899);border-radius:3px;"></div></div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:var(--text-secondary);"><span>均赞 '+Number(r.avgLikes||0).toLocaleString()+'</span><span>收藏率 '+Number(r.collectRate||0)+'%</span></div>' +
        '</div>';
    }).join('') + '</div>';
  }
  function renderCompetitorList() {
    var el = document.getElementById('competitorList'); if (!el) return;
    var comps = DATA.competitor_list || [];
    if (!comps.length) { el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-secondary);font-size:13px;">暂无数据，采集后自动生成</div>'; return; }
    el.innerHTML = '<div style="display:grid;gap:10px;">' + comps.map(function(c){
      return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;">' +
        '<div><div style="font-size:14px;font-weight:600;">'+c.name+'</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px;">'+(c.strategy||'')+'</div></div>' +
        '<div style="text-align:right;font-size:11px;color:var(--text-secondary);"><div style="font-size:15px;color:#a78bfa;font-weight:700;">'+Number(c.avgLikes||0).toLocaleString()+'</div><div>'+Number(c.works||0)+' 作品</div></div>' +
        '</div>';
    }).join('') + '</div>';
  }
  if (window.Module) {
    Module.register({ id:'benchmarkExtras', requiredFields:[], render:function(){
      try{renderFormatROI();}catch(e){console.error('[formatROI]',e);}
      try{renderCompetitorList();}catch(e){console.error('[competitorList]',e);}
    }});
  }
  window.renderFormatROI = renderFormatROI;
  window.renderCompetitorList = renderCompetitorList;
})();


