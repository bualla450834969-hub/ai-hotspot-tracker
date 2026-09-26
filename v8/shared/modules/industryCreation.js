/* ===== modules/industryCreation.js ===== */
(function () {
  'use strict';

  var REGISTRY_KEY = 'v82_industries';
  var draft = null;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function now() { return new Date().toISOString(); }

  function generateId() {
    var suffix = Date.now().toString(36);
    if (window.crypto && crypto.getRandomValues) {
      var bytes = new Uint32Array(1);
      crypto.getRandomValues(bytes);
      suffix += bytes[0].toString(36);
    } else {
      suffix += Math.floor(Math.random() * 0xFFFFFF).toString(36);
    }
    return 'ind_' + suffix.toLowerCase();
  }

  var KeywordSuggestionAdapter = {
    suggest: function (name) {
      var base = String(name || '').trim();
      var suggestions = [base, base + '教程', base + '推荐', base + '趋势', base + '案例', base + '避坑', base + '怎么选', base + '设计师'];
      if (/工业设计/.test(base)) suggestions = ['工业设计','产品设计','产品外观设计','CMF设计','设计趋势','工业设计案例','产品设计案例','设计师'];
      return suggestions.filter(function (item, index, list) { return item && list.indexOf(item) === index; }).slice(0, 8);
    }
  };

  var DynamicIndustryService = {
    list: function (includeArchived) {
      var items = StorageAdapter.getJSON(REGISTRY_KEY, []) || [];
      return includeArchived ? items : items.filter(function (item) { return !item.archived; });
    },
    get: function (id) {
      return this.list(true).find(function (item) { return item.id === id; }) || null;
    },
    save: function (record) {
      var items = this.list(true);
      var index = items.findIndex(function (item) { return item.id === record.id; });
      if (index >= 0) items[index] = record; else items.push(record);
      StorageAdapter.setJSON(REGISTRY_KEY, items);
      StorageAdapter.saveIndustryConfig(IndustryStore.resolve(record.id), {
        id: record.id,
        name: record.name,
        display_name: record.name,
        keywords: record.keywords.slice(),
        platforms: record.platforms.slice(),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        archived: !!record.archived,
        language: 'zh',
        theme: { primary: '#8b5cf6' }
      });
      return record;
    },
    create: function (name) {
      var stamp = now();
      return this.save({ id: generateId(), name: name.trim(), keywords: KeywordSuggestionAdapter.suggest(name), platforms: ['douyin','xiaohongshu'], createdAt: stamp, updatedAt: stamp, archived: false });
    },
    draft: function (name) {
      var stamp = now();
      return { id: generateId(), name:name.trim(), keywords:KeywordSuggestionAdapter.suggest(name), platforms:['douyin','xiaohongshu'], createdAt:stamp, updatedAt:stamp, archived:false, _new:true };
    },
    update: function (id, patch) {
      var record = this.get(id);
      if (!record) return null;
      Object.keys(patch || {}).forEach(function (key) { record[key] = patch[key]; });
      record.updatedAt = now();
      return this.save(record);
    },
    archive: function (id) { return this.update(id, { archived: true }); },
    history: function (id) { return StorageAdapter.getJSON('industry_' + id + '_history', []) || []; },
    saveHistory: function (id, history) { return StorageAdapter.setJSON('industry_' + id + '_history', history || []); }
  };

  function currentId() { return IndustryStore.getCurrent().id; }

  function row(record, kind) {
    var active = record.id === currentId();
    var actions = '<button type="button" data-industry-switch="' + esc(record.id) + '">' + (active ? '当前' : '切换') + '</button>';
    if (kind === 'dynamic') {
      actions += '<button type="button" data-industry-edit="' + esc(record.id) + '">编辑</button>' +
        '<button type="button" data-industry-archive="' + esc(record.id) + '">归档</button>';
    }
    return '<div class="my-industry-row' + (active ? ' is-active' : '') + '"><div><strong>' + esc(record.name) + '</strong><span>' + esc(kind === 'builtin' ? '内置行业' : (kind === 'legacy' ? '兼容行业' : ((record.keywords || []).length + ' 个关键词'))) + '</span></div><div class="my-industry-actions">' + actions + '</div></div>';
  }

  function renderManager() {
    var root = document.getElementById('dynamicIndustryManager');
    if (!root) return;
    var html = '<div class="my-industry-heading"><div><h3>我的行业</h3><p>切换、创建和管理独立行业工作台</p></div><button type="button" class="v82-primary" data-industry-add>+ 添加行业</button></div>';
    html += '<div class="my-industry-list">' + row({id:'ai',name:'AI'}, 'builtin') + row({id:'shufa',name:'书法'}, 'builtin');
    (StorageAdapter.listIndustries() || []).forEach(function (name) { html += row({id:'local:' + name,name:name}, 'legacy'); });
    DynamicIndustryService.list().forEach(function (record) { html += row(record, 'dynamic'); });
    root.innerHTML = html + '</div>';
  }

  function ensureDrawer() {
    var shell = document.getElementById('industryFlowShell');
    if (shell) return shell;
    shell = document.createElement('div');
    shell.id = 'industryFlowShell';
    shell.className = 'industry-flow-shell';
    shell.setAttribute('aria-hidden', 'true');
    shell.innerHTML = '<div class="industry-flow-backdrop" data-industry-close></div><section class="industry-flow-drawer" role="dialog" aria-modal="true" aria-labelledby="industryFlowTitle"><header><div><span class="v82-eyebrow">Dynamic Industry</span><h2 id="industryFlowTitle">添加行业</h2></div><button type="button" class="industry-flow-close" data-industry-close aria-label="关闭">×</button></header><div id="industryFlowBody"></div></section>';
    document.body.appendChild(shell);
    return shell;
  }

  function show(html) {
    var shell = ensureDrawer();
    document.getElementById('industryFlowBody').innerHTML = html;
    shell.classList.add('is-open');
    shell.setAttribute('aria-hidden', 'false');
  }

  function close() {
    var shell = document.getElementById('industryFlowShell');
    if (!shell || (window.collectionState && window.collectionState.running)) return;
    shell.classList.remove('is-open');
    shell.setAttribute('aria-hidden', 'true');
    draft = null;
  }

  function renderNameStep(value, error) {
    show('<div class="industry-flow-step"><span class="industry-flow-step-label">步骤 1 / 2</span><h3>你想追踪什么行业？</h3><p>只需输入行业名称，系统会生成一组可编辑的建议关键词。</p>' +
      '<input class="industry-flow-input" id="newIndustryName" value="' + esc(value || '') + '" placeholder="例如：工业设计、宠物用品、咖啡机、AI Agent" autocomplete="off">' +
      (error ? '<div class="industry-flow-error">' + esc(error) + '</div>' : '') +
      '<div class="industry-flow-footer"><button type="button" data-industry-close>取消</button><button type="button" class="v82-primary" data-industry-next>下一步</button></div></div>');
    var input = document.getElementById('newIndustryName');
    if (input) input.focus();
  }

  function keywordRows(keywords) {
    return keywords.map(function (keyword, index) {
      return '<div class="industry-keyword-row"><input class="industry-flow-input" data-keyword-index="' + index + '" value="' + esc(keyword) + '"><button type="button" data-keyword-remove="' + index + '" aria-label="删除关键词">×</button></div>';
    }).join('');
  }

  function renderKeywordStep() {
    if (!draft) return;
    show('<div class="industry-flow-step"><span class="industry-flow-step-label">步骤 2 / 2</span><h3>确认行业与关键词</h3><p>以下是系统建议。你可以修改、删除或添加关键词，确认后才会开始采集。</p>' +
      '<label class="industry-flow-label">行业名称</label><input class="industry-flow-input" id="editIndustryName" value="' + esc(draft.name) + '">' +
      '<label class="industry-flow-label">系统建议关键词</label><div id="industryKeywordList">' + keywordRows(draft.keywords) + '</div>' +
      '<button type="button" class="industry-add-keyword" data-keyword-add>+ 添加关键词</button>' +
      '<label class="industry-flow-label">采集平台</label><div class="industry-platforms"><label><input type="checkbox" id="platform_dy"' + (draft.platforms.indexOf('douyin') >= 0 ? ' checked' : '') + '> 抖音</label><label><input type="checkbox" id="platform_xhs"' + (draft.platforms.indexOf('xiaohongshu') >= 0 ? ' checked' : '') + '> 小红书</label></div>' +
      '<div id="collectStatus" class="industry-collect-status" style="display:none;"></div>' +
      '<div class="industry-flow-footer"><button type="button" data-industry-back>上一步</button><button type="button" class="v82-primary" data-industry-collect>确认并开始采集</button></div></div>');
  }

  function syncDraft() {
    if (!draft) return;
    var name = document.getElementById('editIndustryName');
    if (name && name.value.trim()) draft.name = name.value.trim();
    draft.keywords = Array.from(document.querySelectorAll('[data-keyword-index]')).map(function (input) { return input.value.trim(); }).filter(Boolean).slice(0, 10);
    draft.platforms = [];
    var dy = document.getElementById('platform_dy');
    var xhs = document.getElementById('platform_xhs');
    if (dy && dy.checked) draft.platforms.push('douyin');
    if (xhs && xhs.checked) draft.platforms.push('xiaohongshu');
  }

  function openCreate() { draft = null; renderNameStep(''); }
  function openEdit(id) { var record = DynamicIndustryService.get(id); draft = record ? JSON.parse(JSON.stringify(record)) : null; if (draft) renderKeywordStep(); }
  function openRecollect() {
    var ctx = IndustryStore.getCurrent();
    if (ctx.type === 'dynamic') openEdit(ctx.id);
    else {
      var panel = document.getElementById('settingsPanel');
      if (panel) { panel.style.display = 'block'; panel.scrollIntoView({behavior:'smooth',block:'start'}); }
    }
  }

  function beginCollection() {
    syncDraft();
    if (!draft || !draft.name || !draft.keywords.length || !draft.platforms.length) {
      var status = document.getElementById('collectStatus');
      if (status) { status.style.display = 'block'; status.innerHTML = '<span class="is-error">请保留至少一个关键词，并选择至少一个采集平台。</span>'; }
      return;
    }
    if (draft._new) { delete draft._new; draft = DynamicIndustryService.save(draft); renderManager(); }
    else draft = DynamicIndustryService.update(draft.id, { name:draft.name, keywords:draft.keywords, platforms:draft.platforms });
    document.getElementById('industryInput').value = draft.name;
    window.startCollection({ industryId:draft.id, name:draft.name, keywords:draft.keywords.slice(), platforms:draft.platforms.slice() });
  }

  function handleClick(event) {
    var target = event.target;
    if (target.closest('[data-industry-add]')) return openCreate();
    if (target.closest('[data-industry-close]')) return close();
    if (target.closest('[data-industry-next]')) {
      var input = document.getElementById('newIndustryName');
      var name = input ? input.value.trim() : '';
      if (!name) return renderNameStep('', '请输入行业名称');
      draft = DynamicIndustryService.draft(name);
      return renderKeywordStep();
    }
    if (target.closest('[data-industry-back]')) { syncDraft(); return renderNameStep(draft ? draft.name : ''); }
    var remove = target.closest('[data-keyword-remove]');
    if (remove) { syncDraft(); draft.keywords.splice(Number(remove.getAttribute('data-keyword-remove')), 1); return renderKeywordStep(); }
    if (target.closest('[data-keyword-add]')) { syncDraft(); if (draft.keywords.length < 10) draft.keywords.push(''); return renderKeywordStep(); }
    if (target.closest('[data-industry-collect]')) return beginCollection();
    var switchButton = target.closest('[data-industry-switch]');
    if (switchButton && switchButton.textContent !== '当前') return switchIndustryContext(switchButton.getAttribute('data-industry-switch'));
    var edit = target.closest('[data-industry-edit]');
    if (edit) return openEdit(edit.getAttribute('data-industry-edit'));
    var archive = target.closest('[data-industry-archive]');
    if (archive && window.confirm('归档这个行业？数据会保留。')) { DynamicIndustryService.archive(archive.getAttribute('data-industry-archive')); renderManager(); }
  }

  window.KeywordSuggestionAdapter = KeywordSuggestionAdapter;
  window.DynamicIndustryService = DynamicIndustryService;
  window.DynamicIndustryFlow = { openCreate:openCreate, openEdit:openEdit, openRecollect:openRecollect, renderManager:renderManager, close:close };
  EventManager.on(document, 'click', handleClick, false, 'industry-flow');
  renderManager();
})();
