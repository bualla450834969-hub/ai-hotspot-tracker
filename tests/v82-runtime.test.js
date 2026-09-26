'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'v8/shared/stable-core.js'), 'utf8');
const storage = new Map();
const windowListeners = [];

const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const window = {
  location: { search: '', pathname: '/v8/shared/app.html', href: '' },
  addEventListener(type, handler) { windowListeners.push({ type, handler }); },
  removeEventListener() {},
  localStorage
};
const document = {
  body: null,
  documentElement: null,
  getElementById() { return null; },
  querySelectorAll() { return []; }
};
window.window = window;
window.document = document;

const context = vm.createContext({
  window,
  document,
  localStorage,
  URLSearchParams,
  encodeURIComponent,
  decodeURIComponent,
  console,
  Date,
  Map,
  Set,
  WeakMap,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval
});
vm.runInContext(source, context, { filename: 'stable-core.js' });

assert.strictEqual(window.IndustryStore.getCurrent().id, 'ai');
assert.strictEqual(window.IndustryStore.resolve('local:工业设计').name, '工业设计');

const localA = window.IndustryStore.resolve('local:工业设计');
const localB = window.IndustryStore.resolve('local:烘焙');
window.StorageAdapter.saveIndustryData(localA, { works: [{ id: 'A' }] });
window.StorageAdapter.saveIndustryData(localB, { works: [{ id: 'B' }, { id: 'B2' }] });
assert.strictEqual(window.StorageAdapter.getIndustryData(localA).works.length, 1);
assert.strictEqual(window.StorageAdapter.getIndustryData(localB).works.length, 2);

const target = {
  listeners: [],
  addEventListener(type, handler) { this.listeners.push({ type, handler }); },
  removeEventListener(type, handler) { this.listeners = this.listeners.filter(item => item.type !== type || item.handler !== handler); }
};
function click() {}
window.EventManager.on(target, 'click', click, false, 'test');
window.EventManager.on(target, 'click', click, false, 'test');
assert.strictEqual(window.EventManager.count(), 1);
assert.strictEqual(target.listeners.length, 1);
window.EventManager.clear('test');
assert.strictEqual(window.EventManager.count(), 0);

window.TimerManager.setTimeout(() => {}, 10000, 'test');
window.TimerManager.setInterval(() => {}, 10000, 'test');
assert.strictEqual(window.TimerManager.stats().total, 2);
window.TimerManager.clearAll();
assert.strictEqual(window.TimerManager.stats().total, 0);

const dom = { nodeType: 1, isConnected: true, clientWidth: 300, clientHeight: 200 };
let disposeCount = 0;
const instances = new Map();
window.echarts = {
  init(node) {
    const instance = { setOption() {}, resize() {}, dispose() { disposeCount++; instances.delete(node); } };
    instances.set(node, instance);
    return instance;
  },
  getInstanceByDom(node) { return instances.get(node) || null; }
};
const first = window.ChartManager.create(dom);
const second = window.ChartManager.create(dom);
assert.strictEqual(first, second);
assert.strictEqual(window.ChartManager.count(), 1);
window.ChartManager.disposeAll();
assert.strictEqual(window.ChartManager.count(), 0);
assert.strictEqual(disposeCount, 1);

console.log('V8.2 runtime architecture tests passed.');
