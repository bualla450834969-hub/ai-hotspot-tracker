/**
 * modules/kanban.js
 * 函数: renderKanban, getAllKanbanStatus, getTopicStatus, setTopicStatus, cycleKanbanStatus, cycleKanbanStatusByTitle, getKanbanStatus, resetKanbanStatus
 * 依赖: ['topics']
 */
(function() {
  'use strict';

  // renderKanban
  function renderKanban() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;
    const topics = DATA.topics || [];
    const cols = { pending: [], shooting: [], published: [] };
    const allStatus = getAllKanbanStatus();
    topics.forEach(function(t) {
      const s = allStatus[t.title] || 'pending';
      if (!cols[s]) cols[s] = [];
      cols[s].push(t);
    });
    const colConfig = [
      { key: 'pending', title: '待拍摄', color: '#f59e0b' },
      { key: 'shooting', title: '拍摄中', color: '#3b82f6' },
      { key: 'published', title: '已发布', color: '#10b981' }
    ];
    board.innerHTML = colConfig.map(function(c) {
      const items = (cols[c.key] || []).map(function(t) {
        const pname = (t.target_persona && t.target_persona.name) ? t.target_persona.name : '通用';
        const plat = t.platform === 'douyin' ? '抖音' : '小红书';
        return '<div class="kanban-card ' + c.key + '">' +
          '<div class="kanban-card-title">' + t.title + '</div>' +
          '<div class="kanban-card-meta"><span>' + pname + '</span><span>' + t.priority + '优先</span><span>' + plat + '</span></div>' +
          '<div class="kanban-card-actions">' +
          '<button class="kanban-btn" onclick="cycleKanbanStatusByTitle(\'' + t.title.replace(/'/g, "\\'") + '\')">切换状态</button>' +
          '<button class="kanban-btn" onclick="generateScript(\'' + t.title.replace(/'/g, "\\'") + '\')">生成脚本</button>' +
          '</div></div>';
      }).join('');
      return '<div class="kanban-column">' +
        '<div class="kanban-col-head"><span class="kanban-col-title" style="color:' + c.color + '">' + c.title + '</span>' +
        '<span class="kanban-col-count">' + (cols[c.key] || []).length + '</span></div>' +
        (items || '<div style="font-size:11px;color:var(--text-tertiary);text-align:center;padding:20px;">暂无</div>') +
        '</div>';
    }).join('');
  }

  // getAllKanbanStatus
  function getAllKanbanStatus() {
    try { return JSON.parse(localStorage.getItem('ai_hotspot_status') || '{}'); } catch(e) { return {}; }
  }

  // getTopicStatus
  function getTopicStatus(title) {
    const all = getAllKanbanStatus();
    return all[title] || 'pending';
  }

  // setTopicStatus
  function setTopicStatus(title, status) {
    const all = getAllKanbanStatus();
    all[title] = status;
    localStorage.setItem('ai_hotspot_status', JSON.stringify(all));
    renderKanban();
    renderTopics();
  }

  // cycleKanbanStatus
  function cycleKanbanStatus(i, title) {
    const status = getKanbanStatus();
    const cur = status[title] || 'pending';
    const next = cur==='pending'?'shooting':cur==='shooting'?'published':'pending';
    if (next==='pending') delete status[title]; else status[title]=next;
    localStorage.setItem('ai_hotspot_status', JSON.stringify(status));
    const card = document.getElementById('topic-'+i);
    card.className = card.className.replace(/status-\w+/, 'status-'+next);
    card.querySelector('.status-badge').textContent = next==='pending'?'待拍摄':next==='shooting'?'拍摄中':'已发布';
    updateTracker();
  }

  // cycleKanbanStatusByTitle
  function cycleKanbanStatusByTitle(title) {
    const topic = DATA.topics.find(function(t) { return t.title === title; });
    if (!topic) return;
    const idx = DATA.topics.indexOf(topic);
    cycleKanbanStatus(idx, title);
  }

  // getKanbanStatus
  function getKanbanStatus() { try { return JSON.parse(localStorage.getItem('ai_hotspot_status')||'{}'); } catch(e) { return {}; } }

  // resetKanbanStatus
  function resetKanbanStatus() { localStorage.removeItem('ai_hotspot_status'); renderTopics(); }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "kanban",
      requiredFields: ['topics'],
      render: function(data) {
        try { renderKanban(data); } catch(e) { console.error("[kanban]", e); }
      }
    });
  }
})();
