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
    {workId:'1', _keyword:'AI Agent', likeCount:100, collectCount:20, commentCount:10, shareCount:5},
    {workId:'2', keyword:'AI Agent', likeCount:200, collectCount:30, commentCount:20, shareCount:10},
    {workId:'1', _keyword:'AI Agent', likeCount:100, collectCount:20, commentCount:10, shareCount:5}
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

const v2Key = api.socialSnapshotKey('ai');
values.set('radar_snapshots__ai', [{works:1602311, likes:0}]);
values.set(v2Key, [{schemaVersion:1, items:[{id:'AI Agent', works:1602311}]}]);
assert.strictEqual(api.socialSnapshots('ai').length, 0, 'V1 snapshots must be ignored');

const oldItem = {id:'AI Agent', sampleWorks:1, likes:100, collects:10, comments:5, shares:2, maxLike:100, searchTotal:1602311};
api.saveSocialSnapshot('ai', [oldItem], Date.parse('2026-09-27T08:00:00Z'));
assert.strictEqual(api.socialSnapshots('ai').length, 1);
assert.strictEqual(api.socialSnapshots('ai')[0].schemaVersion, 2);

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

assert(source.includes("SOCIAL_SNAPSHOT_PREFIX='radar_social_v2__'"));
assert(!source.includes('item.total||0),likes'));
console.log('V8.3.2 Social Radar metric contract tests: PASS');
