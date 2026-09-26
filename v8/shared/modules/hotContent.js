/* ===== modules/hotContent.js ===== */
(function() {
  'use strict';

  var state = { keyword:'', work:null, analysis:null, scripts:[], sort:'engagement' };

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function number(value) { var n=Number(value); return isFinite(n) ? n : 0; }
  function fmt(value) { return number(value).toLocaleString(); }
  function id(work) { return ContentAIAdapter._test.workIdentity(work); }
  function metric(work, name, alias) { return number(work[name] != null ? work[name] : work[alias]); }
  function engagement(work) { return metric(work,'likes','likeCount') + metric(work,'comments','commentCount')*3 + metric(work,'collects','collectCount')*2 + metric(work,'shares','shareCount')*4; }

  function ensureDrawer() {
    var drawer=document.getElementById('v83ContentDrawer');
    if (drawer) return drawer;
    drawer=document.createElement('aside'); drawer.id='v83ContentDrawer'; drawer.className='v82-drawer v83-content-drawer';
    drawer.innerHTML='<div class="v82-drawer-backdrop" data-v83-action="close"></div><div class="v82-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="v83DrawerTitle"><header><div><span class="v82-drawer-kicker" id="v83DrawerKicker">热门内容</span><h2 id="v83DrawerTitle">内容详情</h2></div><button type="button" class="v82-close" data-v83-action="close" aria-label="关闭">×</button></header><div class="v82-drawer-body" id="v83DrawerBody"></div></div>';
    document.body.appendChild(drawer); return drawer;
  }
  function open(kicker,title,html) { var d=ensureDrawer(); d.querySelector('#v83DrawerKicker').textContent=kicker; d.querySelector('#v83DrawerTitle').textContent=title; d.querySelector('#v83DrawerBody').innerHTML=html; d.classList.add('is-open'); document.body.classList.add('v83-drawer-open'); }
  function close() { var d=document.getElementById('v83ContentDrawer'); if(d)d.classList.remove('is-open'); document.body.classList.remove('v83-drawer-open'); state.work=null; state.analysis=null; state.scripts=[]; }

  function currentWorks() { return Array.isArray(window.DATA && DATA.works) ? DATA.works : []; }
  function worksFor(keyword) { return currentWorks().filter(function(w){ return w._keyword===keyword || (!w._keyword && String(w.title||'').indexOf(keyword)>=0); }); }
  function sortWorks(list) {
    var key=state.sort;
    return list.slice().sort(function(a,b){
      if(key==='newest') return String(b.publishTime||'').localeCompare(String(a.publishTime||''));
      if(key==='likes') return metric(b,'likes','likeCount')-metric(a,'likes','likeCount');
      if(key==='comments') return metric(b,'comments','commentCount')-metric(a,'comments','commentCount');
      if(key==='favorites') return metric(b,'collects','collectCount')-metric(a,'collects','collectCount');
      return engagement(b)-engagement(a);
    });
  }
  function metricTags(work) {
    var values=[['赞',metric(work,'likes','likeCount')],['评',metric(work,'comments','commentCount')],['藏',metric(work,'collects','collectCount')],['转',metric(work,'shares','shareCount')]];
    return values.filter(function(x){return x[1]>0;}).map(function(x){return '<span>'+x[0]+' '+fmt(x[1])+'</span>';}).join('');
  }
  function renderList(keyword) {
    state.keyword=keyword; var list=sortWorks(worksFor(keyword));
    var options=[['engagement','综合互动'],['likes','点赞'],['comments','评论'],['favorites','收藏'],['newest','最新']].map(function(x){return '<option value="'+x[0]+'"'+(state.sort===x[0]?' selected':'')+'>'+x[1]+'</option>';}).join('');
    var rows=list.map(function(w){return '<article class="v83-work-card"><button type="button" data-v83-action="detail" data-work-id="'+esc(id(w))+'"><strong>'+esc(w.title||'无标题')+'</strong><span>'+esc(w.platform||'未知平台')+(w.publishTime?' · '+esc(w.publishTime):'')+'</span><span class="v83-metrics">'+metricTags(w)+'</span><small>engagementScore '+fmt(engagement(w))+'</small></button></article>';}).join('');
    open('Hot Topic → Works',keyword,'<div class="v83-toolbar"><label>排序<select data-v83-action="sort">'+options+'</select></label></div><p class="v83-formula">engagementScore = 点赞 + 评论×3 + 收藏×2 + 分享×4，仅用于当前列表排序。</p>'+(rows||'<div class="v82-empty">当前行业的该热点暂无关联作品。</div>'));
  }
  function findWork(workId) { return currentWorks().find(function(w){return id(w)===workId;}) || null; }
  function originalContent(work) {
    var text=work.transcript||work.caption||'';
    return text ? '<p class="v83-original-text">'+esc(text)+'</p>' : '<div class="v83-warning">当前仅采集到标题与互动指标，信息不足，无法完整分析正文内容。</div>';
  }
  function renderDetail(work) {
    state.work=work; state.analysis=ContentAIAdapter.getCachedAnalysis(work);
    var url=work.url||work.workUrl||'';
    var meta=[work.platform,work.author||work.accountName,work.publishTime].filter(Boolean).map(esc).join(' · ');
    var analysis=state.analysis ? renderAnalysis(state.analysis,true) : '<div class="v83-ai-empty"><p>尚未进行 AI 拆解。拆解只基于上方真实字段，缺失正文时会明确限制。</p><button type="button" class="v83-primary" data-v83-action="analyze">开始 AI 拆解</button></div>';
    open('Content Detail',work.title||'无标题','<section class="v83-section"><h3>【原始内容】</h3><p class="v83-meta">'+meta+'</p><div class="v83-metrics">'+metricTags(work)+'</div>'+originalContent(work)+(url?'<a class="v83-source" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">查看原始内容</a>':'<span class="v83-muted">原始链接未采集</span>')+'</section><section class="v83-section" id="v83Analysis"><h3>【AI 拆解】</h3>'+analysis+'</section>');
  }
  function renderAnalysis(a,cached) {
    var rows=[['为什么表现好',a.successReason],['开头如何抓住注意力',a.hook],['内容结构是什么',a.structure],['使用了什么情绪或动机',a.emotion],['哪些方法可以借鉴',a.reusableMethod]];
    return '<div class="v83-analysis">'+(cached?'<span class="v83-cache">已缓存</span>':'')+rows.map(function(x){return '<div><strong>'+x[0]+'</strong><p>'+esc(x[1])+'</p></div>';}).join('')+'<button type="button" class="v83-primary" data-v83-action="script-settings">生成原创口播</button></div>';
  }
  function providerState(error) {
    var message=error && error.message ? error.message : 'AI 服务暂不可用。';
    return '<div class="v83-provider-state"><strong>'+esc(message)+'</strong><p>请填写由你控制的安全代理地址。Provider 密钥只保存在服务端，不能进入浏览器或 bundle.js。</p><label>安全代理地址<input type="url" id="v83ProxyUrl" value="'+esc(ContentAIAdapter.getProxyUrl())+'" placeholder="https://your-worker.example/api/content-ai"></label><button type="button" data-v83-action="save-proxy">保存代理地址</button></div>';
  }
  function analyze() {
    var host=document.getElementById('v83Analysis'); if(!host||!state.work)return;
    host.innerHTML='<h3>【AI 拆解】</h3><div class="v83-loading">正在基于真实内容字段拆解…</div>';
    ContentAIAdapter.analyzeContent(state.work).then(function(result){state.analysis=result.analysis; host.innerHTML='<h3>【AI 拆解】</h3>'+renderAnalysis(result.analysis,result.cached);}).catch(function(e){host.innerHTML='<h3>【AI 拆解】</h3>'+providerState(e);});
  }
  function renderSettings() {
    open('Script Generator','生成原创口播','<section class="v83-section"><p class="v83-back"><button type="button" data-v83-action="back-detail">返回内容详情</button></p><div class="v83-settings"><label>时长<select id="v83Duration"><option value="30">30 秒</option><option value="60" selected>60 秒</option><option value="90">90 秒</option></select></label><label>平台<select id="v83Platform"><option value="douyin">抖音</option><option value="xiaohongshu">小红书</option><option value="wechat-video">微信视频号</option></select></label><label>语气<select id="v83Tone"><option value="natural">自然</option><option value="professional">专业</option><option value="opinion">观点鲜明</option><option value="light">轻松</option></select></label><label class="v83-full">我的观点（可选）<textarea id="v83UserInput" rows="3" placeholder="补充你自己的经验、立场或案例"></textarea></label><button type="button" class="v83-primary" data-v83-action="generate">生成 3 个原创角度</button></div><div id="v83GeneratorResult"></div></section>');
  }
  function scriptText(s) { return ['【标题】'+s.title,'【封面标题】'+s.coverTitle,'【开头】'+s.hook,'【完整口播】\n'+s.script,'【行动引导】'+s.cta,'【标签】'+s.hashtags,'【预计时长】'+s.estimatedDuration].join('\n\n'); }
  function renderScripts(scripts) {
    return '<div class="v83-script-list">'+scripts.map(function(s,i){return '<article class="v83-script"><header><strong>方案 '+(i+1)+'</strong><span>'+esc(s.estimatedDuration)+'</span></header><textarea rows="18" data-script-index="'+i+'">'+esc(scriptText(s))+'</textarea><div class="v83-quick">'+[['new-opening','换开头'],['colloquial','更口语'],['professional','更专业'],['shorter','缩短'],['expand','扩写'],['different-angle','换角度'],['regenerate','重新生成']].map(function(x){return '<button type="button" data-v83-action="refine" data-refine="'+x[0]+'" data-script-index="'+i+'">'+x[1]+'</button>';}).join('')+'</div></article>';}).join('')+'</div>';
  }
  function settings() { return {duration:document.getElementById('v83Duration').value,platform:document.getElementById('v83Platform').value,tone:document.getElementById('v83Tone').value,userInput:document.getElementById('v83UserInput').value}; }
  function generate(extra) {
    var host=document.getElementById('v83GeneratorResult'); if(!host)return;
    var opts=settings(); Object.keys(extra||{}).forEach(function(k){opts[k]=extra[k];}); opts.work=state.work; opts.analysis=state.analysis;
    host.innerHTML='<div class="v83-loading">正在生成 3 个原创角度…</div>';
    ContentAIAdapter.generateScript(opts).then(function(result){
      if(extra&&extra.targetIndex!=null){state.scripts[extra.targetIndex]=result.scripts[0];}
      else state.scripts=result.scripts;
      host.innerHTML=renderScripts(state.scripts);
    }).catch(function(e){host.innerHTML=providerState(e);});
  }

  document.addEventListener('click',function(event){
    var hot=event.target.closest&&event.target.closest('[data-v83-hotword]'); if(hot){renderList(hot.getAttribute('data-v83-hotword'));return;}
    var tableWork=event.target.closest&&event.target.closest('[data-v83-work-id]'); if(tableWork){var work=findWork(tableWork.getAttribute('data-v83-work-id')); if(work)renderDetail(work);return;}
    var el=event.target.closest&&event.target.closest('[data-v83-action]'); if(!el)return; var action=el.getAttribute('data-v83-action');
    if(action==='close')close(); else if(action==='detail'){var w=findWork(el.getAttribute('data-work-id'));if(w)renderDetail(w);} else if(action==='analyze')analyze(); else if(action==='script-settings')renderSettings(); else if(action==='back-detail'&&state.work)renderDetail(state.work); else if(action==='generate')generate();
    else if(action==='save-proxy'){var input=document.getElementById('v83ProxyUrl');ContentAIAdapter.setProxyUrl(input?input.value:''); if(state.work)analyze();}
    else if(action==='refine'){var i=Number(el.getAttribute('data-script-index'));var area=document.querySelector('textarea[data-script-index="'+i+'"]');generate({action:el.getAttribute('data-refine'),currentScript:area?area.value:state.scripts[i],targetIndex:i});}
  });
  document.addEventListener('change',function(event){if(event.target&&event.target.getAttribute('data-v83-action')==='sort'){state.sort=event.target.value;renderList(state.keyword);}});
  document.addEventListener('keydown',function(event){if(event.key==='Escape')close();});
  window.V83HotContent={ openTopic:renderList, openWork:renderDetail, close:close, engagementScore:engagement };
})();
