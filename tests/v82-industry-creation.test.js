'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const storage = new Map();
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};
const document = {
  body: { appendChild() {} },
  documentElement: null,
  getElementById() { return null; },
  querySelectorAll() { return []; },
  createElement() { return { setAttribute() {}, classList:{ add(){}, remove(){} } }; },
  addEventListener() {},
  removeEventListener() {}
};
const window = {
  location: { search:'', pathname:'/v8/shared/app.html', href:'' },
  localStorage,
  document,
  addEventListener() {},
  removeEventListener() {},
  crypto: { getRandomValues(bytes) { bytes[0] = storage.size + 101; return bytes; } }
};
window.window = window;
const context = vm.createContext({ window, document, localStorage, URLSearchParams, encodeURIComponent, decodeURIComponent, console, Date, Map, Set, WeakMap, Uint32Array, crypto:window.crypto, setTimeout, clearTimeout, setInterval, clearInterval });
vm.runInContext(fs.readFileSync(path.join(root, 'v8/shared/stable-core.js'), 'utf8'), context);
context.EventManager = window.EventManager;
context.StorageAdapter = window.StorageAdapter;
context.IndustryStore = window.IndustryStore;
vm.runInContext(fs.readFileSync(path.join(root, 'v8/shared/modules/industryCreation.js'), 'utf8'), context);

const service = window.DynamicIndustryService;
const pending = service.draft('取消测试');
assert.match(pending.id, /^ind_[a-z0-9]+$/);
assert.strictEqual(service.list().length, 0);
const first = service.create('工业设计 / CMF 2026');
const second = service.create('AI Agent Tools');
assert.match(first.id, /^ind_[a-z0-9]+$/);
assert.notStrictEqual(first.id, second.id);
assert.strictEqual(first.keywords.length, 8);
assert.ok(first.keywords.includes('CMF设计'));

window.StorageAdapter.saveIndustryData(first.id, { works:Array(111).fill({}), marker:'A' });
window.StorageAdapter.saveIndustryData(second.id, { works:Array(222).fill({}), marker:'B' });
assert.strictEqual(window.StorageAdapter.getIndustryData(first.id).works.length, 111);
assert.strictEqual(window.StorageAdapter.getIndustryData(second.id).works.length, 222);

service.saveHistory(first.id, [{ timestamp:'2026-09-26T00:00:00.000Z', worksCount:111 }]);
service.update(first.id, { name:'工业设计（重命名）', keywords:['工业设计','CMF'] });
assert.strictEqual(service.get(first.id).id, first.id);
assert.strictEqual(service.history(first.id).length, 1);
assert.strictEqual(window.StorageAdapter.getIndustryData(first.id).marker, 'A');
assert.strictEqual(window.StorageAdapter.getIndustryData(second.id).marker, 'B');

service.archive(second.id);
assert.strictEqual(service.list().length, 1);
assert.strictEqual(service.list(true).length, 2);
console.log('V8.2 dynamic industry creation tests passed.');
