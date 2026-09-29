'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const storage=new Map();
let fetchImpl;
const context={console,Promise,setTimeout,clearTimeout,AbortController,Date,JSON,fetch:(...args)=>fetchImpl(...args),window:{}};
context.window=context;
context.StorageAdapter={getRaw:(key,fallback)=>storage.has(key)?storage.get(key):fallback,setRaw:(key,value)=>{storage.set(key,String(value));return true;},getJSON:(key,fallback)=>storage.has(key)?JSON.parse(storage.get(key)):fallback,setJSON:(key,value)=>{storage.set(key,JSON.stringify(value));return true;},remove:key=>{storage.delete(key);return true;}};
context.IndustryStore={getCurrent:()=>({id:'ai'})};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'v8/shared/core/textAIProvider.js'),'utf8'),context);
const provider=context.TextAIProvider,adapter=context.TextAIProviderAdapter;

assert.strictEqual(provider.getCurrentConfig(),null);
assert.strictEqual(provider.isConfigured(),false);
assert.deepStrictEqual(Object.keys(context.TEXT_PROVIDER_PRESETS),['openai','claude','gemini','deepseek','qwen','doubao','xiaomi-mimo','openai-compatible','custom']);
assert.strictEqual(provider.getPreset('xiaomi-mimo').baseUrl,'https://api.xiaomimimo.com/v1');
assert.strictEqual(adapter._test.endpoint('https://provider.test/v1/'),'https://provider.test/v1/chat/completions');
assert.strictEqual(adapter._test.endpoint('https://provider.test/chat/completions'),'https://provider.test/chat/completions');

const config={providerId:'openai-compatible',baseUrl:'https://provider.test/v1',apiKey:'sk-private-value',model:'model-a'};
assert.strictEqual(provider.saveConfig(config).valid,true);
assert.strictEqual(provider.getCurrentConfig().apiKey,'sk-private-value');
assert.strictEqual(provider.maskKey('sk-private-value'),'****alue');
assert(!JSON.stringify(context.PROVIDER_PRESETS).includes('sk-private-value'));

(async()=>{
  let request;
  fetchImpl=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({choices:[{message:{content:'OK'}}]})};};
  const tested=await adapter.testConnection(config);
  assert.strictEqual(tested.ok,true);
  assert.strictEqual(request.url,'https://provider.test/v1/chat/completions');
  assert.strictEqual(request.options.headers.Authorization,'Bearer sk-private-value');
  assert.strictEqual(JSON.parse(request.options.body).model,'model-a');

  const claude={providerId:'claude',baseUrl:'https://api.anthropic.com/v1',apiKey:'claude-placeholder',model:'claude-sonnet-4-6'};
  fetchImpl=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({content:[{text:'OK'}]})};};
  assert.strictEqual((await adapter.testConnection(claude)).ok,true);
  assert.strictEqual(request.url,'https://api.anthropic.com/v1/messages');
  assert.strictEqual(request.options.headers['anthropic-version'],'2023-06-01');
  const gemini={providerId:'gemini',baseUrl:'https://generativelanguage.googleapis.com/v1beta',apiKey:'gemini-placeholder',model:'gemini-3.8-flash'};
  fetchImpl=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'OK'}]}}]})};};
  assert.strictEqual((await adapter.testConnection(gemini)).ok,true);
  assert(request.url.includes('/models/gemini-3.8-flash:generateContent'));
  assert.strictEqual(request.options.headers['x-goog-api-key'],'gemini-placeholder');

  provider.saveConfig(claude);provider.selectProvider('openai-compatible');
  assert.strictEqual(provider.getCurrentConfig().model,'model-a');
  provider.selectProvider('claude');assert.strictEqual(provider.getCurrentConfig().model,'claude-sonnet-4-6');
  provider.selectProvider('openai-compatible');

  fetchImpl=async()=>({ok:false,status:401});
  await assert.rejects(adapter.testConnection(config),error=>error.code==='AUTH_FAILED'&&!error.message.includes('sk-private-value'));
  fetchImpl=async()=>({ok:false,status:404});
  await assert.rejects(adapter.testConnection(config),error=>error.code==='MODEL_NOT_FOUND');
  fetchImpl=async()=>({ok:false,status:429});
  await assert.rejects(adapter.testConnection(config),error=>error.code==='RATE_LIMITED');
  fetchImpl=async()=>{throw new TypeError('blocked by CORS with secret sk-private-value');};
  await assert.rejects(adapter.testConnection(config),error=>error.code==='NETWORK_ERROR'&&!error.message.includes('sk-private-value'));

  provider.clearConfig();
  assert.strictEqual(provider.getCurrentConfig(),null);
  assert.strictEqual(provider.isConfigured(),false);
  vm.runInContext(fs.readFileSync(path.join(root,'v8/shared/core/contentAI.js'),'utf8'),context);
  await assert.rejects(context.ContentAIAdapter.analyzeContent({workId:'no-provider',title:'未配置'}),error=>error.code==='PROVIDER_NOT_CONFIGURED');
  provider.saveConfig(config);
  const analysis={topic:'主题',hook:'开头',angle:'角度',keyPoints:['要点'],structure:'结构',interactionReasons:['互动'],reusablePattern:'模式',limitations:'限制'};
  fetchImpl=async(url,options)=>{const body=JSON.parse(options.body),system=body.messages[0].content;if(system.includes('topic,hook'))return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(analysis)}}]})};const variants=[1,2,3].map(i=>({angle:'角度'+i,title:'标题'+i,coverTitle:'封面'+i,hook:'开头'+i,body:'正文'+i,cta:'行动'+i,tags:'#AI',estimatedDuration:'60秒'}));return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({variants})}}]})};};
  const analyzed=await context.ContentAIAdapter.analyzeContent({workId:'byok-work',title:'真实标题',caption:'真实正文'});
  assert.strictEqual(analyzed.analysis.topic,'主题');
  const generated=await context.ContentAIAdapter.generateScript({work:{workId:'byok-work-2',title:'真实标题'},analysis:analyzed.analysis,duration:60,platform:'douyin',tone:'natural'});
  assert.strictEqual(generated.variants.length,3);
  provider.clearConfig();
  const source=fs.readFileSync(path.join(root,'v8/shared/modules/textAISettings.js'),'utf8');
  assert(source.includes('type="password"'));
  assert(source.includes('API Key 仅保存在当前浏览器'));
  assert(!source.includes('sk-private-value'));
  console.log('V8.4 text AI provider tests: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
