/* ===== core/contentAI.js ===== */
(function() {
  'use strict';
  var ANALYSIS_VERSION='v8.3-real-v1', PROMPT_VERSION='v8.3-script-v1', PROXY_KEY='content_ai_proxy_url';
  var DEFAULT_PROXY_URL='https://ai-hotspot-content-ai.bualla450834969.workers.dev/api/ai';
  var requestVersion=0, activeController=null;
  function industryId(){var c=window.IndustryStore&&IndustryStore.getCurrent?IndustryStore.getCurrent():null;return c&&c.id?c.id:(window.CURRENT_INDUSTRY||'ai');}
  function cleanWork(work){work=work||{};return {workId:work.workId||work.sourceId||'',title:work.title||'',content:work.transcript||work.caption||'',platform:work.platform||'',keyword:work._keyword||'',metrics:{likes:Number(work.likes||work.likeCount||0),comments:Number(work.comments||work.commentCount||0),favorites:Number(work.collects||work.collectCount||0),shares:Number(work.shares||work.shareCount||0)}};}
  function workIdentity(work){var w=cleanWork(work),seed=w.workId||[w.platform,w.title,w.keyword].join('|'),hash=2166136261;for(var i=0;i<seed.length;i++){hash^=seed.charCodeAt(i);hash=Math.imul(hash,16777619);}return w.workId||('work_'+(hash>>>0).toString(36));}
  function analysisKey(work,id){return ['content_ai_analysis',encodeURIComponent(id||industryId()),encodeURIComponent(workIdentity(work)),ANALYSIS_VERSION].join('__');}
  function scriptKey(o,id){return ['content_ai_script',encodeURIComponent(id||industryId()),encodeURIComponent(workIdentity(o.work)),Number(o.duration||60),encodeURIComponent(o.platform||'douyin'),encodeURIComponent(o.tone||'natural'),PROMPT_VERSION].join('__');}
  function makeError(code,message){var e=new Error(message);e.code=code;return e;}
  function proxyUrl(){return String(StorageAdapter.getRaw(PROXY_KEY,DEFAULT_PROXY_URL)||DEFAULT_PROXY_URL).trim();}
  function current(version,id){return version===requestVersion&&id===industryId();}
  function request(action,payload,id){
    var url=proxyUrl();if(!url)return Promise.reject(makeError('PROVIDER_NOT_CONFIGURED','尚未配置安全 AI 代理。'));
    requestVersion+=1;var version=requestVersion;if(activeController)activeController.abort();activeController=typeof AbortController==='function'?new AbortController():null;
    var timeout=setTimeout(function(){if(activeController)activeController.abort();},90000);
    return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},signal:activeController?activeController.signal:undefined,body:JSON.stringify({action:action,payload:payload,client:{feature:'hot-content-to-script',version:ANALYSIS_VERSION}})})
      .then(function(response){if(!response.ok)throw makeError('PROVIDER_REQUEST_FAILED','AI 分析暂时失败，请重试。');return response.json();})
      .then(function(body){if(!current(version,id))throw makeError('STALE_RESPONSE','请求已失效。');if(!body||body.ok===false)throw makeError('PROVIDER_INVALID_RESPONSE','AI 分析暂时失败，请重试。');return body.data||body;})
      .catch(function(reason){if(reason&&reason.name==='AbortError')throw makeError(current(version,id)?'PROVIDER_TIMEOUT':'STALE_RESPONSE','AI 分析暂时失败，请重试。');throw reason;})
      .finally(function(){clearTimeout(timeout);});
  }
  function text(value){return typeof value==='string'&&!!value.trim();}
  function validAnalysis(v){return v&&['topic','hook','angle','structure','reusablePattern','limitations'].every(function(k){return text(v[k]);})&&Array.isArray(v.keyPoints)&&v.keyPoints.length>0&&v.keyPoints.every(text)&&Array.isArray(v.interactionReasons)&&v.interactionReasons.length>0&&v.interactionReasons.every(text);}
  function variantsFrom(v){if(v&&Array.isArray(v.variants))return v.variants;if(v&&v.variant&&typeof v.variant==='object')return [v.variant];return v;}
  function validVariants(v,count){var a=variantsFrom(v),keys=['angle','title','coverTitle','hook','body','cta','tags','estimatedDuration'];return Array.isArray(a)&&a.length===count&&a.every(function(item){return item&&keys.every(function(k){return text(item[k]);});});}
  function translationKey(item,id){return ['github_description_zh',encodeURIComponent(id||industryId()),encodeURIComponent(String(item.id||item.name||''))].join('__');}
  function translateDescriptions(items){var id=industryId(),list=(items||[]).slice(0,20),pending=[];list.forEach(function(item){item.descriptionOriginal=item.description||'';if(/[\u3400-\u9fff]/.test(item.description||'')){item.descriptionZh=item.description;return;}var cached=StorageAdapter.getJSON(translationKey(item,id),null);if(cached&&cached.source===item.description&&text(cached.text)){item.descriptionZh=cached.text;return;}if(text(item.description))pending.push({id:String(item.id),text:item.description});});if(!pending.length)return Promise.resolve(list);return request('translateDescriptions',{industryId:id,items:pending},id).then(function(result){var rows=result&&result.translations;if(!Array.isArray(rows))throw makeError('PROVIDER_INVALID_RESPONSE','项目简介翻译暂时失败。');var map={};rows.forEach(function(row){if(row&&text(row.id)&&text(row.text))map[String(row.id)]=row.text;});list.forEach(function(item){var translated=map[String(item.id)];if(translated){item.descriptionZh=translated;StorageAdapter.setJSON(translationKey(item,id),{source:item.description,text:translated});}});return list;});}
  var adapter={
    analysisVersion:ANALYSIS_VERSION,promptVersion:PROMPT_VERSION,getProxyUrl:proxyUrl,
    setProxyUrl:function(url){return StorageAdapter.setRaw(PROXY_KEY,String(url||'').trim());},
    getCachedAnalysis:function(work){return StorageAdapter.getJSON(analysisKey(work),null);},
    getCachedScripts:function(options){return StorageAdapter.getJSON(scriptKey(options),null);},
    abortAll:function(){requestVersion+=1;if(activeController)activeController.abort();activeController=null;},
    analyzeContent:function(work){var id=industryId(),cached=StorageAdapter.getJSON(analysisKey(work,id),null);if(validAnalysis(cached))return Promise.resolve({analysis:cached,cached:true});var clean=cleanWork(work);return request('analyzeContent',{industryId:id,work:clean,analysisVersion:ANALYSIS_VERSION,contentAvailable:!!clean.content},id).then(function(result){var analysis=result.analysis||result;if(!validAnalysis(analysis))throw makeError('PROVIDER_INVALID_RESPONSE','AI 分析暂时失败，请重试。');StorageAdapter.setJSON(analysisKey(work,id),analysis);return {analysis:analysis,cached:false};});},
    generateScript:function(options){options=options||{};var id=industryId(),action=options.action||'generate',key=scriptKey(options,id),cached=action==='generate'&&!options.userInput?StorageAdapter.getJSON(key,null):null;if(validVariants(cached,3))return Promise.resolve({variants:cached,cached:true});var payload={industryId:id,work:cleanWork(options.work),analysis:options.analysis||null,duration:Number(options.duration||60),platform:options.platform||'douyin',tone:options.tone||'natural',userInput:String(options.userInput||''),action:action,currentScript:options.currentScript||null,promptVersion:PROMPT_VERSION};return request('generateScript',payload,id).then(function(result){var count=action==='generate'?3:1;if(!validVariants(result,count))throw makeError('PROVIDER_INVALID_RESPONSE','AI 分析暂时失败，请重试。');var variants=variantsFrom(result);if(action==='generate'&&!options.userInput)StorageAdapter.setJSON(key,variants);return {variants:variants,cached:false};});},
    translateDescriptions:translateDescriptions,
    _test:{cleanWork:cleanWork,workIdentity:workIdentity,analysisKey:analysisKey,scriptKey:scriptKey,translationKey:translationKey,validAnalysis:validAnalysis,validVariants:validVariants}
  };
  window.ContentAIAdapter=adapter;
})();
