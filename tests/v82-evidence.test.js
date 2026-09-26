'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'v8', 'shared', 'core', 'evidence.js'), 'utf8');
const context = { window: {}, Map, Set, URL, encodeURIComponent, isFinite, Date, Math };
vm.createContext(context);
vm.runInContext(source, context);
const api = context.window.V82Evidence;

function fixture(overrides) {
  return Object.assign({
    last_update: '2026-09-25T00:00:00Z',
    works: [
      { workId:'w1', title:'新手烘焙教程', accountName:'A', platform:'douyin', likeCount:10, commentCount:2, collectCount:3, shareCount:1, workUrl:'https://example.com/w1', _keyword:'烘焙教程' },
      { workId:'w2', title:'烘焙避坑', accountName:'B', platform:'xiaohongshu', likeCount:20, commentCount:4, collectCount:6, shareCount:2, workUrl:'https://example.com/w2', _keyword:'烘焙教程' }
    ],
    hotwords: [{ keyword:'烘焙教程', platform:'douyin', works_count:2 }],
    comments: [],
    historical_trend: []
  }, overrides || {});
}

function test(name, fn) {
  try { fn(); console.log('ok - ' + name); }
  catch (error) { console.error('not ok - ' + name); throw error; }
}

test('stable evidence and insight ids are reproducible', () => {
  const one = api.buildAnalysis(fixture());
  const two = api.buildAnalysis(fixture());
  assert.deepStrictEqual(Array.from(one.evidenceStore.byId.keys()), Array.from(two.evidenceStore.byId.keys()));
  assert.deepStrictEqual(one.insights.map(item => item.id), two.insights.map(item => item.id));
});

test('insight links back to real evidence', () => {
  const result = api.buildAnalysis(fixture());
  assert.strictEqual(result.insights.length, 1);
  assert.strictEqual(result.evidenceStore.getEvidenceByInsight(result.insights[0].id).length, 2);
  assert.strictEqual(result.insights[0].sourceType, 'DERIVED');
});

test('formal insight without evidence is blocked', () => {
  const store = new api.EvidenceStore();
  assert.strictEqual(api.createInsight({ type:'trend', sourceType:'DERIVED', title:'x', evidenceIds:[] }, store), null);
});

test('comments and history quality gates report data insufficient', () => {
  const result = api.buildAnalysis(fixture());
  assert.strictEqual(Array.from(result.unsupportedInsights, item => item.type).sort().join(','), 'trend,user_voice');
  assert.strictEqual(result.dataQuality.availableSignals.userVoice, false);
  assert.strictEqual(result.dataQuality.availableSignals.trend, false);
});

test('empty works and hotwords do not create unsupported claims', () => {
  const result = api.buildAnalysis(fixture({ works:[], hotwords:[] }));
  assert.strictEqual(result.evidenceStore.count(), 0);
  assert.strictEqual(result.insights.length, 0);
  assert.strictEqual(result.dataQuality.worksCount, 0);
});

test('missing url and metrics remain explicit null values', () => {
  const result = api.buildAnalysis(fixture({ works:[{ title:'无链接作品', platform:'douyin', _keyword:'测试' }], hotwords:[] }));
  const work = result.evidenceStore.getEvidenceByType('work')[0];
  assert.strictEqual(work.url, null);
  assert.strictEqual(work.metrics.likes, null);
  assert.ok(result.dataQuality.missingFields.includes('works.url'));
});

test('legacy aliases and corrupt entries are handled safely', () => {
  const data = fixture({
    works:[null, 'broken', { name:'旧标题', author:'旧作者', likes:'12', comments:'bad', collects:5, shares:1, url:'https://example.com/legacy', keyword:'旧关键词' }],
    hotwords:[null, 'broken', { keyword:'旧关键词' }], comments:[{}, { content:'真实评论', likeCount:3 }]
  });
  const result = api.buildAnalysis(data);
  assert.strictEqual(result.dataQuality.worksCount, 1);
  assert.strictEqual(result.dataQuality.commentsCount, 1);
  assert.strictEqual(result.evidenceStore.getEvidenceByType('work')[0].metrics.comments, null);
});

test('distinct source ids prevent duplicate-title evidence collisions', () => {
  const result = api.buildAnalysis(fixture({ works:[
    { workId:'same-1', title:'同标题', platform:'douyin', _keyword:'书法' },
    { workId:'same-2', title:'同标题', platform:'douyin', _keyword:'书法' }
  ], hotwords:[] }));
  assert.strictEqual(result.dataQuality.worksCount, 2);
  assert.strictEqual(result.evidenceStore.getEvidenceByType('work').length, 2);
});

test('923 works are indexed once within a practical budget', () => {
  const works = Array.from({ length:923 }, (_, index) => ({
    workId:'bulk-' + index, title:'作品 ' + index, platform:index % 2 ? 'douyin' : 'xiaohongshu',
    likeCount:index, workUrl:'https://example.com/' + index, _keyword:'主题 ' + (index % 12)
  }));
  const started = Date.now();
  const result = api.buildAnalysis(fixture({ works, hotwords:[] }));
  assert.strictEqual(result.dataQuality.worksCount, 923);
  assert.strictEqual(result.evidenceStore.getEvidenceByType('work').length, 923);
  assert.ok(Date.now() - started < 1500, 'index build exceeded 1500ms');
});

test('engagement content patterns use real work evidence', () => {
  const works = [1, 2, 3].map(index => ({
    workId:'avoid-' + index, title:'新手避坑第' + index + '条', platform:'douyin',
    likeCount:index * 10, commentCount:index, collectCount:index * 2, shareCount:1, _keyword:'新手'
  }));
  const result = api.buildAnalysis(fixture({ works, hotwords:[] }));
  assert.strictEqual(result.contentPatternInsights.length, 1);
  assert.strictEqual(result.contentPatternInsights[0].metrics.pattern, '避坑');
  assert.strictEqual(result.evidenceStore.getEvidenceByInsight(result.contentPatternInsights[0].id).length, 3);
});

test('user voice is generated only from comment evidence', () => {
  const comments = [1, 2, 3].map(index => ({
    commentId:'c-' + index, text:'清洁问题 ' + index, platform:'douyin', keyword:'清洁'
  }));
  const result = api.buildAnalysis(fixture({ comments }));
  assert.strictEqual(result.userVoiceInsights.length, 1);
  const evidence = result.evidenceStore.getEvidenceByInsight(result.userVoiceInsights[0].id);
  assert.strictEqual(evidence.length, 3);
  assert.ok(evidence.every(item => item.type === 'comment'));
  assert.ok(!result.unsupportedInsights.some(item => item.type === 'user_voice'));
});

console.log('V8.2 evidence tests passed.');
