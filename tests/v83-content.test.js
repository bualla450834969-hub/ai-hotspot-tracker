'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const storage = new Map();
const context = {
  console, Promise, setTimeout, clearTimeout, AbortController,
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
const work={workId:'w-1',title:'真实作品',caption:'真实正文',likeCount:10,commentCount:2,_keyword:'测试'};
assert.strictEqual(adapter._test.cleanWork(work).title,'真实作品');
assert.strictEqual(adapter._test.cleanWork(work).content,'真实正文');
assert.strictEqual(adapter._test.cleanWork(work).metrics.likes,10);
assert(adapter._test.analysisKey(work).includes('ai'));
context.industryId='shufa';
assert(adapter._test.analysisKey(work).includes('shufa'));

(async()=>{
  adapter.setProxyUrl('https://proxy.example/content-ai');
  let calls=0;
  const analysis={topic:'a',hook:'b',angle:'c',keyPoints:['d'],structure:'e',interactionReasons:['f'],reusablePattern:'g',limitations:'h'};
  context.fetch=async(url,opts)=>{calls++;assert.strictEqual(url,'https://proxy.example/content-ai');const req=JSON.parse(opts.body);assert.strictEqual(req.action,'analyzeContent');assert(!JSON.stringify(req).toLowerCase().includes('apikey'));return {ok:true,json:async()=>({data:analysis})};};
  const first=await adapter.analyzeContent(work);assert.strictEqual(first.cached,false);
  const second=await adapter.analyzeContent(work);assert.strictEqual(second.cached,true);assert.strictEqual(calls,1);
  context.fetch=async(url,opts)=>{const req=JSON.parse(opts.body);assert.strictEqual(req.action,'translateDescriptions');return {ok:true,json:async()=>({data:{translations:[{id:'repo-1',text:'中文项目简介'}]}})};};
  const repos=await adapter.translateDescriptions([{id:'repo-1',description:'English project description'}]);
  assert.strictEqual(repos[0].descriptionZh,'中文项目简介');assert.strictEqual(repos[0].descriptionOriginal,'English project description');
  context.fetch=async()=>{throw new Error('translation should use cache');};
  const translatedCached=await adapter.translateDescriptions([{id:'repo-1',description:'English project description'}]);assert.strictEqual(translatedCached[0].descriptionZh,'中文项目简介');
  context.industryId='industry-a';
  let release;
  context.fetch=()=>new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({data:analysis})});});
  const stale=adapter.analyzeContent({workId:'stale-work',title:'旧行业作品'});
  context.industryId='industry-b';release();
  await assert.rejects(stale,error=>error&&error.code==='STALE_RESPONSE');
  assert(adapter._test.analysisKey(work,'industry-a').includes('industry-a'));
  assert(adapter._test.analysisKey(work,'industry-b').includes('industry-b'));
  context.industryId='shufa';
  const variant=i=>({angle:'angle'+i,title:'t'+i,coverTitle:'c'+i,hook:'h'+i,body:'s'+i,cta:'a'+i,tags:'#x',estimatedDuration:'60秒'});
  context.fetch=async()=>({ok:true,json:async()=>({data:{variants:[1,2,3].map(variant)}})});
  const result=await adapter.generateScript({work,analysis:first.analysis,duration:60,platform:'douyin',tone:'natural'});assert.strictEqual(result.variants.length,3);
  const cached=await adapter.generateScript({work,analysis:first.analysis,duration:60,platform:'douyin',tone:'natural'});assert.strictEqual(cached.cached,true);
  context.fetch=async()=>({ok:true,json:async()=>({data:{variants:[variant(4)]}})});
  const refined=await adapter.generateScript({work,analysis:first.analysis,action:'shorter',currentScript:'current'});assert.strictEqual(refined.variants.length,1);
  const source=fs.readFileSync(path.join(root,'v8/shared/modules/hotContent.js'),'utf8');
  assert(source.includes('当前仅采集到标题与互动指标'));
  assert(source.includes('生成原创口播'));
  console.log('V8.3 content adapter tests: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
