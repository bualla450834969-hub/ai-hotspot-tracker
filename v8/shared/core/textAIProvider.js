/* ===== core/textAIProvider.js ===== */
(function() {
  'use strict';

  var CONFIG_KEY='user_text_ai_config';
  var TIMEOUT_MS=40000;
  var PRESETS={
    'xiaomi-mimo':{
      id:'xiaomi-mimo',name:'Xiaomi MiMo',type:'openai-compatible',mode:'direct',
      baseUrl:'https://api.xiaomimimo.com/v1',modelPlaceholder:'mimo-v2.5-pro',
      homepage:'https://platform.xiaomimimo.com/',apiKeyGuide:'在 Xiaomi MiMo 开放平台创建 API Key。',modelGuide:'填写控制台中可用的模型 ID。'
    },
    'openai-compatible':{
      id:'openai-compatible',name:'OpenAI-Compatible',type:'openai-compatible',mode:'direct',
      baseUrl:'',modelPlaceholder:'填写服务商提供的 model id',homepage:'',
      apiKeyGuide:'在你选择的模型服务商控制台创建 API Key。',modelGuide:'适用于支持 OpenAI Chat Completions 格式的模型服务。'
    },
    custom:{
      id:'custom',name:'Custom',type:'openai-compatible',mode:'direct',
      baseUrl:'',modelPlaceholder:'填写自定义 model id',homepage:'',
      apiKeyGuide:'在服务商控制台创建 API Key。',modelGuide:'首期仅支持 OpenAI Chat Completions 格式。'
    }
  };

  function clone(value){return value?JSON.parse(JSON.stringify(value)):value;}
  function clean(value){return String(value==null?'':value).trim();}
  function configValue(value){
    value=value||{};
    return {
      providerId:clean(value.providerId||value.provider||'openai-compatible'),
      providerType:'openai-compatible',baseUrl:clean(value.baseUrl).replace(/\/+$/,''),
      apiKey:clean(value.apiKey),model:clean(value.model),createdAt:value.createdAt||'',updatedAt:value.updatedAt||'',
      connection:value.connection&&typeof value.connection==='object'?value.connection:{status:'untested'}
    };
  }
  function getCurrentConfig(){var value=StorageAdapter.getJSON(CONFIG_KEY,null);return value?configValue(value):null;}
  function validate(value){
    var config=configValue(value),missing=[];
    if(!PRESETS[config.providerId])missing.push('Provider');
    if(!config.baseUrl)missing.push('API Base URL');
    if(!config.apiKey)missing.push('API Key');
    if(!config.model)missing.push('Model');
    return {valid:missing.length===0,missing:missing,config:config};
  }
  function saveConfig(value){
    var previous=getCurrentConfig(),checked=validate(value);if(!checked.valid)return checked;
    var now=new Date().toISOString(),config=checked.config;
    config.createdAt=previous&&previous.createdAt||now;config.updatedAt=now;
    if(!config.connection||config.connection.signature!==signature(config))config.connection={status:'untested'};
    StorageAdapter.setJSON(CONFIG_KEY,config);return {valid:true,config:clone(config)};
  }
  function clearConfig(){StorageAdapter.remove(CONFIG_KEY);return true;}
  function maskKey(key){key=clean(key);if(!key)return '未保存';return '****'+key.slice(-4);}
  function signature(config){config=configValue(config);return [config.providerId,config.baseUrl,config.model,config.apiKey.slice(-8)].join('|');}
  function setConnection(result){var config=getCurrentConfig();if(!config)return null;config.connection=Object.assign({status:'untested'},result||{}, {signature:signature(config),testedAt:new Date().toISOString()});config.updatedAt=new Date().toISOString();StorageAdapter.setJSON(CONFIG_KEY,config);return clone(config);}

  window.PROVIDER_PRESETS=PRESETS;
  window.TextAIProvider={
    configKey:CONFIG_KEY,getPresets:function(){return clone(PRESETS);},getPreset:function(id){return clone(PRESETS[id]||null);},
    getCurrentConfig:getCurrentConfig,saveConfig:saveConfig,clearConfig:clearConfig,validate:validate,maskKey:maskKey,setConnection:setConnection,
    isConfigured:function(){return validate(getCurrentConfig()).valid;},_test:{configValue:configValue,signature:signature}
  };

  function providerError(code,message,status){var error=new Error(message);error.code=code;if(status)error.status=status;return error;}
  var activeControllers=[];
  function endpoint(baseUrl){baseUrl=clean(baseUrl).replace(/\/+$/,'');return /\/chat\/completions$/i.test(baseUrl)?baseUrl:baseUrl+'/chat/completions';}
  function safeJson(text){text=clean(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{return JSON.parse(text);}catch(e){var start=text.indexOf('{'),end=text.lastIndexOf('}');if(start>=0&&end>start)return JSON.parse(text.slice(start,end+1));throw providerError('INVALID_RESPONSE','模型返回格式不正确。');}}
  function normalizeVariants(value){if(value&&Array.isArray(value.variants))value.variants=value.variants.map(function(item){item=item||{};if(Array.isArray(item.tags))item.tags=item.tags.join(' ');if(item.estimatedDuration!=null)item.estimatedDuration=String(item.estimatedDuration);return item;});return value;}
  function durationRange(duration){duration=Number(duration||60);return duration<=30?[70,110]:(duration<=60?[120,190]:[190,290]);}
  function instructions(action,payload){
    var common='你是短视频内容策略助手。只能根据输入中的真实字段工作，不得虚构原视频画面、逐字稿或事实。不得复刻原文、逐句同义替换或保留独特原句。只返回严格 JSON，不要 Markdown。';
    if(action==='analyzeContent')return common+' 分析主题、结构、表达策略和内容角度。返回 topic(string), hook(string), angle(string), keyPoints(string[]), structure(string), interactionReasons(string[]), reusablePattern(string), limitations(string)。'+(payload.contentAvailable?'正文存在，可以结合正文分析。':'没有完整正文，limitations 必须包含“当前仅基于标题和互动数据分析。”');
    var rewrite=payload.action&&payload.action!=='generate',range=durationRange(payload.duration),rules={'new-opening':'只替换开场钩子，其余核心观点保持一致。',colloquial:'改成更自然的口语表达，事实和核心观点保持一致。',professional:'改成更专业、克制的表达，事实和核心观点保持一致。',shorter:'明显压缩当前脚本，body 字数不得超过当前 body 的 70%。','different-angle':'换一个不同的原创切入角度，不复用当前开场和论述顺序。'};
    return common+(rewrite?'只改写当前这一版，返回 {"variants":[一个版本]}。'+(rules[payload.action]||''):'生成三个真正不同的原创版本，依次为知识解释型、痛点切入型、观点表达型，返回 {"variants":[三个版本]}。')+' 每个版本包含 angle,title,coverTitle,hook,body,cta,tags,estimatedDuration，均为非空字符串。'+(payload.action==='shorter'?'':('body 去除空白后目标为 '+range[0]+'-'+range[1]+' 个中文字符。'))+' 平台 '+payload.platform+'、语气 '+payload.tone+'。';
  }
  function mapFailure(status){
    if(status===401||status===403)return providerError('AUTH_FAILED','认证失败，请检查 API Key。',status);
    if(status===404)return providerError('MODEL_NOT_FOUND','模型或接口地址不存在，请检查 Model 和 Base URL。',status);
    if(status===429)return providerError('RATE_LIMITED','请求过于频繁或额度不足（429）。',status);
    return providerError('PROVIDER_REQUEST_FAILED','模型服务请求失败（HTTP '+status+'）。',status);
  }
  function chat(config,messages,options){
    var checked=TextAIProvider.validate(config);if(!checked.valid)return Promise.reject(providerError('PROVIDER_NOT_CONFIGURED','请先在 设置 → 文字模型 API 中配置模型服务。'));
    config=checked.config;var controller=typeof AbortController==='function'?new AbortController():null,start=Date.now(),timer=setTimeout(function(){if(controller)controller.abort();},(options&&options.timeoutMs)||TIMEOUT_MS);if(controller)activeControllers.push(controller);
    return fetch(endpoint(config.baseUrl),{method:'POST',signal:controller?controller.signal:undefined,headers:{'Authorization':'Bearer '+config.apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:config.model,messages:messages,temperature:options&&options.temperature!=null?options.temperature:0.3,max_tokens:options&&options.maxTokens||undefined})})
      .then(function(response){if(!response.ok)throw mapFailure(response.status);return response.json();})
      .then(function(body){var content=body&&body.choices&&body.choices[0]&&body.choices[0].message&&body.choices[0].message.content;if(typeof content!=='string')throw providerError('INVALID_RESPONSE','模型返回内容为空。');return {content:content,latency:Date.now()-start,provider:config.providerId,model:config.model};})
      .catch(function(error){if(error&&error.name==='AbortError')throw providerError('TIMEOUT','连接超时，请检查网络或 Base URL。');if(error&&error.code)throw error;throw providerError('NETWORK_ERROR','网络失败或 Provider 不允许浏览器直连。该 Provider 可能需要代理模式。');})
      .finally(function(){clearTimeout(timer);if(controller){var index=activeControllers.indexOf(controller);if(index>=0)activeControllers.splice(index,1);}});
  }
  function invoke(action,payload){var config=TextAIProvider.getCurrentConfig();return chat(config,[{role:'system',content:instructions(action,payload)},{role:'user',content:JSON.stringify(payload)}],{temperature:0.5}).then(function(result){return {data:normalizeVariants(safeJson(result.content)),meta:result};});}
  function testConnection(config){return chat(config,[{role:'user',content:'Reply with OK.'}],{temperature:0,maxTokens:8,timeoutMs:15000}).then(function(result){return {ok:true,provider:result.provider,model:result.model,latency:result.latency};});}
  window.TextAIProviderAdapter={testConnection:testConnection,analyzeContent:function(config,work){return invoke('analyzeContent',work);},generateScript:function(config,options){return invoke('generateScript',options);},rewriteScript:function(config,options){options=Object.assign({},options,{action:options.action||'rewrite'});return invoke('generateScript',options);},request:invoke,abortAll:function(){activeControllers.splice(0).forEach(function(controller){try{controller.abort();}catch(e){}});},_test:{endpoint:endpoint,safeJson:safeJson,instructions:instructions,mapFailure:mapFailure}};
})();
