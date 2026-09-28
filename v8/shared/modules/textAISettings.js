/* ===== modules/textAISettings.js ===== */
(function(){
  'use strict';
  var lastConnection=null;
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function field(id){var element=document.getElementById(id);return element?String(element.value||'').trim():'';}
  function currentForm(){var saved=TextAIProvider.getCurrentConfig();return {providerId:field('textAIProvider'),providerType:'openai-compatible',baseUrl:field('textAIBaseUrl'),apiKey:field('textAIKey')||(saved&&saved.apiKey)||'',model:field('textAIModel')};}
  function statusHtml(config){
    if(!config)return '<div class="text-ai-status is-empty"><strong>尚未配置文字模型</strong><span>配置后即可使用 AI 内容拆解、口播生成和快捷改写。</span></div>';
    var connection=config.connection||{status:'untested'},label=connection.status==='success'?'测试成功':(connection.status==='failed'?'测试失败':'未测试'),tone=connection.status==='success'?'is-success':(connection.status==='failed'?'is-error':'is-pending');
    return '<div class="text-ai-status '+tone+'"><strong>'+esc((PROVIDER_PRESETS[config.providerId]||{}).name||config.providerId)+' · '+esc(config.model)+'</strong><span>连接状态：'+label+' · Key：'+esc(TextAIProvider.maskKey(config.apiKey))+'</span></div>';
  }
  function render(){
    var host=document.getElementById('textAISettings');if(!host||!window.TextAIProvider)return;
    var config=TextAIProvider.getCurrentConfig(),provider=config&&config.providerId||'xiaomi-mimo',preset=PROVIDER_PRESETS[provider]||PROVIDER_PRESETS['openai-compatible'];
    host.innerHTML='<div class="text-ai-heading"><div><h3>文字模型 API</h3><p>使用自己的 API，配置对所有行业生效。</p></div><span class="text-ai-mode">浏览器直连</span></div>'+statusHtml(config)+
      '<div class="text-ai-form">'+
      '<label>Provider<select id="textAIProvider" class="industry-flow-input"><option value="xiaomi-mimo">Xiaomi MiMo</option><option value="openai-compatible">OpenAI-Compatible</option><option value="custom">Custom</option></select></label>'+
      '<label>API Base URL<input id="textAIBaseUrl" class="industry-flow-input" type="url" autocomplete="off" value="'+esc(config&&config.baseUrl||preset.baseUrl||'')+'" placeholder="https://provider.example/v1"></label>'+
      '<label>API Key<div class="text-ai-key-row"><input id="textAIKey" class="industry-flow-input" type="password" autocomplete="new-password" placeholder="'+esc(config?TextAIProvider.maskKey(config.apiKey):'输入 API Key')+'"><button type="button" data-text-ai-action="toggle-key" aria-label="显示 API Key" title="显示或隐藏 API Key">显示</button></div></label>'+
      '<label>Model<input id="textAIModel" class="industry-flow-input" type="text" autocomplete="off" value="'+esc(config&&config.model||'')+'" placeholder="'+esc(preset.modelPlaceholder||'model id')+'"></label>'+
      '<p class="text-ai-provider-note" id="textAIProviderNote">'+esc(preset.modelGuide||'')+'</p><div class="text-ai-result" id="textAIResult" aria-live="polite"></div>'+
      '<div class="text-ai-actions"><button type="button" data-text-ai-action="test">测试连接</button><button type="button" class="v82-primary" data-text-ai-action="save">保存配置</button><button type="button" class="is-danger" data-text-ai-action="clear">清除 API 配置</button></div></div>'+
      '<p class="text-ai-security">API Key 仅保存在当前浏览器，用于调用你选择的模型服务。请勿在公共电脑保存长期有效的 API Key。</p>'+
      '<details class="text-ai-guide"><summary>如何获取 API Key？</summary><ol><li>选择一个文字模型 Provider</li><li>前往 Provider 官网注册</li><li>创建 API Key</li><li>复制 API Key</li><li>返回本页面</li><li>填入 API Key 和 Model</li><li>点击测试连接</li></ol><p id="textAIGuideText">'+esc(preset.apiKeyGuide||'')+'</p></details>';
    document.getElementById('textAIProvider').value=provider;
  }
  function updatePreset(){var id=field('textAIProvider'),preset=PROVIDER_PRESETS[id]||PROVIDER_PRESETS.custom,base=document.getElementById('textAIBaseUrl'),model=document.getElementById('textAIModel');if(base)base.value=preset.baseUrl||'';if(model){model.value='';model.placeholder=preset.modelPlaceholder||'model id';}var note=document.getElementById('textAIProviderNote'),guide=document.getElementById('textAIGuideText');if(note)note.textContent=preset.modelGuide||'';if(guide)guide.textContent=preset.apiKeyGuide||'';lastConnection=null;}
  function result(message,type){var host=document.getElementById('textAIResult');if(host){host.className='text-ai-result '+(type||'');host.textContent=message;}}
  function test(){var config=currentForm(),checked=TextAIProvider.validate(config);if(!checked.valid){result('请填写：'+checked.missing.join('、'),'is-error');return;}result('正在测试最小连接请求…','is-pending');TextAIProviderAdapter.testConnection(config).then(function(value){lastConnection={status:'success',provider:value.provider,model:value.model,latency:value.latency};result('连接成功 · Provider：'+value.provider+' · Model：'+value.model+' · Latency：'+value.latency+'ms','is-success');}).catch(function(error){lastConnection={status:'failed',code:error&&error.code||'UNKNOWN'};result(error&&error.message||'连接失败。','is-error');});}
  function save(){var saved=TextAIProvider.saveConfig(currentForm());if(!saved.valid){result('请填写：'+saved.missing.join('、'),'is-error');return;}if(lastConnection)TextAIProvider.setConnection(lastConnection);render();result('配置已保存，仅存于当前浏览器。','is-success');}
  function clear(){TextAIProvider.clearConfig();lastConnection=null;render();result('文字模型配置已清除。','is-success');}
  document.addEventListener('click',function(event){var button=event.target.closest&&event.target.closest('[data-text-ai-action]');if(!button)return;var action=button.getAttribute('data-text-ai-action');if(action==='toggle-key'){var input=document.getElementById('textAIKey');if(input){input.type=input.type==='password'?'text':'password';button.textContent=input.type==='password'?'显示':'隐藏';button.setAttribute('aria-label',button.textContent+' API Key');}}else if(action==='test')test();else if(action==='save')save();else if(action==='clear')clear();});
  document.addEventListener('change',function(event){if(event.target&&event.target.id==='textAIProvider')updatePreset();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
  window.TextAISettings={render:render};
})();
