/**
 * modules/_helpers.js — 通用辅助函数
 */
(function() {
  'use strict';

  // animateNumber
  function animateNumber(el, target, duration=1200) {
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // trendClass
  function trendClass(t){ if(t==='飙升')return'surging'; if(t==='新热')return'new-hot'; if(t==='衰退')return'declining'; return'stable'; }

  // classifyHook
  function classifyHook(title){ if(/翻车|踩坑|避坑|别再|不要|后悔/.test(title))return'痛点'; if(/对比|vs|VS|区别|哪个好|pk/i.test(title))return'对比'; if(/揭秘|竟然|居然|没想到|真相|内幕/.test(title))return'悬念'; if(/太美了|绝了|惊艳|震撼|效果|大片/.test(title))return'效果'; if(/哭了|感动|暖心|治愈|陪伴/.test(title))return'情感'; return'数字'; }

  // sortTable
  function sortTable(col){ const tb=document.getElementById('hotwordTable');const tbody=tb.querySelector('tbody');const rows=Array.from(tbody.querySelectorAll('tr'));const dir=sortDir[col]=!sortDir[col];rows.sort((a,b)=>{let va=a.cells[col].textContent.trim(),vb=b.cells[col].textContent.trim();const na=parseFloat(va.replace(/[^0-9.-]/g,'')),nb=parseFloat(vb.replace(/[^0-9.-]/g,''));if(!isNaN(na)&&!isNaN(nb))return dir?na-nb:nb-na;return dir?va.localeCompare(vb):vb.localeCompare(va);});rows.forEach(r=>tbody.appendChild(r)); }

  // getMonetization
  function getMonetization(topic) {
    const kw = (topic.keyword || '').toLowerCase();
    const cat = topic.keyword || '';
    // 判断变现方式
    let type, score, desc;
    if (kw.includes('工具') || kw.includes('教程') || kw.includes('入门') || kw.includes('怎么做') || cat.includes('AI做图') || cat.includes('AI视频') || cat.includes('AI PPT')) {
      type = 'affiliate'; score = 85; desc = '带货：AI工具会员/ affiliate 佣金';
    } else if (kw.includes('资讯') || kw.includes('新闻') || kw.includes('发布') || cat.includes('AI大类') || cat.includes('AI Agent')) {
      type = 'ad'; score = 70; desc = '广告：品牌合作、商单植入';
    } else if (kw.includes('工作流') || kw.includes('自动化') || kw.includes('效率') || cat.includes('AI工作流') || cat.includes('AI自动化')) {
      type = 'private'; score = 90; desc = '私域：引流微信，卖方案/咨询';
    } else if (kw.includes('提示词') || kw.includes('prompt') || cat.includes('AI提示词')) {
      type = 'course'; score = 75; desc = '知识付费：提示词课程/社群';
    } else {
      type = 'affiliate'; score = 60; desc = '带货：通用AI工具推荐';
    }
    const typeMap = { affiliate: { name: '带货', cls: 'monetize-affiliate' }, ad: { name: '广告', cls: 'monetize-ad' }, private: { name: '私域', cls: 'monetize-private' }, course: { name: '知识付费', cls: 'monetize-course' } };
    return { type, score, desc, ...typeMap[type] };
  }

  // addFreshnessTags
  function addFreshnessTags() {
    const updateTime = new Date(DATA.last_update || Date.now());
    const now = new Date();
    const hours = (now - updateTime) / (1000 * 60 * 60);
    let tagClass = 'fresh', tagText = '最新';
    if (hours > 24) { tagClass = 'old'; tagText = Math.floor(hours/24) + '天前'; }
    else if (hours > 6) { tagClass = 'stale'; tagText = Math.floor(hours) + '小时前'; }
    else if (hours > 1) { tagText = Math.floor(hours) + '小时前'; }
    const timeEl = document.getElementById('updateTime');
    if (timeEl) {
      timeEl.innerHTML = (timeEl.textContent || '') + ' <span class="freshness-tag ' + tagClass + '">' + tagText + '</span>';
    }
  }

  // updateTracker
  function updateTracker() {
    const status = getKanbanStatus();
    const total = filteredTopics().length;
    let published=0, shooting=0, pending=0;
    filteredTopics().forEach(t=>{
      const s = status[t.title] || 'pending';
      if (s==='published') published++;
      else if (s==='shooting') shooting++;
      else pending++;
    });
    document.getElementById('publishedCount').textContent = published;
    document.getElementById('shootingCount').textContent = shooting;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('barPublished').style.width = total ? (published/total*100)+'%' : '0%';
    document.getElementById('barShooting').style.width = total ? (shooting/total*100)+'%' : '0%';
  }

  // toggleSection
  function toggleSection(id) {
    var sec = document.getElementById(id);
    if (!sec) return;
    sec.classList.toggle('collapsed');
    var btn = sec.querySelector('.section-collapse-btn');
    if (btn) btn.textContent = sec.classList.contains('collapsed') ? '展开' : '收起';
  }

  // initSectionCollapse
  function initSectionCollapse() {
    var sections = document.querySelectorAll('.hero, section');
    sections.forEach(function(sec, idx) {
      var header = sec.querySelector('.section-title, h2, .hero-title');
      if (!header) return;
      if (header.querySelector('.section-collapse-btn')) return;
      var btn = document.createElement('span');
      btn.className = 'section-collapse-btn';
      btn.textContent = '收起';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.flexWrap = 'wrap';
      header.style.gap = '8px';
      header.appendChild(btn);

      var isCollapsed = localStorage.getItem('sec_collapse_' + idx) === '1';
      if (isCollapsed) {
        sec.classList.add('collapsed');
        btn.textContent = '展开';
      }

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var collapsed = sec.classList.toggle('collapsed');
        btn.textContent = collapsed ? '展开' : '收起';
        localStorage.setItem('sec_collapse_' + idx, collapsed ? '1' : '0');
      });
    });
  }

  // applyFilter
  function applyFilter() { currentCategory = document.getElementById('categoryFilter').value; renderAll(); }

  // setPlatform
  function setPlatform(p) {
    currentPlatform = p;
    document.querySelectorAll('.platform-btn').forEach(b => b.classList.toggle('active', b.dataset.platform === p));
    const compareSec = document.getElementById('compareSection');
    const mainSections = document.querySelectorAll('.section:not(.compare-section)');
    if (p === 'compare') {
      compareSec.classList.add('visible');
      mainSections.forEach(s => s.style.display = 'none');
      renderComparison();
    } else {
      compareSec.classList.remove('visible');
      mainSections.forEach(s => s.style.display = '');
      renderAll();
    }
  }

  // filterByPlatform
  function filterByPlatform(arr) {
    if (!arr) return [];
    if (currentPlatform === 'all' || currentPlatform === 'compare') return arr;
    return arr.filter(item => item.platform === currentPlatform);
  }

  // doGlobalSearch
  function doGlobalSearch(query) {
    query = query.trim().toLowerCase();
    var topicCards = document.querySelectorAll('#topicGrid .topic-card');
    var hotwordRows = document.querySelectorAll('#hotwordTable tbody tr');
    var topicCount = 0, hotwordCount = 0;

    if (!query) {
      topicCards.forEach(function(c) { c.classList.remove('search-hidden'); });
      hotwordRows.forEach(function(r) { r.classList.remove('search-hidden'); });
      var sc = document.querySelector('.search-results-count');
      if (sc) sc.remove();
      return;
    }

    // 搜索选题
    topicCards.forEach(function(card) {
      var text = card.textContent.toLowerCase();
      if (text.includes(query)) {
        card.classList.remove('search-hidden');
        topicCount++;
      } else {
        card.classList.add('search-hidden');
      }
    });

    // 搜索热词
    hotwordRows.forEach(function(row) {
      var text = row.textContent.toLowerCase();
      if (text.includes(query)) {
        row.classList.remove('search-hidden');
        hotwordCount++;
      } else {
        row.classList.add('search-hidden');
      }
    });

    // 显示结果数
    var existing = document.querySelector('.search-results-count');
    if (existing) existing.remove();
    var countEl = document.createElement('span');
    countEl.className = 'search-results-count';
    countEl.textContent = topicCount + '选题/' + hotwordCount + '热词';
    document.getElementById('globalSearch').parentNode.appendChild(countEl);
  }

  // exportTopics
  function exportTopics() {
    var topics = filteredTopics();
    var text = '【AI热点选题清单】' + new Date().toLocaleDateString() + '\n\n';
    topics.forEach(function(t, i) {
      var status = getTopicStatus(t.title);
      var statusText = status === 'published' ? '已发布' : status === 'shooting' ? '拍摄中' : '待拍摄';
      text += (i+1) + '. [' + statusText + '] ' + t.title + '\n';
      text += '   钩子：' + (t.hook || '') + '\n';
      text += '   平台：' + (t.platform || '双平台') + ' | 优先：' + (t.priority || '') + '\n\n';
    });
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    alert('已复制 ' + topics.length + ' 条选题到剪贴板！');
  }

  window.animateNumber = animateNumber;
  window.trendClass = trendClass;
  window.classifyHook = classifyHook;
  window.sortTable = sortTable;
  window.getMonetization = getMonetization;
  window.addFreshnessTags = addFreshnessTags;
  window.updateTracker = updateTracker;
  window.toggleSection = toggleSection;
  window.initSectionCollapse = initSectionCollapse;
  window.applyFilter = applyFilter;
  window.setPlatform = setPlatform;
  window.filterByPlatform = filterByPlatform;
  window.doGlobalSearch = doGlobalSearch;
  window.exportTopics = exportTopics;
})();
