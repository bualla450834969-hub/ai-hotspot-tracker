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
  IndustryStore: {getCurrent() { return {id:'ai-agent', name:'AI Agent'}; }},
  DOMAIN_CONFIG: {display_name:'AI Agent', collect_keywords:['MCP']},
  fetch() { throw new Error('network not used'); },
  Date,
  Promise,
  encodeURIComponent
};
context.window = context;
vm.runInNewContext(source, context);

const api = context.RadarAdapters.github._test;
const now = Date.parse('2026-09-28T12:00:00Z');
const weekAgo = now - 7 * 86400000;
function repo(id, stars, createdAt) {
  return {id:String(id), name:'owner/repo-' + id, stars, forks:10, createdAt};
}

const repoA = repo('A', 16000, '2024-01-01T00:00:00Z');
api.saveRepoSnapshot('ai-agent', {...repoA, stars:10000}, weekAgo);
let metric = api.githubMetrics('ai-agent', repoA, now);
assert.strictEqual(metric.historyStatus, 'sufficient');
assert.strictEqual(metric.starsGained7d, 6000);
assert.strictEqual(metric.growthRate7d, 0.6);

const repoB = repo('B', 52000, '2025-01-01T00:00:00Z');
api.saveRepoSnapshot('ai-agent', {...repoB, stars:50000}, weekAgo + 12 * 3600000);
metric = api.githubMetrics('ai-agent', repoB, now);
assert.strictEqual(metric.starsGained7d, 2000);

const repoC = repo('C', 4000, new Date(now - 3 * 86400000).toISOString());
metric = api.githubMetrics('ai-agent', repoC, now);
assert.strictEqual(metric.isNew, true);
assert.strictEqual(metric.historyStatus, 'insufficient');
assert.strictEqual(metric.starsGained7d, null);

const repoD = repo('D', 9000, '2023-01-01T00:00:00Z');
api.saveRepoSnapshot('ai-agent', repoD, now);
metric = api.githubMetrics('ai-agent', repoD, now);
assert.strictEqual(metric.isNew, false);
assert.strictEqual(metric.historyStatus, 'insufficient');
assert.strictEqual(metric.starsGained7d, null);

api.saveRepoSnapshot('ai-agent', {...repoD, stars:9100}, now + 3600000);
assert.strictEqual(api.getRepoSnapshots('ai-agent', 'D').length, 1, 'same-day snapshots must update');
assert.strictEqual(api.getRepoSnapshots('ai-agent', 'D')[0].stars, 9100);

api.saveRepoSnapshot('ai-tools', {...repoA, stars:700}, weekAgo);
assert.strictEqual(api.getRepoSnapshots('ai-agent', 'A')[0].stars, 10000);
assert.strictEqual(api.getRepoSnapshots('ai-tools', 'A')[0].stars, 700);
assert.notStrictEqual(api.repoSnapshotKey('ai-agent','A'), api.repoSnapshotKey('ai-tools','A'));

const ranked = api.rankWeekly([
  {...repoB, ...api.githubMetrics('ai-agent', repoB, now)},
  {...repoC, ...api.githubMetrics('ai-agent', repoC, now)},
  {...repoD, ...api.githubMetrics('ai-agent', repoD, now)},
  {...repoA, ...api.githubMetrics('ai-agent', repoA, now)}
]);
assert.deepStrictEqual(Array.from(ranked, item => item.id), ['A', 'B']);
assert(api.repoRelevance({name:'owner/agent-skills',description:'Production skills for Codex',topics:['mcp']}) > api.repoRelevance({name:'owner/java-guide',description:'Java interview guide',topics:['java']}));

assert(!source.includes("created:>='"));
assert(source.includes('pushed:>='));
assert(!source.includes('starsGained7d:repo.stargazers_count'));

const view = fs.readFileSync('v8/shared/modules/techradar.js', 'utf8');
assert(view.includes('GitHub 精准 Skill / 项目'));
assert(view.includes('accumulating.map(accumulatingCard)'));
assert(view.includes("a.kind==='github'?0:1"));

console.log('V8.3.1 GitHub Radar snapshot tests: PASS');
