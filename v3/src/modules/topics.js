/**
 * modules/topics.js
 * 函数: renderTopics, calcTopicScore, generateTitles, getPlatformAdaptation, generateSchedule, renderCommentScripts, renderChecklist, toggleCheck, updateChecklistProgress, filteredTopics, generateShootList
 * 依赖: ['topics']
 */
(function() {
  'use strict';

  // renderTopics
  function renderTopics() {
    const formats = DATA.content_formats || [];
    const fmtMap = {};
    formats.forEach(f=>fmtMap[f.title]=f);
    const topics = filteredTopics();
    const status = getKanbanStatus();
    document.getElementById('topicsGrid').innerHTML = topics.map((t,i)=>{
      const fmt = fmtMap[t.title] || {};
      const st = status[t.title] || 'pending';
      const score = calcTopicScore(t);
      const adapt = getPlatformAdaptation(t);
      const mon = getMonetization(t);
      return `<div class="topic-card priority-${t.priority==='高'?'high':t.priority==='中'?'medium':'low'} status-${st}" id="topic-${i}" onclick="cycleKanbanStatus(${i}, '${t.title.replace(/'/g,"\\'")}')">
        <div class="status-badge">${st==='pending'?'待拍摄':st==='shooting'?'拍摄中':'已发布'}</div>
        <div class="tc-num">${String(i+1).padStart(2,'0')}</div>
        <div class="tc-priority">${t.priority}优先</div>
        ${t.smart_priority ? '<span class="smart-priority ' + (t.smart_priority>=60?'high':t.smart_priority>=40?'mid':'low') + '" title="信息差'+(t.priority_breakdown?.info_gap||0)+' 热度'+(t.priority_breakdown?.heat||0)+' 低竞争'+(t.priority_breakdown?.low_competition||0)+'">智能 ' + t.smart_priority + '</span>' : ''}
        ${t.content_type ? '<span class="content-type-tag '+t.content_type+'">'+t.content_type+'</span>' : ''}${t.is_info_gap ? '<div class="info-gap-badge">💎 信息差</div>' : (t.is_forecast ? '<div class="forecast-badge">🔮 前瞻</div>' : '')}
        <div class="tc-title">${t.title}</div>
        <div class="tc-hook">${t.hook}</div>\n      ${t.guide_comment ? '<div class="guide-comment">💬 小号引导：' + t.guide_comment + '</div>' : ''}
        <div style="display:flex;align-items:center;gap:12px;margin:6px 0">
          <div><span class="topic-score">${score.total}</span><span class="topic-score-label"> 综合分</span></div>
          <div style="flex:1">
            <div class="score-bar"><div class="score-bar-fill" style="width:${score.heat}%;background:#8b5cf6"></div></div>
            <div class="score-bar"><div class="score-bar-fill" style="width:${score.competition}%;background:#4ade80"></div></div>
            <div class="score-bar"><div class="score-bar-fill" style="width:${score.timing}%;background:#facc15"></div></div>
          </div>
        </div>
        <div class="adapt-tags">
          <span class="adapt-tag">抖音: ${adapt.dy.format}</span>
          <span class="adapt-tag">小红书: ${adapt.xhs.format}</span>
        </div>
        <div style="margin-top:6px">
          <span class="monetize-tag ${mon.cls}">${mon.name}</span>
          <span style="font-size:11px;color:var(--text-secondary)">变现潜力 ${mon.score}分 · ${mon.desc}</span>
        </div>
        ${t.conversion_path ? `<div class="conv-path">
          <div class="cp-title">转化路径 <span class="cp-level ${t.conversion_path.conversion_potential==='高'?'high':t.conversion_path.conversion_potential==='中'?'medium':'low'}">${t.conversion_path.conversion_potential}转化</span></div>
          <div class="cp-row"><span class="cp-label">私域钩子：</span>${t.conversion_path.private_hook}</div>
          <div class="cp-row"><span class="cp-label">对应产品：</span>${t.conversion_path.product_match}</div>
          <div class="cp-row"><span class="cp-label">漏斗：</span>${t.conversion_path.funnel_step}</div>
        </div>` : ''}
        ${t.target_persona ? `<div class="topic-persona">
          <div class="tp-name">目标人群：${t.target_persona.name} · ${t.target_persona.age} · ${t.target_persona.gender}</div>
          <div class="tp-needs">${(t.target_persona.needs||[]).slice(0,4).map(n=>'<span class="tp-need">'+n+'</span>').join('')}</div>
          <div class="tp-content">偏好：${t.target_persona.content_pref}</div>
        </div>` : ''}
        ${fmt.format?`<div class="tc-format"><span>${fmt.format}</span><span>${fmt.suggested_duration||''}</span><span>${fmt.suggested_publish||''}</span></div>`:''}
        <div class="tc-meta"><span class="audience">${t.audience}</span><span style="color:var(--text-tertiary);">#${t.keyword}</span></div>
        ${st==='published' ? (function(){
          var perf = getPerfData();
          var p = perf[t.title];
          if (p) {
            return '<div class="perf-stats">📊 播放'+p.views.toLocaleString()+' · 点赞'+p.likes.toLocaleString()+' · 涨粉'+p.followers+' ('+p.date+')</div>';
          }
          return '<div style="margin-top:6px;"><button onclick="event.stopPropagation();recordPerf(\''+t.title.replace(/'/g,"\\'")+'\')" style="font-size:10px;padding:3px 8px;border-radius:5px;border:none;background:rgba(245,158,11,0.15);color:#fbbf24;cursor:pointer;">📊 记录发布效果</button></div>';
        })() : ''}
        <div class="title-variants">
          <div class="tv-label">A/B标题变体（点击复制）：</div>
          ${genTitleVariants(t.title).map(function(v,vi){
            return '<div class="tv-item" onclick="event.stopPropagation();navigator.clipboard.writeText(\''+v.replace(/'/g,"\\'")+'\');this.style.color=\'#34d399\';this.textContent=\'✅ 已复制\'">'+(vi+1)+'. '+v+'</div>';
          }).join('')}
        </div>
        ${fmt.ref_url?`<a href="${fmt.ref_url}" target="_blank" class="ref-link">参考视频 — ${fmt.ref_title||'点击查看'}</a>`:''}
      </div>`;
    }).join('');
    updateTracker();
  }

  // calcTopicScore
  function calcTopicScore(topic) {
    const hw = DATA.hotwords.find(h => h.keyword === topic.keyword);
    if (!hw) return { total: 50, heat: 50, competition: 50, match: 50, timing: 50 };
    // 热度分：作品数取对数归一化
    const heat = Math.min(100, Math.round(Math.log10(hw.total || 1) * 20));
    // 竞争分：蓝海指数越高分越高（竞争小）
    const bo = hw.blue_ocean_score || 1;
    const competition = Math.min(100, Math.round(Math.log10(bo + 1) * 15));
    // 匹配分：默认60，AI大类相关更高
    const match = hw.category === 'AI大类' ? 75 : 65;
    // 时效分：飙升>新热>稳定
    const timing = hw.trend === '飙升' ? 95 : hw.trend === '新热' ? 80 : 55;
    const total = Math.round(heat * 0.3 + competition * 0.25 + match * 0.2 + timing * 0.25);
    return { total, heat, competition, match, timing };
  }

  // generateTitles
  function generateTitles() {
    const kw = document.getElementById('titleGenInput').value.trim();
    if (!kw) { alert('请输入关键词'); return; }
    const genes = DATA.viral_genes || {};
    const hooks = genes.hook_distribution || {};
    const topKws = (genes.top_title_keywords || []).map(k => k[0]);
  
    const templates = [
      { type: '提问式', titles: [kw+'又更新了？这次的功能太离谱了', '为什么高手都在用'+kw+'？3个原因告诉你', kw+'到底怎么选？一篇讲透'] },
      { type: '数字清单', titles: ['3个'+kw+'隐藏技巧，90%的人不知道', '5个'+kw+'神器，最后一个绝了', kw+'入门必看的7个要点'] },
      { type: '结果前置', titles: ['用'+kw+'一键搞定，效率提升10倍', kw+'实战教程，看完就会', '我用'+kw+'做了这个，老板惊呆了'] },
      { type: '反差对比', titles: [kw+'VS传统方式，差距太大了', '别再用老方法了，'+kw+'才是正解', '同样是'+kw+'，为什么别人做的更好？'] },
      { type: '恐惧焦虑', titles: ['还不会'+kw+'？你已经落后了', kw+'踩坑指南，这些错误别再犯', '再不学'+kw+'就晚了'] },
      { type: '福利诱惑', titles: [kw+'全套资料整理好了，免费领', '花了3天整理的'+kw+'笔记，分享给你', kw+'资源合集，建议收藏'] },
    ];
  
    const hookLines = {
      '提问式': '开头直接抛问题，3秒抓住好奇心',
      '数字清单': '用数字建立预期，清单体完播率高',
      '结果前置': '先展示效果，再讲方法，转化最强',
      '反差对比': '制造认知冲突，引发讨论',
      '恐惧焦虑': '戳中痛点，紧迫感驱动行动',
      '福利诱惑': '利益点前置，收藏率最高',
    };
  
    // 取前5种类型各1个标题
    const result = templates.slice(0, 5).map(t => ({
      type: t.type,
      title: t.titles[Math.floor(Math.random() * t.titles.length)],
      hook: hookLines[t.type] || '',
    }));
  
    const html = result.map(r => `
      <div class="gen-title-item">
        <div><b>[${r.type}]</b> ${r.title}</div>
        <div class="hook">${r.hook}</div>
      </div>
    `).join('');
    document.getElementById('titleGenResult').innerHTML = html;
  }

  // getPlatformAdaptation
  function getPlatformAdaptation(topic) {
    const cat = topic.keyword || '';
    const dy = {
      title_style: '口语化+悬念，前3秒必须有钩子',
      cover: '大字报封面，关键词突出',
      tags: '#' + cat.replace(/\s/g,'') + ' #AI #人工智能 #干货分享',
      time: '12:00-13:00 或 19:00-21:00',
      format: '15-40秒口播+AI素材混剪',
    };
    const xhs = {
      title_style: '干货体+emoji，标题控制在20字内',
      cover: '精致图文，3-5图轮播',
      tags: '#' + cat.replace(/\s/g,'') + ' #AI工具 #效率神器 #新手必看',
      time: '7:30-9:00 或 20:00-22:30',
      format: '图文笔记为主，视频为辅',
    };
    return { dy, xhs };
  }

  // generateSchedule
  function generateSchedule() {
    const topics = DATA.topics || [];
    const days = ['周一','周二','周三','周四','周五','周六','周日'];
    const today = new Date();
    const publishTimes = ['08:00', '12:00', '19:00', '21:00'];
    const platforms = ['抖音', '小红书'];
  
    let html = '<div class="schedule-grid">';
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = (d.getMonth()+1) + '/' + d.getDate();
      const topic1 = topics[i % topics.length];
      const topic2 = topics[(i + 3) % topics.length];
    
      html += `<div class="schedule-day">
        <div class="day-name">${days[i]}</div>
        <div class="day-date">${dateStr}</div>
        <div class="schedule-item">
          <div class="si-platform">抖音 · ${publishTimes[i%4]}</div>
          <div>${topic1 ? topic1.title.substring(0,24) : '休息'}</div>
        </div>
        ${i % 2 === 0 ? `<div class="schedule-item">
          <div class="si-platform">小红书 · ${publishTimes[(i+2)%4]}</div>
          <div>${topic2 ? topic2.title.substring(0,24) : '休息'}</div>
        </div>` : ''}
      </div>`;
    }
    html += '</div>';
    html += '<div style="margin-top:12px;font-size:12px;color:var(--text-secondary)">排期基于选题库自动生成，可根据实际情况调整。抖音日更，小红书隔日更。</div>';
    document.getElementById('scheduleContent').innerHTML = html;
  }

  // renderCommentScripts
  function renderCommentScripts() {
    const demands = DATA.comment_demands || [];
    const topics = DATA.topics || [];
  
    // 高赞回复模式
    const replyPatterns = [
      { type: '补充干货型', text: '补充一个：用XX工具的XX功能效果更好，亲测有效！' },
      { type: '提问互动型', text: '你们最想用AI解决什么问题？评论区告诉我，下期安排！' },
      { type: '共鸣认同型', text: '说到点子上了，我也是踩了无数坑才总结出来的' },
      { type: '反转惊喜型', text: '其实还有个隐藏功能，90%的人不知道，看我主页' },
      { type: '福利引导型', text: '整理了全套资料，需要的评论区扣"想要"' },
    ];
  
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    html += '<div>';
    html += '<h4 style="color:var(--text-secondary);font-size:13px;margin-bottom:10px">高赞回复模式（直接套用）</h4>';
    replyPatterns.forEach(p => {
      html += '<div class="comment-tpl"><div class="ct-type">' + p.type + '</div><div class="ct-text">' + p.text + '</div></div>';
    });
    html += '</div>';
  
    // 置顶评论话术（基于当前TOP选题）
    html += '<div>';
    html += '<h4 style="color:var(--text-secondary);font-size:13px;margin-bottom:10px">置顶评论引导话术</h4>';
    const topTopics = topics.slice(0, 3);
    topTopics.forEach(t => {
      const kw = t.keyword || '';
      html += '<div class="pinned-comment">';
      html += '<div class="pc-label">选题：' + t.title.substring(0, 20) + '</div>';
      html += '<div class="ct-text">想要' + kw + '全套教程的，评论区扣"1"，我整理好了发你！<br>觉得有用的点个赞，你的支持是我更新的动力</div>';
      html += '</div>';
    });
    html += '</div></div>';
  
    // 评论区需求洞察
    if (demands.length) {
      html += '<div style="margin-top:16px"><h4 style="color:var(--text-secondary);font-size:13px;margin-bottom:8px">评论区高频需求（下期选题参考）</h4>';
      html += '<div class="kw-cloud">';
      demands.slice(0, 10).forEach(d => {
        html += '<span>' + (d.demand || d.keyword || d) + '</span>';
      });
      html += '</div></div>';
    }
  
    document.getElementById('commentScriptsContent').innerHTML = html;
  }

  // CHECKLIST_ITEMS - 发布前自检清单
  const CHECKLIST_ITEMS = [
    { id: 'title', text: '确认选题标题和钩子文案（前3秒留人）' },
    { id: 'avatar', text: '准备数字人形象和口播文案（语速自然）' },
    { id: 'footage', text: '收集AI生成素材并完成混剪（60-90秒）' },
    { id: 'subtitle', text: '添加字幕、配乐和关键信息高亮' },
    { id: 'timing', text: '选择最佳发布时间（18:00-21:00）' },
    { id: 'comment', text: '准备评论区置顶引流话术和小号引导' },
  ];

  // renderChecklist
  function renderChecklist() {
    const saved = JSON.parse(localStorage.getItem('publishChecklist') || '{}');
    let html = '';
    CHECKLIST_ITEMS.forEach(item => {
      const checked = saved[item.id] ? 'checked' : '';
      const mark = saved[item.id] ? '✓' : '';
      html += '<div class="checklist-item ' + checked + '" onclick="toggleCheck(\'' + item.id + '\')">';
      html += '<div class="checklist-box">' + mark + '</div>';
      html += '<div class="checklist-text">' + item.text + '</div>';
      html += '</div>';
    });
    document.getElementById('checklistContent').innerHTML = html;
    updateChecklistProgress();
  }

  // toggleCheck
  function toggleCheck(id) {
    const saved = JSON.parse(localStorage.getItem('publishChecklist') || '{}');
    saved[id] = !saved[id];
    localStorage.setItem('publishChecklist', JSON.stringify(saved));
    renderChecklist();
  }

  // updateChecklistProgress
  function updateChecklistProgress() {
    const saved = JSON.parse(localStorage.getItem('publishChecklist') || '{}');
    const done = Object.values(saved).filter(Boolean).length;
    document.getElementById('checklistProgress').innerHTML = '已完成 <b>' + done + '</b>/' + CHECKLIST_ITEMS.length + ' 项' + (done === CHECKLIST_ITEMS.length ? ' 可以发布了！' : '');
  }

  // filteredTopics
  function filteredTopics() { return filterByPlatform(DATA.topics||[]); }

  // generateShootList
  function generateShootList(topicIndex) {
    var topics = filteredTopics();
    var t = topics[topicIndex];
    if (!t) return;
    var items = [
      '确认选题标题和钩子文案',
      '准备数字人形象和口播文案',
      '收集AI生成素材（截图/演示视频）',
      '准备参考爆款视频的结构和节奏',
      '录制数字人口播（注意语速和停顿）',
      '剪辑：口播+素材混剪，控制在60-90秒',
      '添加字幕和关键信息高亮',
      '选择最佳发布时间（18:00-21:00）',
      '准备评论区引流话术',
      '发布后30分钟内回复前10条评论',
    ];
    var html = '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">选题：' + t.title + '</div>';
    html += items.map(function(item, i) {
      return '<div class="shoot-item"><input type="checkbox" id="shoot-' + i + '"><label for="shoot-' + i + '">' + (i+1) + '. ' + item + '</label></div>';
    }).join('');
    document.getElementById('shootModalBody').innerHTML = html;
    document.getElementById('shootModal').classList.add('active');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "topics",
      requiredFields: ['topics'],
      render: function(data) {
        try { renderTopics(data); generateSchedule(data); renderCommentScripts(data); renderChecklist(); } catch(e) { console.error("[topics]", e); }
      }
    });
  }
  window.renderTopics = renderTopics;
  window.calcTopicScore = calcTopicScore;
  window.generateTitles = generateTitles;
  window.getPlatformAdaptation = getPlatformAdaptation;
  window.generateSchedule = generateSchedule;
  window.renderCommentScripts = renderCommentScripts;
  window.renderChecklist = renderChecklist;
  window.toggleCheck = toggleCheck;
  window.updateChecklistProgress = updateChecklistProgress;
  window.filteredTopics = filteredTopics;
  window.generateShootList = generateShootList;
})();
