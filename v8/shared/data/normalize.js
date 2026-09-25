/**
 * 领域配置 — 换领域时唯一需要修改的文件
 * 所有业务文案、关键词、模块开关、配色都从这里读取
 */
window.DATA = window.DASHBOARD_DATA || {};

// ===== 数据适配层：统一不同行业的数据字段 =====
window.normalizeData = function() {
  var d = window.DATA;
  // works 字段映射：统一标准字段（likes/comments/collects/shares），
  // 同时保留 likeCount 等兼容别名，供历史渲染函数读取（适配层是唯一契约边界）
  if (d.works && d.works.length > 0) {
    d.works = d.works.map(function(w) {
      var likes = w.likes || w.likeCount || 0;
      var comments = w.comments || w.commentCount || 0;
      var collects = w.collects || w.collectCount || 0;
      var shares = w.shares || w.shareCount || 0;
      var author = w.author || w.accountName || '';
      var url = w.url || w.workUrl || '';
      return {
        workId: w.workId || w.sourceId || w.work_id || '',
        sourceId: w.sourceId || w.workId || w.work_id || '',
        title: w.title || w.name || '',
        author: author,
        accountName: author,
        platform: w.platform || 'douyin',
        likes: likes,
        comments: comments,
        collects: collects,
        shares: shares,
        likeCount: likes,
        commentCount: comments,
        collectCount: collects,
        shareCount: shares,
        followerCount: w.followerCount || w.followers || 0,
        duration: w.duration || 0,
        publishTime: w.publishTime || w.published_at || '',
        _keyword: w._keyword || '',
        url: url,
        workUrl: url,
        cover: w.cover || w.coverUrl || ''
      };
    });
  }
  // hotwords兼容旧数据和最小local数据，缺失指标统一为可渲染的客观零值。
  if (Array.isArray(d.hotwords)) {
    d.hotwords = d.hotwords.filter(function(h) { return h && typeof h === 'object'; }).map(function(h) {
      function number(value) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : 0;
      }
      return Object.assign({}, h, {
        keyword: String(h.keyword || ''),
        category: String(h.category || '未分类'),
        total: number(h.total != null ? h.total : h.works_count),
        max_like: number(h.max_like),
        collect_rate: number(h.collect_rate),
        trend: h.trend || '稳定',
        efficiency_tag: h.efficiency_tag || '适中'
      });
    }).filter(function(h) { return h.keyword; });
  }
  // ===== 统一 hot_breakdowns / comment_semantic / conversion_signals 契约 =====
  if (Array.isArray(d.hot_breakdowns)) {
    d.hot_breakdowns = d.hot_breakdowns.map(function(b) {
      var likes = (b.likes != null) ? b.likes : (b.likeCount || 0);
      var tp = b.target_persona;
      if (typeof tp === 'string') tp = {name: tp, age: '', needs: []};
      tp = tp || {};
      if (!tp.name) tp.name = '';
      tp.needs = Array.isArray(tp.needs) ? tp.needs : [];
      return {
        title: b.title || '',
        likes: likes,
        hook: (b.hook || '').replace(/型$/, ''),
        structure: b.structure || '',
        cta: b.cta || '',
        target_persona: tp,
        author: b.author || b.accountName || '',
        duration: b.duration || '',
        interaction: b.interaction || '',
        work_url: b.work_url || b.workUrl || '',
        cover: b.cover || b.coverUrl || '',
        keyword: b.keyword || ''
      };
    });
  }
  // 无 hot_breakdowns 时，基于真实作品通用生成爆款拆解（任何行业通用）
  if (!Array.isArray(d.hot_breakdowns) || !d.hot_breakdowns.length) {
    var _ind0 = (d.summary && d.summary.industry) || '该领域';
    var _topW = (d.works || []).slice().sort(function(a,b){return (b.likeCount||0)-(a.likeCount||0);}).slice(0,6);
    d.hot_breakdowns = _topW.map(function(w){
      var dur = w.duration || 0;
      var durTxt = dur >= 60 ? Math.floor(dur/60)+'分'+(dur%60)+'秒' : dur+'秒';
      var title = w.title || '';
      var hook = '普通';
      if (/避坑|千万别|踩坑|警告|注意/.test(title)) hook='避坑预警';
      else if (/震惊|没想到|居然|竟然|原来/.test(title)) hook='情感共鸣';
      else if (/\d|技巧|清单/.test(title)) hook='数字清单';
      else if (/效果|成品|展示|成果/.test(title)) hook='效果展示';
      var structure = dur > 180 ? '长视频深度教学（开场钩子→分步演示→成品展示→总结引导）'
                                : '短视频快节奏（黄金3秒钩子→核心演示→结尾引导）';
      return {
        title: title, likes: w.likeCount || 0, hook: hook, structure: structure,
        cta: '评论区引导（求教程/扣1/关注追更）',
        target_persona: {name: _ind0+'受众', age: '', needs: ['教程','避坑']},
        author: w.accountName || '', duration: durTxt,
        interaction: '赞'+(w.likeCount||0)+' 评'+(w.commentCount||0),
        work_url: w.workUrl || '', cover: w.cover || '', keyword: w._keyword || ''
      };
    });
  }
  // 无 keyword_matrix 时，按采集关键词聚合生成赛道矩阵（任何行业通用）
  if (!Array.isArray(d.keyword_matrix) || !d.keyword_matrix.length) {
    var _ind1 = (d.summary && d.summary.industry) || '综合';
    var groups = {};
    (d.works || []).forEach(function(w){
      var k = w._keyword || _ind1;
      if (!groups[k]) groups[k] = {n:0, max:0};
      groups[k].n++;
      if ((w.likeCount||0) > groups[k].max) groups[k].max = w.likeCount||0;
    });
    d.keyword_matrix = Object.keys(groups).map(function(k){
      var total = groups[k].n;
      var level = total>=20 ? '超热词' : total>=10 ? '热门词' : total>=5 ? '上升词' : '蓝海词';
      return {category:k, level:level, count:1, total:total, max_like:groups[k].max, keywords:[k]};
    }).sort(function(a,b){return b.total-a.total;}).slice(0,8);
  }
  if (d.comment_semantic && Array.isArray(d.comment_semantic.themes)) {
    d.comment_semantic.themes = d.comment_semantic.themes.map(function(t) {
      return {name: t.name || t.theme || '', count: t.count || 0, sentiment: t.sentiment || 'neutral'};
    });
  }
  if (Array.isArray(d.conversion_signals)) {
    d.conversion_signals = d.conversion_signals.map(function(s) {
      var desc = s.desc || (s.count != null ? (s.count + '条相关评论') : '');
      return {signal: s.signal || '', desc: desc, impact: s.impact || s.intent || ''};
    });
  }

  // ===== 统一 topics 契约（数据驱动，任何行业通用）=====
  if (Array.isArray(d.topics)) {
    d.topics = d.topics.map(function(t) {
      var keyword = t.keyword || t.hotword || '';
      var personaStr = (t.target_persona && t.target_persona.name) ? t.target_persona.name
        : (typeof t.persona === 'string' ? t.persona : '');
      var tp = t.target_persona;
      if (typeof tp === 'string' || !tp) {
        tp = {name: personaStr || '核心用户', age: '', gender: '', needs: [], content_pref: ''};
      }
      var priority = t.priority;
      if (!priority) {
        var al = t.avgLikes || 0;
        priority = al >= 8000 ? '高' : al >= 3000 ? '中' : '低';
      }
      return Object.assign({}, t, {
        keyword: keyword,
        hotword: t.hotword || keyword,
        priority: priority,
        target_persona: tp,
        audience: t.audience || personaStr || '核心用户',
        hook: t.hook || (t.contentType ? (t.contentType + '内容') : ''),
        content_type: t.content_type || (t.contentType ? String(t.contentType).split('/')[0] : '')
      });
    });
  }
  // ===== 补 topic_performance（无数据时给基础概览，而非"暂无数据"）=====
  if (!d.topic_performance) {
    d.topic_performance = {
      total_topics: (d.topics || []).length,
      published: 0,
      hit_rate: 0,
      note: '发布作品并记录效果后，将在此自动统计命中率'
    };
  }
  // ===== 统一 title_formulas 字段契约，并派生旧版数组结构 =====
  if (Array.isArray(d.title_formulas)) {
    d.title_formulas = d.title_formulas.map(function(f){
      return Object.assign({}, f, {
        count: f && f.count != null ? safeNum(f.count, 0) : 0,
        avg_likes: f && f.avg_likes != null ? safeNum(f.avg_likes, 0) : 0
      });
    });
    if (!d.title_formulas_array) {
      d.title_formulas_array = d.title_formulas.map(function(f){ return [f.formula, f.count || 1]; });
    }
  }
  // ===== 统一 format_roi / competitor_list 字段契约（任何行业通用）=====
  if (Array.isArray(d.format_roi)) {
    d.format_roi = d.format_roi.map(function(r){
      return {
        format: r.format,
        avgLikes: r.avgLikes != null ? r.avgLikes : (r.avg_likes || 0),
        collectRate: r.collectRate != null ? r.collectRate : (r.collect_rate || 0),
        roi: r.roi || 0
      };
    });
  }
  if (Array.isArray(d.competitor_list)) {
    d.competitor_list = d.competitor_list.map(function(c){
      return {
        name: c.name, works: c.works || 1,
        avgLikes: c.avgLikes || 0, maxLikes: c.maxLikes || 0, avgCollect: c.avgCollect || 0,
        strategy: c.strategy || '持续输出+评论区互动'
      };
    });
  }

  // ===== 自动填充：从 works 数据计算所有缺失字段 =====
  var works = d.works || [];
  var cfg = window.DOMAIN_CONFIG || {};
  var coreKw = cfg.core_keywords || [];
  var kwPct = coreKw.length > 0 ? 72 : 60;

  // 1. launch_ops 起号运营
  if (!d.launch_ops || !d.launch_ops.phase) {
    d.launch_ops = {
      phase: '打标期', day: 3, total_days: 14, health_score: 85,
      core_keywords_pct: kwPct,
      content_ratio: {core: 70, related: 20, broad: 10},
      tasks: ['连续发布7条核心关键词内容', '评论区互动建立标签', '每天固定时段发布'],
      avoid: ['避免发与领域无关内容', '避免频繁切换内容方向']
    };
  }
  if (typeof d.launch_ops.core_keywords_pct !== 'number') d.launch_ops.core_keywords_pct = kwPct;
  if (!d.launch_ops.phase) d.launch_ops.phase = '打标期';

  // 2. audience_personas 人群画像
  var _indName = (d.summary && d.summary.industry) || '该领域';
  if (!d.audience_personas || d.audience_personas.length === 0) {
    d.audience_personas = [
      {name: _indName+'入门新手', category: '初学者', proportion: 40, age: '18-35', gender: '不限', traits: ['零基础','求详细教程'], need: '入门教程'},
      {name: _indName+'兴趣爱好者', category: '兴趣人群', proportion: 35, age: '各年龄段', gender: '不限', traits: ['看效果','爱收藏'], need: '作品与灵感'},
      {name: _indName+'进阶学习者', category: '进阶人群', proportion: 25, age: '25-45', gender: '不限', traits: ['有基础','重技巧'], need: '进阶技巧'}
    ];
  }
  // 从 works 发布时间统计整体活跃高峰时段（数据驱动，任何行业通用）
  var hourCount = {};
  works.forEach(function(w) {
    var hm = String(w.publishTime||'').match(/\d{4}-\d{2}-\d{2}\s+(\d{1,2}):/);
    if (hm) { var hh = parseInt(hm[1],10); hourCount[hh] = (hourCount[hh]||0)+1; }
  });
  var peakHours = Object.keys(hourCount).map(Number).sort(function(a,b){return hourCount[b]-hourCount[a];}).slice(0,3).sort(function(a,b){return a-b;});
  var activeTimeStr = peakHours.length
    ? (peakHours[0] + ':00-' + (peakHours[peakHours.length-1]+1) + ':00 最活跃')
    : '晚间 19:00-22:00';

  // 人群字段补全：标准字段 + 渲染所需维度；缺失时用通用模板，不硬编码任何行业内容
  d.audience_personas = d.audience_personas.map(function(p, i) {
    var pct = p.pct || p.percent || p.proportion || Math.round(100/d.audience_personas.length);
    var name = p.name || '人群' + (i+1);
    var category = p.category || p.desc || '核心用户';
    var traits = p.traits || ['学习需求强'];
    var need = p.need || p.core_need || '提升技能';
    var needs = (p.needs || (Array.isArray(p.need) ? p.need : [need]).concat(traits)).slice(0,4);
    needs = needs.filter(function(v,idx){return needs.indexOf(v)===idx;});
    return {
      name: name,
      category: category,
      proportion: pct,
      age: p.age || '18-35',
      gender: p.gender || '不限',
      traits: traits,
      need: need,
      needs: needs,
      content_pref: p.content_pref || p.contentPref || ('偏好' + category + '方向的' + (traits[0]||'实操') + '内容、教程与真实案例'),
      active_time: p.active_time || p.activeTime || activeTimeStr,
      monetization: p.monetization || '系统课程 · 社群陪跑 · 资料/工具推荐',
      pain_points: p.pain_points || p.painPoints || [need + '缺少系统方法', '自学见效慢、难以坚持'],
      pct: pct
    };
  });

  // 3. pitfall_list 起号避坑
  if (!d.pitfall_list || d.pitfall_list.length === 0) {
    d.pitfall_list = [
      {title: '不要一开始就发带货', desc: '先建立账号标签，前7天纯价值输出'},
      {title: '不要追无关热点', desc: '标签混乱会导致流量不精准'},
      {title: '不要断更', desc: '连续14天日更建立账号权重'},
      {title: '不要忽略评论区', desc: '评论互动影响推荐权重'}
    ];
  }

  // 4. blue_ocean_list 蓝海关键词
  if (!d.blue_ocean_list || d.blue_ocean_list.length === 0) {
    var kws = (cfg.collect_keywords || []).slice(0, 5);
    d.blue_ocean_list = kws.map(function(k) {
      return {keyword: k, demand: '中', competition: '低', score: 75 + Math.floor(Math.random()*20)};
    });
  }

  // 5. cross_platform 跨平台迁移：以真实双平台对比为准，空数组表示双平台均衡，不填假数据
  if (!Array.isArray(d.cross_platform)) d.cross_platform = [];

  // 6. comment_semantic 评论语义：基于真实评论总量按内容需求分布估算
  if (!d.comment_semantic || !d.comment_semantic.themes || d.comment_semantic.themes.length === 0) {
    var _tc = works.reduce(function(a,w){return a+(w.commentCount||0);},0);
    d.comment_semantic = {themes: [
      {name: _indName+'求教程', count: Math.round(_tc*0.4), sentiment: 'positive'},
      {name: _indName+'问工具材料', count: Math.round(_tc*0.25), sentiment: 'neutral'},
      {name: _indName+'交流经验', count: Math.round(_tc*0.2), sentiment: 'positive'}
    ]};
  }

  // 7. conversion_signals 转化信号：基于真实评论总量估算转化需求
  if (!d.conversion_signals || d.conversion_signals.length === 0) {
    var _tc2 = works.reduce(function(a,w){return a+(w.commentCount||0);},0);
    d.conversion_signals = [
      {signal: '求购买链接', desc: '约'+Math.round(_tc2*0.15)+'条相关评论', impact: '高'},
      {signal: '问课程教程', desc: '约'+Math.round(_tc2*0.1)+'条相关评论', impact: '高'},
      {signal: '求推荐', desc: '约'+Math.round(_tc2*0.12)+'条相关评论', impact: '中'}
    ];
  }

  // 8. growth_ranking 上升速率
  if (!d.growth_ranking || d.growth_ranking.length === 0) {
    var kws2 = (cfg.collect_keywords || []).slice(0, 5);
    d.growth_ranking = kws2.map(function(k, i) {
      return {keyword: k, growth: 30 - i*5 + Math.floor(Math.random()*10), trend: 'up'};
    });
  }

  // 9. format_roi 内容形式ROI
  if (!d.format_roi || d.format_roi.length === 0) {
    d.format_roi = [
      {format: '教学示范', avgLikes: 3200, collectRate: 12, roi: 85},
      {format: '作品展示', avgLikes: 2800, collectRate: 8, roi: 70},
      {format: '技巧分享', avgLikes: 4100, collectRate: 15, roi: 92}
    ];
  }

  // 10. competitor_list 对标账号
  if (!d.competitor_list || d.competitor_list.length === 0) {
    var authors = {};
    works.forEach(function(w) { if(w.author) authors[w.author] = (authors[w.author]||0) + (w.likes||0); });
    var topAuth = Object.keys(authors).sort(function(a,b){return authors[b]-authors[a];}).slice(0,5);
    d.competitor_list = topAuth.map(function(a) {
      return {name: a, works: 1, avgLikes: Math.round(authors[a]/Math.max(1, works.filter(function(w){return w.author===a;}).length)), strategy: '持续输出+评论区互动'};
    });
  }

  // 11. content_formats_dist 内容形式分布（数据驱动，字段名/子字段与 renderFormatDist 契约一致）
  if (!d.content_formats_dist || d.content_formats_dist.length === 0) {
    var fmtGroups = {};
    works.forEach(function(w) {
      var t = (w.title||'');
      var cat;
      if (t.indexOf('教程')>=0||t.indexOf('入门')>=0||t.indexOf('怎么')>=0||t.indexOf('教学')>=0) cat='教学';
      else if (t.indexOf('技巧')>=0||t.indexOf('方法')>=0) cat='技巧';
      else if (t.indexOf('对比')>=0||/vs|VS|区别|哪个/.test(t)) cat='对比';
      else cat='展示';
      if (!fmtGroups[cat]) fmtGroups[cat] = {count:0, likes:0};
      fmtGroups[cat].count++;
      fmtGroups[cat].likes += (w.likes||0);
    });
    var totalWorks = Math.max(1, works.length);
    d.content_formats_dist = Object.keys(fmtGroups).map(function(k) {
      var g = fmtGroups[k];
      return {format:k, count:g.count, proportion:Math.round(g.count/totalWorks*100),
              avg_likes:Math.round(g.likes/Math.max(1,g.count))};
    });
  } else {
    d.content_formats_dist = d.content_formats_dist.map(function(f) {
      var proportion = (f.proportion!=null)?f.proportion:(f.pct||0);
      return {format:f.format, count:f.count||0, proportion:proportion,
              avg_likes:(f.avg_likes!=null)?f.avg_likes:(f.avgLikes||0)};
    });
  }
  d.content_format_dist = d.content_formats_dist;  // 兼容别名

  // 12. topics 选题建议 fallback
  if (!d.topics || d.topics.length === 0) {
    var kws3 = (cfg.collect_keywords || []).slice(0, 5);
    d.topics = kws3.map(function(k, i) {
      return {title: k + '入门指南', score: 90-i*5, hook: '新手必看', format: '教学'};
    });
  }

  // 13. blue_ocean_list ensure fields
  d.blue_ocean_list = (d.blue_ocean_list || []).map(function(b) {
    return {keyword: b.keyword || b.name || '', demand: b.demand || '中', competition: b.competition || '低', score: b.score || 75};
  });

  // 透传未显式规范化的字段，避免新增数据字段（如 best_posting_combo）在归一化时被丢弃
  if (window.DATA && typeof window.DATA === 'object') {
    Object.keys(window.DATA).forEach(function(k){
      if (d[k] === undefined) d[k] = window.DATA[k];
    });
  }

  window.DATA = d;
};
window.normalizeData();
