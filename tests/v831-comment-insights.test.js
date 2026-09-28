const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(process.cwd() + '/v8/shared/modules/breakdown.js', 'utf8');
const elements = {
  commentSemanticContent: {innerHTML: ''},
  conversionSignalList: {innerHTML: ''},
  commentDemands: {innerHTML: ''},
  commentKw: {innerHTML: ''}
};
const context = {
  window: {},
  document: {getElementById(id) { return elements[id] || null; }},
  DATA: {},
  charts: {},
  console
};
context.window = context;
vm.runInNewContext(source, context);

context.DATA.comment_semantic = {themes: []};
context.renderCommentSemantic();
assert(elements.commentSemanticContent.innerHTML.includes('当前缺少评论正文'));
assert(!elements.commentSemanticContent.innerHTML.includes('insight-row'));

context.DATA.conversion_signals = [];
context.renderConversionSignals();
assert(elements.conversionSignalList.innerHTML.includes('当前缺少评论正文'));
assert(!elements.conversionSignalList.innerHTML.includes('insight-row'));

context.DATA.comments = [];
context.DATA.comment_keywords = [{keyword: '固定关键词', count: 39}];
context.DATA.comment_demands = {questions: [{demand: '固定需求', count: 1}]};
context.renderCommentKw();
context.renderCommentDemands();
assert(elements.commentKw.innerHTML.includes('当前未采集到评论文本'));
assert(!elements.commentKw.innerHTML.includes('固定关键词'));
assert(elements.commentDemands.innerHTML.includes('当前评论样本不足'));
assert(!elements.commentDemands.innerHTML.includes('固定需求'));

context.DATA.comments = [{text: '请问在哪里可以买到这个工具？'}];
context.renderCommentKw();
context.renderCommentDemands();
assert(elements.commentKw.innerHTML.includes('固定关键词'));
assert(elements.commentDemands.innerHTML.includes('固定需求'));

context.DATA.comment_semantic = {themes: [{name: '固定痛点', count: 63672}]};
context.renderCommentSemantic();
assert(!elements.commentSemanticContent.innerHTML.includes('固定痛点'));
assert(!elements.commentSemanticContent.innerHTML.includes('63,672'));

context.DATA.conversion_signals = [{signal: '求购买链接', count: 23877, impact: '高'}];
context.DATA.conversion_signal_meta = {};
context.renderConversionSignals();
assert(!elements.conversionSignalList.innerHTML.includes('求购买链接'));
assert(!elements.conversionSignalList.innerHTML.includes('23,877'));

context.DATA.comment_semantic = {
  sourceType: 'DERIVED_REAL',
  commentTextCount: 261,
  themes: [{name: '求教程', count: 126, description: '来自真实评论正文'}]
};
context.renderCommentSemantic();
assert(elements.commentSemanticContent.innerHTML.includes('insight-row'));
assert(elements.commentSemanticContent.innerHTML.includes('求教程'));
assert(elements.commentSemanticContent.innerHTML.includes('126'));

context.DATA.conversion_signal_meta = {sourceType: 'DERIVED_REAL', commentTextCount: 261};
context.DATA.conversion_signals = [{signal: '求购买链接', evidenceCount: 42, impact: '高', desc: '真实评论证据'}];
context.renderConversionSignals();
assert(elements.conversionSignalList.innerHTML.includes('insight-row'));
assert(elements.conversionSignalList.innerHTML.includes('求购买链接'));
assert(elements.conversionSignalList.innerHTML.includes('42'));
assert(elements.conversionSignalList.innerHTML.includes('高影响'));

console.log('V8.3.1 comment insight tests: PASS');
