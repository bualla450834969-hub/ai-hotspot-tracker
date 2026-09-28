const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const root = process.cwd();
const app = fs.readFileSync(root + '/v8/shared/app.html', 'utf8');
const normalize = fs.readFileSync(root + '/v8/shared/data/normalize.js', 'utf8');
const radar = fs.readFileSync(root + '/v8/shared/core/radar.js', 'utf8');

assert(!app.includes('findSectionByTitle'));
assert(!app.includes('function move(id, targetSec)'));
assert(!app.includes('fillExtraCards'));
assert(!app.includes('TimerManager.setTimeout(run, 1600)'));
assert(app.includes("topics:['topicsGrid','kanbanBoard','topicTracker','crossPlatform','topicPerfContent','saturationList','commentDemands','commentKw']"));
assert(!app.includes("breakdown:['breakdownGrid','matrixGrid','viralGenes','saturationList','commentDemands','commentKw'"));
assert(app.includes('var completionRate=[]'));
assert(app.includes('var commentScripts=[]'));
assert(!normalize.includes('Math.random()'));

const values = new Map();
const context = {
  window: {},
  StorageAdapter: {
    getJSON(key, fallback) { return values.has(key) ? values.get(key) : fallback; },
    setJSON(key, value) { values.set(key, value); return true; }
  },
  IndustryStore: { getCurrent() { return {id:'ind_design', name:'工业设计'}; } },
  DOMAIN_CONFIG: {display_name:'工业设计', collect_keywords:['产品设计']},
  fetch() { throw new Error('not used'); },
  Date,
  Promise,
  encodeURIComponent
};
context.window = context;
vm.runInNewContext(radar, context);
const social = context.RadarProfileService.getCurrent();
assert.strictEqual(social.sources.social.enabled, true);
assert.strictEqual(social.sources.github.enabled, false);
assert.strictEqual(context.RadarProfileService.get('ind_design').industryId, 'ind_design');
context.IndustryStore.getCurrent = () => ({id:'ind_agent', name:'Agent 工具'});
context.DOMAIN_CONFIG = {display_name:'Agent 工具', collect_keywords:['LLM']};
const github = context.RadarProfileService.getCurrent();
assert.strictEqual(github.sources.github.enabled, true);

const socialData = {hotwords:[{keyword:'CMF', total:12, max_like:500}], works:[{workId:'cmf-1', _keyword:'CMF', likeCount:20}]};
context.RadarAdapters.social.load(social, socialData).then(first => {
  assert.strictEqual(first.items[0].trend, '当前样本');
  const snapshotKey = [...values.keys()].find(key => key.startsWith('radar_social_v2__'));
  const list = values.get(snapshotKey);
  list.unshift({schemaVersion:2,timestamp:'2026-09-26T00:00:00.000Z',date:'2026-09-26',source:'social',items:[{id:'CMF',sampleWorks:1,likes:10,collects:0,comments:0,shares:0,maxLike:10,searchTotal:12}]});
  values.set(snapshotKey, list);
  return context.RadarAdapters.social.load(social, socialData);
}).then(second => {
  assert.strictEqual(second.items[0].trend, '快速升温');
  console.log('V8.3.1 UI and radar tests: PASS');
}).catch(error => { console.error(error); process.exitCode = 1; });
