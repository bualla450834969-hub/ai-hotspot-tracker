'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('v8/shared/core/radar.js', 'utf8');
const values = new Map();
const context = {
  window: {},
  StorageAdapter: {
    getJSON(key, fallback) { return values.has(key) ? values.get(key) : fallback; },
    setJSON(key, value) { values.set(key, value); return true; }
  },
  IndustryStore: {getCurrent() { return {id:'ai', name:'AI'}; }},
  DOMAIN_CONFIG: {display_name:'AI', collect_keywords:['AI Agent']},
  fetch() { throw new Error('network not used'); },
  console,
  Date,
  Promise,
  encodeURIComponent
};
context.window = context;
vm.runInNewContext(source, context);

const api = context.RadarAdapters.social._test;
const fixture = {
  works: [
    {workId:'1', sourceKeywords:['AI Agent'], likeCount:100, collectCount:20, commentCount:10, shareCount:5},
    {workId:'2', sourceKeywords:['AI Agent'], likeCount:200, collectCount:30, commentCount:20, shareCount:10},
    {workId:'1', sourceKeywords:['AI Agent'], likeCount:100, collectCount:20, commentCount:10, shareCount:5}
  ],
  hotwords: [{keyword:'AI Agent', total:1602311}]
};
const aggregated = api.aggregateSocial(fixture);
const item = aggregated.items[0];
assert.strictEqual(item.sampleWorks, 2);
assert.strictEqual(item.likes, 300);
assert.strictEqual(item.collects, 50);
assert.strictEqual(item.comments, 30);
assert.strictEqual(item.shares, 15);
assert.strictEqual(item.maxLike, 200);
assert.strictEqual(item.searchTotal, 1602311);
assert.strictEqual(item.works, undefined);
assert.strictEqual(aggregated.contractErrors.length, 0);
assert(item.sampleWorks <= fixture.works.length);

const multiPlatform = api.aggregateSocial({
  works: fixture.works,
  hotwords: [{keyword:'AI Agent', total:1000, platform:'douyin'}, {keyword:'AI Agent', total:311, platform:'xiaohongshu'}]
});
assert.strictEqual(multiPlatform.items.length, 1);
assert.strictEqual(multiPlatform.items[0].searchTotal, 1311);

const v3Key = api.socialSnapshotKey('ai');
values.set('radar_snapshots__ai', [{works:1602311, likes:0}]);
values.set('radar_social_v2__ai', [{schemaVersion:2, items:[{id:'AI Agent', sampleWorks:40}]}]);
values.set(v3Key, [{schemaVersion:2, items:[{id:'AI Agent', sampleWorks:40}]}]);
assert.strictEqual(api.socialSnapshots('ai').length, 0, 'V1/V2 snapshots must be ignored');

const oldItem = {id:'AI Agent', sampleWorks:1, likes:100, collects:10, comments:5, shares:2, maxLike:100, searchTotal:1602311};
api.saveSocialSnapshot('ai', [oldItem], Date.parse('2026-09-27T08:00:00Z'));
assert.strictEqual(api.socialSnapshots('ai').length, 1);
assert.strictEqual(api.socialSnapshots('ai')[0].schemaVersion, 3);

const current = [{id:'AI Agent', sampleWorks:2, likes:300, collects:50, comments:30, shares:15, maxLike:200, searchTotal:1602311}];
api.applySocialTrend(current, api.socialSnapshots('ai')[0]);
assert.strictEqual(current[0].sampleWorksDelta, 1);
assert.strictEqual(current[0].engagementDelta, 369);
assert.strictEqual(current[0].trend, '快速升温');

const zeroHistory = [{id:'new', sampleWorks:1, likes:0, collects:0, comments:0, shares:0}];
api.applySocialTrend(zeroHistory, {items:[{id:'new', sampleWorks:0, likes:0, collects:0, comments:0, shares:0}]});
assert.strictEqual(zeroHistory[0].trend, '数据不足');

api.saveSocialSnapshot('local:烘焙', [{id:'烘焙', sampleWorks:1, likes:8, collects:2, comments:1, shares:0}], Date.parse('2026-09-27T08:00:00Z'));
assert.strictEqual(api.socialSnapshots('ai').length, 1);
assert.strictEqual(api.socialSnapshots('local:烘焙').length, 1);
assert.notStrictEqual(api.socialSnapshotKey('ai'), api.socialSnapshotKey('local:烘焙'));

const noSample = api.aggregateSocial({works:[], hotwords:[{keyword:'AI PPT', total:1602587}]}).items[0];
assert.strictEqual(noSample.sampleWorks, 0);
assert.strictEqual(noSample.likes, 0);
assert.strictEqual(noSample.searchTotal, 1602587);

const attribution = api.aggregateSocial({
  works: [
    {workId:'1', sourceKeywords:['AI PPT'], likeCount:100},
    {workId:'2', sourceKeywords:['AI PPT','AI工具'], likeCount:200},
    {workId:'3', sourceKeywords:['AI工具'], likeCount:300},
    {workId:'4', sourceKeywords:[], likeCount:999},
    {workId:'2', sourceKeywords:['AI工具'], likeCount:200}
  ],
  hotwords: [{keyword:'AI PPT',total:10},{keyword:'AI工具',total:20}]
});
const ppt = attribution.items.find(entry => entry.id === 'AI PPT');
const tools = attribution.items.find(entry => entry.id === 'AI工具');
assert.deepStrictEqual([ppt.sampleWorks,ppt.likes],[2,300]);
assert.deepStrictEqual([tools.sampleWorks,tools.likes],[2,500]);
assert.strictEqual(attribution.metrics.totalWorks,4);
assert.strictEqual(attribution.metrics.attributedWorks,3);
assert.strictEqual(attribution.metrics.unattributedWorks,1);
assert.strictEqual(attribution.metrics.attributionErrors,0);
assert.strictEqual(attribution.metrics.attributionSuspect,false);

const reused = [];
const reusedHotwords = [];
for (let keywordIndex=0; keywordIndex<10; keywordIndex++) {
  const keyword = 'K' + keywordIndex;
  reusedHotwords.push({keyword,total:40});
  for (let workIndex=0; workIndex<40; workIndex++) reused.push({workId:'same-'+workIndex,sourceKeywords:[keyword]});
}
assert.strictEqual(api.aggregateSocial({works:reused,hotwords:reusedHotwords}).metrics.attributionSuspect,true);

assert(source.includes("SOCIAL_SNAPSHOT_PREFIX='radar_social_v3__'"));
assert(!source.includes('item.total||0),likes'));
const radarView = fs.readFileSync('v8/shared/modules/techradar.js', 'utf8');
assert(!radarView.includes('平台检索规模'), 'Cross-platform search totals must not be shown as a comparable Radar metric');
const appSource = fs.readFileSync('v8/shared/app.html', 'utf8');
assert(appSource.includes('JSON.stringify({platform:platform, keyword:keyword,'), 'Each RedFox request must send the loop keyword');
assert(appSource.includes('nw.sourceKeywords=[job.kw]'), 'Collected works must retain their exact query keyword');
assert(appSource.includes("console.info('[RADAR_QUERY]'"), 'Debug collection logs must include the query provenance');
console.log('V8.3.2 Social Radar metric contract tests: PASS');
