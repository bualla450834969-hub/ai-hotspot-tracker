'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const storage = new Map();
const context = {
  console, Promise,
  window: {},
  localStorage: { getItem:k=>storage.has(k)?storage.get(k):null, setItem:(k,v)=>storage.set(k,String(v)), removeItem:k=>storage.delete(k) },
  fetch: null
};
context.window = context;
context.StorageAdapter = {
  getRaw:(k,d)=>storage.has(k)?storage.get(k):d,
  setRaw:(k,v)=>{storage.set(k,String(v));return true;},
  getJSON:(k,d)=>storage.has(k)?JSON.parse(storage.get(k)):d,
  setJSON:(k,v)=>{storage.set(k,JSON.stringify(v));return true;}
};
context.IndustryStore = { getCurrent:()=>({id:context.industryId||'ai'}) };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'v8/shared/core/contentAI.js'),'utf8'), context);

const adapter=context.ContentAIAdapter;
const work={workId:'w-1',title:'真实作品',content:'真实正文',likeCount:10,commentCount:2,_keyword:'测试'};
assert.strictEqual(adapter._test.cleanWork(work).title,'真实作品');
assert.strictEqual(adapter._test.cleanWork(work).likes,10);
assert(adapter._test.cacheKey(work).includes('ai'));
context.industryId='shufa';
assert(adapter._test.cacheKey(work).includes('shufa'));

(async()=>{
  await assert.rejects(()=>adapter.analyzeContent(work),e=>e.code==='PROVIDER_NOT_CONFIGURED');
  adapter.setProxyUrl('https://proxy.example/content-ai');
  let calls=0;
  context.fetch=async(url,opts)=>{calls++;assert.strictEqual(url,'https://proxy.example/content-ai');const req=JSON.parse(opts.body);assert.strictEqual(req.action,'analyzeContent');assert(!JSON.stringify(req).toLowerCase().includes('apikey'));return {ok:true,json:async()=>({data:{successReason:'a',hook:'b',structure:'c',emotion:'d',reusableMethod:'e'}})};};
  const first=await adapter.analyzeContent(work);assert.strictEqual(first.cached,false);
  const second=await adapter.analyzeContent(work);assert.strictEqual(second.cached,true);assert.strictEqual(calls,1);
  context.fetch=async()=>({ok:true,json:async()=>({data:{scripts:[1,2,3].map(i=>({title:'t'+i,coverTitle:'c'+i,hook:'h'+i,script:'s'+i,cta:'a'+i,hashtags:'#x',estimatedDuration:'60秒'}))}})});
  const result=await adapter.generateScript({work,analysis:first.analysis,duration:60,platform:'douyin',tone:'natural'});assert.strictEqual(result.scripts.length,3);
  context.fetch=async()=>({ok:true,json:async()=>({data:{script:{title:'t',coverTitle:'c',hook:'h',script:'s',cta:'a',hashtags:'#x',estimatedDuration:'30秒'}}})});
  const refined=await adapter.generateScript({work,analysis:first.analysis,action:'shorter',currentScript:'current'});assert.strictEqual(refined.scripts.length,1);
  const source=fs.readFileSync(path.join(root,'v8/shared/modules/hotContent.js'),'utf8');
  assert(source.includes('当前仅采集到标题与互动指标'));
  assert(source.includes('生成原创口播'));
  console.log('V8.3 content adapter tests: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
