/**
 * 领域配置 — 换领域时唯一需要修改的文件
 * 所有业务文案、关键词、模块开关、配色都从这里读取
 */
window.DATA = window.DASHBOARD_DATA || {};

// ===== 数据适配层：统一不同行业的数据字段 =====
window.normalizeData = function() {
  var d = window.DATA;
  function normalizePublishTime(value) {
    if (typeof value !== 'number' || !isFinite(value)) return value || '';
    var millis = value < 1000000000000 ? value * 1000 : value;
    var date = new Date(millis);
    if (isNaN(date.getTime())) return '';
    function pad(number) { return String(number).padStart(2, '0'); }
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
      pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }
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
      var sourceKeywords = Array.isArray(w.sourceKeywords) ? w.sourceKeywords.slice() : [];
      [w.sourceKeyword, w._collectedKeyword, w.queryKeyword, w._keyword, w.keyword].forEach(function(value) {
        value = String(value || '').trim();
        if (value && sourceKeywords.indexOf(value) < 0) sourceKeywords.push(value);
      });
      return {
        workId: w.workId || w.sourceId || w.work_id || '',
        sourceId: w.sourceId || w.workId || w.work_id || '',
        title: w.title || w.name || '',
        caption: w.caption || w.content || w.workDesc || w.desc || w.description || '',
        transcript: w.transcript || w.subtitle || w.subtitles || '',
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
        publishTime: normalizePublishTime(w.publishTime || w.published_at || w.releaseTime || ''),
        sourceKeywords: sourceKeywords,
        keywordAttributionStatus: sourceKeywords.length ? 'attributed' : 'unknown',
        _keyword: sourceKeywords[0] || '',
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
      return {name: t.name || t.theme || '', count: t.count || 0, description: t.description || t.desc || '', sentiment: t.sentiment || 'neutral'};
    });
  }
  if (Array.isArray(d.conversion_signals)) {
    d.conversion_signals = d.conversion_signals.map(function(s) {
      var desc = s.desc || (s.count != null ? (s.count + '条相关评论') : '');
      return {signal: s.signal || '', desc: desc, impact: s.impact || s.intent || '', evidenceCount: s.evidenceCount != null ? s.evidenceCount : s.count, sourceType: s.sourceType || s.source || ''};
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

  // 4. blue_ocean_list 蓝海关键词：没有真实聚合结果时保持为空
  if (!d.blue_ocean_list || d.blue_ocean_list.length === 0) {
    d.blue_ocean_list = [];
  }

  // 5. cross_platform 跨平台迁移：以真实双平台对比为准，空数组表示双平台均衡，不填假数据
  if (!Array.isArray(d.cross_platform)) d.cross_platform = [];

  // 6. 评论语义必须来自评论正文，不能用评论总数估算。
  if (!d.comment_semantic || !d.comment_semantic.themes || d.comment_semantic.themes.length === 0) {
    d.comment_semantic = {themes: []};
  }

  // 7. 转化信号必须来自评论正文。
  if (!d.conversion_signals || d.conversion_signals.length === 0) {
    d.conversion_signals = [];
  }

  // 8. 上升速率需要至少两个历史快照。
  if (!d.growth_ranking || d.growth_ranking.length === 0) {
    d.growth_ranking = [];
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
    return {keyword: b.keyword || b.name || '', demand: b.demand || '', competition: b.competition || '', score: b.score == null ? null : b.score};
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
window.DOMAIN_CONFIG = window.DOMAIN_CONFIG || {
  // ===== 基础信息 =====
  id: 'ai',
  name: 'AI',
  display_name: 'AI热点追踪',
  tagline: '零推流贴标签起号法 · 数据驱动内容运营',
  language: 'zh-CN',

  // ===== 品牌配置 =====
  brand: {
    name_en: 'PYRALUMA',
    name_cn: '璃火矩创',
    slogan: 'AI Intelligence',
    logo_type: 'shapes',
  },

  // ===== 采集关键词（RedFox API用）=====
  collect_keywords: [
    'AI', 'AI工具', 'AI绘画', 'AI视频', 'AI数字人',
    'AI工作流', 'AI提示词', 'AI编程', '大模型', 'ChatGPT',
    '可灵AI', '即梦AI', 'Midjourney', 'Sora', '豆包AI',
    'Dify', 'Coze', 'ComfyUI', 'n8n', 'AI Agent'
  ],

  // ===== 核心关键词（用于标签健康度计算）=====
  core_keywords: [
    'AI工作流', '自动化', '工作流', '效率', '提示词',
    'Agent', 'Dify', 'Coze', 'ComfyUI', 'n8n',
    'AI编程', 'AI教程', '实操', '配置', '部署'
  ],
  exclude_keywords: ['AI'],  // 趋势图中排除的超大词
  related_keywords: [
    'AI工具', 'AI绘画', 'AI视频', '大模型', 'GPT',
    'Claude', '可灵', '即梦', 'Midjourney', 'Sora',
    '开源', 'GitHub'
  ],

  // ===== 内容分类规则（关键词→分类映射）=====
  content_categories: [
    { name: 'AI工具', keywords: ['工具', '推荐', '神器', '软件'] },
    { name: 'AI绘画', keywords: ['绘画', '画图', '做图', '生图', 'Midjourney', '即梦'] },
    { name: 'AI视频', keywords: ['视频', '短片', '动画', '可灵', 'Sora', '数字人'] },
    { name: 'AI工作流', keywords: ['工作流', '自动化', 'Agent', 'Dify', 'Coze', 'n8n', 'ComfyUI'] },
    { name: 'AI编程', keywords: ['编程', '代码', '开发', 'Cursor', 'GitHub'] },
    { name: 'AI办公', keywords: ['PPT', 'Excel', '办公', '文档', '写作', '文案'] },
    { name: 'AI资讯', keywords: ['资讯', '新闻', '发布', '更新', '趋势'] },
    { name: 'AI教程', keywords: ['教程', '教学', '入门', '怎么用', '实操'] },
  ],

  // ===== 视频格式分类规则 =====
  format_rules: [
    { name: '教程实操', keywords: ['教程', '教学', '步骤', '怎么', '实操', '手把手'] },
    { name: '工具测评', keywords: ['测评', '评测', '对比', '推荐', '神器', '工具'] },
    { name: '资讯速报', keywords: ['资讯', '新闻', '发布', '更新', '最新'] },
    { name: '效果展示', keywords: ['展示', '效果', '作品', '案例', '欣赏'] },
    { name: '观点解读', keywords: ['观点', '解读', '分析', '思考', '为什么'] },
  ],

  // ===== 模块开关 =====
  modules: {
    hero: true, works: true, techradar: true, hotwords: true,
    history: true, breakdown: true, viralGenes: true, insights: true,
    topics: true, titleGen: true, schedule: true, topicPerf: true,
    commentScripts: true, checklist: true, publishTime: true,
    titleFormulas: true, leadScripts: true, launchOps: true,
    audience: true, saturation: true,
  },

  // ===== 导航顺序 =====
  nav_order: ['hero', 'techradar', 'hotwords', 'breakdown', 'topics', 'topicPerf', 'publishTime', 'titleFormulas', 'leadScripts', 'launchOps', 'audience'],

  // ===== 导航标签 =====
  nav_labels: {
    hero: '总览', techradar: '技术雷达', hotwords: '热词',
    breakdown: '爆款拆解', topics: '选题', topicPerf: '选题表现',
    publishTime: '发布时间', titleFormulas: '标题公式',
    leadScripts: '钩子话术', launchOps: '起号运营', audience: '人群画像',
  },

  // ===== 主题配色 =====
  theme: {
    bg: '#0a0a0f',
    bg_gradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1025 50%, #0f1a2a 100%)',
    primary: '#8b5cf6', primary_light: '#a78bfa',
    accent: '#30D158', warning: '#fbbf24', danger: '#f87171', info: '#60a5fa',
    text: '#f1f5f9', text_secondary: '#94a3b8', text_tertiary: '#64748b',
    glass_bg: 'rgba(255,255,255,0.06)', glass_border: 'rgba(255,255,255,0.1)',
    glow_hue_start: 280, glow_hue_end: 200,
  },

  // ===== 起号配置 =====
  launch: {
    start_date: '2026-09-01',
    target_ratio: { core: 70, related: 20, general: 10 },
    tasks: [
      '每日发布1-2条，覆盖核心关键词',
      '前10条不挂车、不带货，纯内容打标签',
      '每条视频标题包含1个核心关键词',
      '发布时间固定在18:00-21:00黄金时段',
      '评论区主动回复前20条，引导互动',
      '不删视频、不隐藏作品，保持账号稳定',
      '7天后检查标签健康度，调整内容方向',
    ],
    pitfalls: [
      '不要发泛娱乐内容，会打乱账号标签',
      '不要买粉买赞，会被系统识别降权',
      '打标期不要频繁删视频，影响权重',
      '不要一开始就带货，转化率极低',
      '不要追与领域无关的热点',
    ],
  },

  // ===== 人群画像 =====
  audience_categories: [
    { name: '技术极客', proportion: 65.9, needs: ['深度教程', '工作流', '源码', '前沿技术'] },
    { name: '视觉创作者', proportion: 15.2, needs: ['AI绘画', 'AI视频', '提示词', '风格参考'] },
    { name: '泛AI关注者', proportion: 10.1, needs: ['资讯', '测评', '趋势', '入门'] },
    { name: '职场效率', proportion: 5.3, needs: ['办公自动化', 'PPT', '文案', '效率工具'] },
    { name: '创业者', proportion: 3.5, needs: ['AI创业', '变现', '商业模式', '投资'] },
  ],

  // ===== 标题公式 =====
  title_formulas: [
    { pattern: '{keyword}保姆级教程，小白也能上手', type: '教程型', ctr: '高' },
    { pattern: '我用{keyword}做了一个{result}，效果惊人', type: '效果型', ctr: '高' },
    { pattern: '{keyword} vs {keyword2}，到底谁更强？', type: '对比型', ctr: '中' },
    { pattern: '2026年最值得学的{keyword}，收藏吃灰', type: '收藏型', ctr: '中' },
    { pattern: '别再用{keyword}了，这个方法快10倍', type: '反常识型', ctr: '高' },
    { pattern: '{keyword}从入门到精通，看这一篇就够了', type: '合集型', ctr: '中' },
  ],

  // ===== 钩子话术 =====
  lead_scripts: [
    { hook: '90%的人不知道，{keyword}还能这么用', type: '反常识', duration: '0-3秒' },
    { hook: '学会这个{keyword}技巧，效率直接翻倍', type: '利益点', duration: '0-3秒' },
    { hook: '我花了3天研究{keyword}，总结出这5点', type: '付出感', duration: '0-5秒' },
    { hook: '{keyword}最新更新，这个功能太香了', type: '新鲜感', duration: '0-3秒' },
    { hook: '新手做{keyword}最容易犯的3个错误', type: '避坑型', duration: '0-5秒' },
  ],

  // ===== 文案模板 =====
  copy: {
    hero_title: '热点追踪工作台',
    hero_subtitle: '双平台数据 · 智能选题 · 起号运营',
    data_fresh_warning: '数据超过24小时未更新',
    collect_failed: '采集失败，显示上次缓存数据',
    section_titles: {
      hero: '总览', techradar: '技术雷达', hotwords: '热词分析',
      breakdown: '爆款拆解', topics: '选题建议', topicPerf: '选题表现',
      publishTime: '发布时间分析', titleFormulas: '标题公式库',
      leadScripts: '钩子话术库', launchOps: '起号运营', audience: '人群画像',
    },
  },

  // ===== 变现规则 =====
  monetization_rules: [
    { match: ['工具','教程','入门','怎么做','做图','视频','ppt'], type: 'affiliate', score: 85, desc: '带货：工具会员/affiliate佣金' },
    { match: ['资讯','新闻','发布','agent'], type: 'ad', score: 70, desc: '广告：品牌合作、商单植入' },
    { match: ['工作流','自动化','效率'], type: 'private', score: 90, desc: '私域：引流微信，卖方案/咨询' },
    { match: ['提示词','prompt'], type: 'course', score: 75, desc: '知识付费：课程/社群' },
  ],

  // ===== 话题标签模板 =====
  hashtags: {
    core: '{cat} #AI #人工智能 #干货分享',
    tool: '{cat} #AI工具 #效率神器 #新手必看',
  },

  // ===== 内容格式 =====
  content_format: '15-40秒口播+AI素材混剪',

  // ===== CTA文案 =====
  cta: {
    question: '你们最想用AI解决什么问题？评论区告诉我，下期安排！',
  },

  // ===== 任务文案 =====
  tasks: {
    collect_footage: '收集AI生成素材并完成混剪（60-90秒）',
    collect_footage_short: '收集AI生成素材（截图/演示视频）',
  },

  // ===== 脚本模板 =====
  script_templates: {
    follow_cta: '关注我，每天分享一个AI实用技巧',
    comment_cta: '评论区扣1，发你完整工具包',
    hashtag_prefix: '#AI #',
    bg_desc: 'AI生成的',
  },

  // ===== 作品标签关键词 =====
  works: {
    theme_keywords: ['可灵','即梦','AI绘画','AI视频','数字人','工作流','Agent','提示词','教程','实测','对比','免费','神器','效率'],
  },

  // ===== 钩子话术详情（leadScripts用）=====
  lead_scripts_detail: [
    { target: '技术极客（65.9%）', text: '评论区扣"1"，我把这套AI工作流的完整配置和提示词打包发你，都是自己实测过的，直接能用。' },
    { target: '视觉创作者（9.8%）', text: '想要这套AI出图的完整提示词和参数设置吗？评论区告诉我你用的是什么工具，我针对性发你。' },
    { target: '泛AI关注者（22.5%）', text: '刚整理了一份《AI工具避坑指南》，把我花了几万块踩过的坑都写进去了，评论区"避坑"我发你。' },
    { target: '职场效率人群', text: '这套AI工作流我自己用了半年，每天省2小时。想要的评论区"效率"，我把模板和教程一起发你。' },
    { target: '创业者/副业人群', text: '用AI做副业第一个月赚了XX，把完整的工具链和操作流程整理好了，评论区"副业"发你完整版。' },
  ],

  // ===== 标题公式示例 =====
  title_formula_examples: {
    '感叹句': '太绝了！这个AI工具让我效率提升10倍',
    '教程型': '手把手教你用AI做XX，3分钟上手',
    '疑问句': 'AI做图还在手动调参？这个方法90%的人不知道',
    '否定警告': '千万别再用XX做AI了，这3个坑踩过的人都哭了',
    '极限词': '2026最强AI工具排行，第一名居然是它',
    '实测型': '我用AI工作流跑了一周，效率提升了200%',
    '免费型': '免费白嫖！这款AI工具比付费的还好用',
  },



  // ===== 领域专属模块（换领域时自动关闭）=====
  domain_specific_modules: ['viralGenes', 'saturation'],
};

/**
 * 配置读取工具 — 所有模块通过cfg()读取配置，带兜底
 * 用法: cfg('brand.name_en') → 'PYRALUMA'
 *       cfg('modules.techradar', false) → true/false
 *       cfg('nonexistent.key', '默认值') → '默认值'
 */
window.cfg = function(path, defaultValue) {
  if (!window.DOMAIN_CONFIG) return defaultValue;
  const parts = path.split('.');
  let obj = window.DOMAIN_CONFIG;
  for (const p of parts) {
    if (obj == null || typeof obj !== 'object') return defaultValue;
    obj = obj[p];
  }
  return obj === undefined ? defaultValue : obj;
};

/**
 * 文本配置读取工具。标签配置允许使用模板字符串或字符串数组。
 */
window.cfgText = function(path, defaultValue) {
  const value = cfg(path, defaultValue);
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return value.join(' ');
  }
  return defaultValue;
};

/**
 * 领域守卫 — AI专属模块调用，非AI领域显示提示而非崩溃
 */
window.domainGuard = function(moduleId, renderFn) {
  const domainId = cfg('id', 'unknown');
  const specific = cfg('domain_specific_modules', []);
  if (specific.includes(moduleId) && domainId !== 'ai') {
    return function() {
      const el = document.querySelector('[data-module="' + moduleId + '"]');
      if (el) el.innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;">该模块为AI领域专属，当前领域「' + domainId + '」暂不支持</div>';
    };
  }
  return renderFn;
};


/* ===== core/globals.js ===== */
/**
 * core/globals.js — 全局共享变量与常量
 * 所有模块共用的全局状态、ECharts配置、辅助函数
 * 必须在模块之前加载
 */
(function() {
  'use strict';

  // ===== ECharts 实例容器 =====
  window.charts = {};

  // ===== ECharts 配色与样式常量 =====
  window.PALETTE = ['#0A84FF', '#BF5AF2', '#FF375F', '#FF9F0A', '#30D158', '#64D2FF', '#FFD60A', '#FF6482', '#5E5CE6', '#C08FC0'];
  window.TOOLTIP_BG = 'rgba(20,20,30,0.92)';
  window.TOOLTIP_BORDER = 'rgba(100,100,140,0.3)';
  window.TOOLTIP_TEXT = 'rgba(255,255,255,0.9)';
  window.AXIS_COLOR = 'rgba(255,255,255,0.45)';
  window.AXIS_LINE = 'rgba(255,255,255,0.15)';
  window.SPLIT_COLOR = 'rgba(255,255,255,0.06)';

  // ===== 筛选状态 =====
  window.currentCategory = 'all';
  window.currentPlatform = 'all';
  window.sortDir = {};

  // ===== 辅助函数（暴露到全局） =====
  window.trendClass = function(t) {
    if (t === '飙升') return 'surging';
    if (t === '新热') return 'new-hot';
    if (t === '衰退') return 'declining';
    return 'stable';
  };

  window.classifyHook = function(title) {
    if (/翻车|踩坑|避坑|别再|不要|后悔/.test(title)) return '痛点';
    if (/对比|vs|VS|区别|哪个好|pk/i.test(title)) return '对比';
    if (/揭秘|竟然|居然|没想到|真相|内幕/.test(title)) return '悬念';
    if (/太美了|绝了|惊艳|震撼|效果|大片/.test(title)) return '效果';
    if (/哭了|感动|暖心|治愈|陪伴/.test(title)) return '情感';
    return '数字';
  };

  window.animateNumber = function(el, target, duration) {
    duration = duration || 1200;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  // ===== applyFilter — 分类筛选 =====
  window.applyFilter = function() {
    var sel = document.getElementById('categoryFilter');
    if (sel) window.currentCategory = sel.value;
    window.renderAll();
  window.renderCommentSemantic = renderCommentSemantic; window.renderConversionSignals = renderConversionSignals; try { renderCommentSemantic(); renderConversionSignals(); } catch(e) {}
  };

  // ===== setPlatform — 平台切换 =====
  window.setPlatform = function(p) {
    window.currentPlatform = p;
    document.querySelectorAll('.platform-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.platform === p);
    });
    window.renderAll();
  };

  // ===== filterByPlatform =====
  window.filterByPlatform = function(arr) {
    if (!arr) return [];
    if (window.currentPlatform === 'all' || window.currentPlatform === 'compare') return arr;
    return arr.filter(function(item) { return item.platform === window.currentPlatform; });
  };

})();


/* ===== core/state.js ===== */
/**
 * 状态管理 — localStorage持久化
 * 看板状态、收藏、选题性能追踪、清单进度
 */
(function() {
  'use strict';

  const PREFIX = 'hotspot_';

  const State = {
    get(key, def) {
      try {
        const raw = StorageAdapter.getRaw(PREFIX + key, null);
        return raw ? JSON.parse(raw) : def;
      } catch (e) { return def; }
    },
    set(key, val) {
      try {
        StorageAdapter.setJSON(PREFIX + key, val);
      } catch (e) {}
    },

    // ===== 选题看板状态 =====
    getTopicStatus(title) {
      const all = this.get('topic_status', {});
      return all[title] || '待拍摄';
    },
    setTopicStatus(title, status) {
      const all = this.get('topic_status', {});
      all[title] = status;
      this.set('topic_status', all);
    },
    cycleTopicStatus(title) {
      const order = ['待拍摄', '拍摄中', '已发布', '已归档'];
      const cur = this.getTopicStatus(title);
      const next = order[(order.indexOf(cur) + 1) % order.length];
      this.setTopicStatus(title, next);
      return next;
    },
    getAllTopicStatus() {
      return this.get('topic_status', {});
    },

    // ===== 收藏 =====
    getFavorites() {
      return this.get('favorites', []);
    },
    isFavorite(workId) {
      return this.getFavorites().includes(workId);
    },
    toggleFavorite(workId) {
      const favs = this.getFavorites();
      const idx = favs.indexOf(workId);
      if (idx >= 0) favs.splice(idx, 1);
      else favs.push(workId);
      this.set('favorites', favs);
      return idx < 0;
    },

    // ===== 选题性能追踪 =====
    getPerfData() {
      return this.get('topic_perf', {});
    },
    recordPerf(title, data) {
      const all = this.getPerfData();
      all[title] = { ...all[title], ...data, recorded_at: new Date().toISOString() };
      this.set('topic_perf', all);
    },
    calcHitRate() {
      const perf = this.getPerfData();
      const total = Object.keys(perf).length;
      const hits = Object.values(perf).filter(p => p.views > 10000).length;
      return total ? Math.round(hits / total * 100) : 0;
    },

    // ===== 拍摄清单进度 =====
    getChecklist() {
      return this.get('checklist', {});
    },
    toggleCheck(topicTitle, itemIndex) {
      const all = this.getChecklist();
      if (!all[topicTitle]) all[topicTitle] = {};
      all[topicTitle][itemIndex] = !all[topicTitle][itemIndex];
      this.set('checklist', all);
      return all[topicTitle][itemIndex];
    },
    getChecklistProgress(topicTitle) {
      const data = this.getChecklist()[topicTitle] || {};
      const done = Object.values(data).filter(Boolean).length;
      const total = 10; // 固定10步
      return { done, total, percent: Math.round(done / total * 100) };
    },

    // ===== 积分追踪 =====
    getCreditUsage() {
      return this.get('credit_usage', { used: 0, total: 1000, history: [] });
    },
    addCreditUsage(points) {
      const data = this.getCreditUsage();
      data.used += points;
      data.history.push({ date: new Date().toISOString(), points });
      this.set('credit_usage', data);
      return data;
    },
  };

  window.State = State;
})();


/* ===== core/evidence.js ===== */
/**
 * V8.2 Alpha 1可信数据层：Evidence / Insight / Provenance / DataQuality。
 * 只读取V8.1数据，不修改works、hotwords或localStorage。
 */
(function() {
  'use strict';

  var SOURCE_TYPES = ['REAL', 'DERIVED', 'INFERRED'];
  var EVIDENCE_TYPES = ['work', 'comment', 'keyword'];
  var INSIGHT_TYPES = ['trend', 'pain_point', 'need', 'content_pattern', 'opportunity'];

  function text(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function nullableNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    var number = Number(value);
    return isFinite(number) ? number : null;
  }

  function stableHash(value) {
    var input = text(value);
    var hash = 2166136261;
    for (var i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function stableId(type, platform, sourceId, fallbackParts) {
    var identity = text(sourceId).trim();
    if (!identity) identity = 'key-' + stableHash((fallbackParts || []).map(text).join('|'));
    return ['evidence', type, text(platform || 'unknown'), encodeURIComponent(identity)].join(':');
  }

  function createProvenance(input) {
    input = input || {};
    var sourceType = SOURCE_TYPES.indexOf(input.sourceType) >= 0 ? input.sourceType : 'DERIVED';
    return {
      sourceType: sourceType,
      sourceFields: Array.isArray(input.sourceFields) ? input.sourceFields.slice() : [],
      formula: input.formula || null,
      sampleSize: nullableNumber(input.sampleSize) || 0,
      generatedBy: input.generatedBy || 'v8.2-analysis',
      generatedAt: input.generatedAt || new Date().toISOString(),
      limitations: Array.isArray(input.limitations) ? input.limitations.slice() : []
    };
  }

  function createEvidence(input) {
    input = input || {};
    if (EVIDENCE_TYPES.indexOf(input.type) < 0) return null;
    var platform = text(input.platform || 'unknown');
    var id = input.id || stableId(input.type, platform, input.sourceId, input.fallbackParts);
    return {
      id: id,
      type: input.type,
      platform: platform,
      sourceId: input.sourceId ? text(input.sourceId) : null,
      title: input.title ? text(input.title) : null,
      text: input.text ? text(input.text) : null,
      metrics: {
        likes: nullableNumber(input.metrics && input.metrics.likes),
        comments: nullableNumber(input.metrics && input.metrics.comments),
        shares: nullableNumber(input.metrics && input.metrics.shares),
        favorites: nullableNumber(input.metrics && input.metrics.favorites),
        views: nullableNumber(input.metrics && input.metrics.views)
      },
      keyword: input.keyword ? text(input.keyword) : null,
      author: input.author ? text(input.author) : null,
      url: input.url ? text(input.url) : null,
      publishedAt: input.publishedAt ? text(input.publishedAt) : null,
      collectedAt: input.collectedAt ? text(input.collectedAt) : null,
      provenance: createProvenance(input.provenance || { sourceType: 'REAL' })
    };
  }

  function EvidenceStore() {
    this.byId = new Map();
    this.byType = new Map();
    this.insightEvidence = new Map();
  }
  EvidenceStore.prototype.add = function(evidence) {
    if (!evidence || !evidence.id) return null;
    this.byId.set(evidence.id, evidence);
    if (!this.byType.has(evidence.type)) this.byType.set(evidence.type, []);
    var ids = this.byType.get(evidence.type);
    if (ids.indexOf(evidence.id) < 0) ids.push(evidence.id);
    return evidence;
  };
  EvidenceStore.prototype.getEvidence = function(id) { return this.byId.get(id) || null; };
  EvidenceStore.prototype.getEvidenceByIds = function(ids) {
    var self = this;
    return (ids || []).map(function(id) { return self.getEvidence(id); }).filter(Boolean);
  };
  EvidenceStore.prototype.getEvidenceByType = function(type) {
    return this.getEvidenceByIds(this.byType.get(type) || []);
  };
  EvidenceStore.prototype.linkInsight = function(insightId, evidenceIds) {
    this.insightEvidence.set(insightId, (evidenceIds || []).filter(function(id) { return this.byId.has(id); }, this));
  };
  EvidenceStore.prototype.getEvidenceByInsight = function(insightId) {
    return this.getEvidenceByIds(this.insightEvidence.get(insightId) || []);
  };
  EvidenceStore.prototype.count = function() { return this.byId.size; };

  function adaptV81Evidence(data) {
    data = data && typeof data === 'object' ? data : {};
    var store = new EvidenceStore();
    var collectedAt = data.last_update || null;
    var works = Array.isArray(data.works) ? data.works : [];
    works.forEach(function(work) {
      if (!work || typeof work !== 'object') return;
      store.add(createEvidence({
        type: 'work',
        platform: work.platform || work._platform || 'unknown',
        sourceId: work.workId || work.sourceId || null,
        fallbackParts: [work.workUrl || work.url, work.title, work.accountName || work.author, work.publishTime, work._keyword],
        title: work.title || work.name || null,
        text: work.content || work.title || null,
        metrics: {
          likes: work.likes != null ? work.likes : work.likeCount,
          comments: work.comments != null ? work.comments : work.commentCount,
          shares: work.shares != null ? work.shares : work.shareCount,
          favorites: work.collects != null ? work.collects : work.collectCount,
          views: work.views != null ? work.views : work.viewCount
        },
        keyword: work._keyword || work.keyword || null,
        author: work.author || work.accountName || null,
        url: work.url || work.workUrl || null,
        publishedAt: work.publishTime || work.published_at || null,
        collectedAt: work.crawlTime || collectedAt,
        provenance: { sourceType: 'REAL', sourceFields: ['works'], formula: null, sampleSize: 1, generatedBy: 'v8.1-compat' }
      }));
    });

    var comments = Array.isArray(data.comments) ? data.comments : [];
    comments.forEach(function(comment) {
      if (!comment || typeof comment !== 'object' || !text(comment.text || comment.content).trim()) return;
      store.add(createEvidence({
        type: 'comment',
        platform: comment.platform || 'unknown',
        sourceId: comment.commentId || comment.id || null,
        fallbackParts: [comment.workId, comment.text || comment.content, comment.author, comment.publishTime],
        text: comment.text || comment.content,
        metrics: { likes: comment.likes || comment.likeCount },
        keyword: comment.keyword || null,
        author: comment.author || comment.accountName || null,
        url: comment.url || null,
        publishedAt: comment.publishTime || null,
        collectedAt: comment.crawlTime || collectedAt,
        provenance: { sourceType: 'REAL', sourceFields: ['comments'], formula: null, sampleSize: 1, generatedBy: 'v8.1-compat' }
      }));
    });

    var hotwords = Array.isArray(data.hotwords) ? data.hotwords : [];
    hotwords.forEach(function(keyword) {
      if (!keyword || typeof keyword !== 'object' || !text(keyword.keyword).trim()) return;
      store.add(createEvidence({
        type: 'keyword',
        platform: keyword.platform || 'unknown',
        sourceId: [keyword.platform || 'unknown', keyword.keyword].join(':'),
        title: keyword.keyword,
        text: keyword.keyword,
        metrics: { likes: keyword.avg_like, comments: keyword.avg_comment, favorites: keyword.avg_collect, views: null },
        keyword: keyword.keyword,
        collectedAt: collectedAt,
        provenance: { sourceType: 'DERIVED', sourceFields: ['hotwords'], formula: 'keyword_aggregation', sampleSize: nullableNumber(keyword.works_count) || 0, generatedBy: 'v8.1-compat' }
      }));
    });
    return store;
  }

  function deriveDataQuality(data, store) {
    data = data && typeof data === 'object' ? data : {};
    var works = store.getEvidenceByType('work');
    var comments = store.getEvidenceByType('comment');
    var keywords = store.getEvidenceByType('keyword');
    var platforms = new Set(works.map(function(item) { return item.platform; }).filter(function(p) { return p && p !== 'unknown'; }));
    var history = Array.isArray(data.historical_trend) ? data.historical_trend : [];
    var missingFields = [];
    ['url', 'publishedAt', 'keyword'].forEach(function(field) {
      if (works.length && works.every(function(work) { return !work[field]; })) missingFields.push('works.' + field);
    });
    ['views'].forEach(function(field) {
      if (works.length && works.every(function(work) { return work.metrics[field] === null; })) missingFields.push('works.metrics.' + field);
    });
    var limitations = [];
    if (!works.length) limitations.push('作品样本不足，无法生成内容分析');
    if (!comments.length) limitations.push('评论样本不足，无法可靠分析用户声音');
    if (history.length < 2) limitations.push('缺少历史数据，无法判断增长趋势');
    if (platforms.size < 2) limitations.push('仅有单一平台样本，无法进行跨平台判断');
    return {
      worksCount: Array.isArray(data.works) ? data.works.filter(function(item) { return item && typeof item === 'object'; }).length : 0,
      uniqueWorksCount: works.length,
      commentsCount: comments.length,
      keywordsCount: keywords.length,
      platformsCount: platforms.size,
      platforms: Array.from(platforms).sort(),
      collectionTime: data.last_update || null,
      historyDays: history.length,
      missingFields: missingFields,
      availableSignals: {
        contentPatterns: works.length > 0,
        userVoice: comments.length > 0,
        trend: history.length >= 2,
        crossPlatform: platforms.size >= 2
      },
      limitations: limitations
    };
  }

  function evidenceCompleteness(evidence) {
    if (!evidence || !evidence.length) return 0;
    var total = evidence.length * 4;
    var present = evidence.reduce(function(sum, item) {
      return sum + (item.title ? 1 : 0) + (item.keyword ? 1 : 0) + (item.platform !== 'unknown' ? 1 : 0) + (item.url ? 1 : 0);
    }, 0);
    return total ? present / total : 0;
  }

  function deriveEvidenceStrength(evidence) {
    evidence = Array.isArray(evidence) ? evidence : [];
    var sources = new Set(evidence.map(function(item) { return item.platform; }).filter(function(p) { return p && p !== 'unknown'; })).size;
    var completeness = evidenceCompleteness(evidence);
    var level = evidence.length >= 20 && sources >= 2 && completeness >= 0.75 ? 'HIGH'
      : evidence.length >= 5 && completeness >= 0.5 ? 'MEDIUM' : 'LOW';
    return { level: level, sampleSize: evidence.length, sourceCount: sources, completeness: Math.round(completeness * 100) / 100 };
  }

  function createInsight(input, store) {
    input = input || {};
    if (INSIGHT_TYPES.indexOf(input.type) < 0 || SOURCE_TYPES.indexOf(input.sourceType) < 0) return null;
    var evidenceIds = Array.isArray(input.evidenceIds) ? input.evidenceIds.filter(function(id) { return !!store.getEvidence(id); }) : [];
    if (!evidenceIds.length) return null;
    var evidence = store.getEvidenceByIds(evidenceIds);
    var id = input.id || ['insight', input.type, stableHash([input.title, evidenceIds.join(',')].join('|'))].join(':');
    var insight = {
      id: id,
      type: input.type,
      title: text(input.title),
      description: text(input.description),
      sourceType: input.sourceType,
      evidenceStrength: deriveEvidenceStrength(evidence),
      metrics: input.metrics && typeof input.metrics === 'object' ? input.metrics : {},
      evidenceIds: evidenceIds,
      provenance: createProvenance(input.provenance),
      createdAt: input.createdAt || new Date().toISOString()
    };
    store.linkInsight(id, evidenceIds);
    return insight;
  }

  function buildContentPatternInsights(data, store) {
    var works = store.getEvidenceByType('work');
    var groups = new Map();
    works.forEach(function(work) {
      if (!work.keyword) return;
      if (!groups.has(work.keyword)) groups.set(work.keyword, []);
      groups.get(work.keyword).push(work.id);
    });
    return Array.from(groups.entries()).sort(function(a, b) { return b[1].length - a[1].length; }).slice(0, 5).map(function(entry) {
      var keyword = entry[0];
      var ids = entry[1];
      return createInsight({
        type: 'content_pattern',
        title: '“' + keyword + '”相关内容样本集中',
        description: '采集作品中有 ' + ids.length + ' 条由关键词“' + keyword + '”命中，可查看原始作品验证内容表现。',
        sourceType: 'DERIVED',
        metrics: { keyword: keyword, worksCount: ids.length },
        evidenceIds: ids,
        provenance: {
          sourceType: 'DERIVED',
          sourceFields: ['works._keyword', 'works.title', 'works.likeCount'],
          formula: 'group works by exact collection keyword; rank by matched work count',
          sampleSize: ids.length,
          generatedBy: 'v8.2-content-pattern',
          limitations: ['关键词来自采集任务，不等同于自然语言主题聚类']
        }
      }, store);
    }).filter(Boolean);
  }

  function engagementValue(work) {
    var metrics = work.metrics || {};
    return ['likes', 'comments', 'favorites', 'shares'].reduce(function(total, key) {
      return total + (metrics[key] === null ? 0 : metrics[key]);
    }, 0);
  }

  function buildEngagementPatternInsights(data, store) {
    var works = store.getEvidenceByType('work');
    var patterns = [
      { key:'避坑', label:'避坑提醒', test:/避坑|踩坑|别再|不要|千万别/ },
      { key:'教程', label:'教程讲解', test:/教程|教学|入门|怎么|方法|步骤/ },
      { key:'清单', label:'数字清单', test:/\d+个|\d+种|清单|合集|盘点/ },
      { key:'测评', label:'测评对比', test:/测评|对比|横评|哪个好|值不值/ }
    ];
    return patterns.map(function(pattern) {
      var matched = works.filter(function(work) { return pattern.test.test(work.title || ''); });
      if (matched.length < 3) return null;
      var total = matched.reduce(function(sum, work) { return sum + engagementValue(work); }, 0);
      var average = Math.round(total / matched.length);
      return createInsight({
        type: 'content_pattern',
        title: pattern.label + '内容模式',
        description: matched.length + ' 条标题包含相关表达，样本平均互动 ' + average.toLocaleString() + '。',
        sourceType: 'DERIVED',
        metrics: { pattern: pattern.key, worksCount: matched.length, averageEngagement: average },
        evidenceIds: matched.map(function(work) { return work.id; }),
        provenance: {
          sourceType: 'DERIVED',
          sourceFields: ['works.title', 'works.likeCount', 'works.commentCount', 'works.collectCount', 'works.shareCount'],
          formula: 'match title expressions; average likes + comments + favorites + shares',
          sampleSize: matched.length,
          generatedBy: 'v8.2-engagement-pattern',
          limitations: ['互动值为已有互动字段之和，不代表播放量或转化率', '标题模式使用明确词组匹配，不是语义分类模型']
        }
      }, store);
    }).filter(Boolean).sort(function(a, b) { return b.metrics.averageEngagement - a.metrics.averageEngagement; });
  }

  function buildUserVoiceInsights(data, store) {
    var comments = store.getEvidenceByType('comment');
    var groups = new Map();
    comments.forEach(function(comment) {
      if (!comment.keyword) return;
      if (!groups.has(comment.keyword)) groups.set(comment.keyword, []);
      groups.get(comment.keyword).push(comment.id);
    });
    return Array.from(groups.entries()).filter(function(entry) { return entry[1].length >= 3; }).sort(function(a, b) {
      return b[1].length - a[1].length;
    }).slice(0, 5).map(function(entry) {
      return createInsight({
        type: 'need',
        title: '评论集中提到“' + entry[0] + '”',
        description: entry[1].length + ' 条真实评论带有该采集关键词，可查看原文确认具体表达。',
        sourceType: 'DERIVED',
        metrics: { keyword: entry[0], commentsCount: entry[1].length },
        evidenceIds: entry[1],
        provenance: {
          sourceType: 'DERIVED', sourceFields: ['comments.text', 'comments.keyword'],
          formula: 'group comments by explicit collection keyword', sampleSize: entry[1].length,
          generatedBy: 'v8.2-user-voice', limitations: ['关键词分组不等同于情绪、痛点或购买意图判断']
        }
      }, store);
    }).filter(Boolean);
  }

  function buildAnalysis(data) {
    var store = adaptV81Evidence(data);
    var dataQuality = deriveDataQuality(data, store);
    var hotInsights = dataQuality.availableSignals.contentPatterns ? buildContentPatternInsights(data, store) : [];
    var contentPatternInsights = dataQuality.availableSignals.contentPatterns ? buildEngagementPatternInsights(data, store) : [];
    var userVoiceInsights = dataQuality.availableSignals.userVoice ? buildUserVoiceInsights(data, store) : [];
    var insights = hotInsights.concat(contentPatternInsights, userVoiceInsights);
    var unsupportedInsights = [];
    if (!dataQuality.availableSignals.userVoice) unsupportedInsights.push({ type: 'user_voice', status: 'DATA_INSUFFICIENT', reason: '评论样本不足' });
    else if (!userVoiceInsights.length) unsupportedInsights.push({ type: 'user_voice', status: 'DATA_INSUFFICIENT', reason: '评论缺少可验证的重复主题' });
    if (!dataQuality.availableSignals.trend) unsupportedInsights.push({ type: 'trend', status: 'DATA_INSUFFICIENT', reason: '历史数据不足' });
    return {
      evidenceStore: store,
      insights: insights,
      hotInsights: hotInsights,
      contentPatternInsights: contentPatternInsights,
      userVoiceInsights: userVoiceInsights,
      unsupportedInsights: unsupportedInsights,
      dataQuality: dataQuality
    };
  }

  var api = {
    stableHash: stableHash,
    stableId: stableId,
    createProvenance: createProvenance,
    createEvidence: createEvidence,
    createInsight: createInsight,
    EvidenceStore: EvidenceStore,
    adaptV81Evidence: adaptV81Evidence,
    deriveDataQuality: deriveDataQuality,
    deriveEvidenceStrength: deriveEvidenceStrength,
    buildContentPatternInsights: buildContentPatternInsights,
    buildEngagementPatternInsights: buildEngagementPatternInsights,
    buildUserVoiceInsights: buildUserVoiceInsights,
    buildAnalysis: buildAnalysis
  };
  window.V82Evidence = api;
})();
/* ===== core/textAIProvider.js ===== */
(function() {
  'use strict';

  var CONFIG_KEY='user_text_ai_config';
  var TIMEOUT_MS=40000;
  var PRESETS={
    'xiaomi-mimo':{
      id:'xiaomi-mimo',name:'Xiaomi MiMo',type:'openai-compatible',mode:'direct',
      baseUrl:'https://api.xiaomimimo.com/v1',modelPlaceholder:'mimo-v2.5-pro',
      homepage:'https://platform.xiaomimimo.com/',apiKeyGuide:'在 Xiaomi MiMo 开放平台创建 API Key。',modelGuide:'填写控制台中可用的模型 ID。'
    },
    'openai-compatible':{
      id:'openai-compatible',name:'OpenAI-Compatible',type:'openai-compatible',mode:'direct',
      baseUrl:'',modelPlaceholder:'填写服务商提供的 model id',homepage:'',
      apiKeyGuide:'在你选择的模型服务商控制台创建 API Key。',modelGuide:'适用于支持 OpenAI Chat Completions 格式的模型服务。'
    },
    custom:{
      id:'custom',name:'Custom',type:'openai-compatible',mode:'direct',
      baseUrl:'',modelPlaceholder:'填写自定义 model id',homepage:'',
      apiKeyGuide:'在服务商控制台创建 API Key。',modelGuide:'首期仅支持 OpenAI Chat Completions 格式。'
    }
  };

  function clone(value){return value?JSON.parse(JSON.stringify(value)):value;}
  function clean(value){return String(value==null?'':value).trim();}
  function configValue(value){
    value=value||{};
    return {
      providerId:clean(value.providerId||value.provider||'openai-compatible'),
      providerType:'openai-compatible',baseUrl:clean(value.baseUrl).replace(/\/+$/,''),
      apiKey:clean(value.apiKey),model:clean(value.model),createdAt:value.createdAt||'',updatedAt:value.updatedAt||'',
      connection:value.connection&&typeof value.connection==='object'?value.connection:{status:'untested'}
    };
  }
  function getCurrentConfig(){var value=StorageAdapter.getJSON(CONFIG_KEY,null);return value?configValue(value):null;}
  function validate(value){
    var config=configValue(value),missing=[];
    if(!PRESETS[config.providerId])missing.push('Provider');
    if(!config.baseUrl)missing.push('API Base URL');
    if(!config.apiKey)missing.push('API Key');
    if(!config.model)missing.push('Model');
    return {valid:missing.length===0,missing:missing,config:config};
  }
  function saveConfig(value){
    var previous=getCurrentConfig(),checked=validate(value);if(!checked.valid)return checked;
    var now=new Date().toISOString(),config=checked.config;
    config.createdAt=previous&&previous.createdAt||now;config.updatedAt=now;
    if(!config.connection||config.connection.signature!==signature(config))config.connection={status:'untested'};
    StorageAdapter.setJSON(CONFIG_KEY,config);return {valid:true,config:clone(config)};
  }
  function clearConfig(){StorageAdapter.remove(CONFIG_KEY);return true;}
  function maskKey(key){key=clean(key);if(!key)return '未保存';return '****'+key.slice(-4);}
  function signature(config){config=configValue(config);return [config.providerId,config.baseUrl,config.model,config.apiKey.slice(-8)].join('|');}
  function setConnection(result){var config=getCurrentConfig();if(!config)return null;config.connection=Object.assign({status:'untested'},result||{}, {signature:signature(config),testedAt:new Date().toISOString()});config.updatedAt=new Date().toISOString();StorageAdapter.setJSON(CONFIG_KEY,config);return clone(config);}

  window.PROVIDER_PRESETS=PRESETS;
  window.TextAIProvider={
    configKey:CONFIG_KEY,getPresets:function(){return clone(PRESETS);},getPreset:function(id){return clone(PRESETS[id]||null);},
    getCurrentConfig:getCurrentConfig,saveConfig:saveConfig,clearConfig:clearConfig,validate:validate,maskKey:maskKey,setConnection:setConnection,
    isConfigured:function(){return validate(getCurrentConfig()).valid;},_test:{configValue:configValue,signature:signature}
  };

  function providerError(code,message,status){var error=new Error(message);error.code=code;if(status)error.status=status;return error;}
  var activeControllers=[];
  function endpoint(baseUrl){baseUrl=clean(baseUrl).replace(/\/+$/,'');return /\/chat\/completions$/i.test(baseUrl)?baseUrl:baseUrl+'/chat/completions';}
  function safeJson(text){text=clean(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{return JSON.parse(text);}catch(e){var start=text.indexOf('{'),end=text.lastIndexOf('}');if(start>=0&&end>start)return JSON.parse(text.slice(start,end+1));throw providerError('INVALID_RESPONSE','模型返回格式不正确。');}}
  function normalizeVariants(value){if(value&&Array.isArray(value.variants))value.variants=value.variants.map(function(item){item=item||{};if(Array.isArray(item.tags))item.tags=item.tags.join(' ');if(item.estimatedDuration!=null)item.estimatedDuration=String(item.estimatedDuration);return item;});return value;}
  function durationRange(duration){duration=Number(duration||60);return duration<=30?[70,110]:(duration<=60?[120,190]:[190,290]);}
  function instructions(action,payload){
    var common='你是短视频内容策略助手。只能根据输入中的真实字段工作，不得虚构原视频画面、逐字稿或事实。不得复刻原文、逐句同义替换或保留独特原句。只返回严格 JSON，不要 Markdown。';
    if(action==='analyzeContent')return common+' 分析主题、结构、表达策略和内容角度。返回 topic(string), hook(string), angle(string), keyPoints(string[]), structure(string), interactionReasons(string[]), reusablePattern(string), limitations(string)。'+(payload.contentAvailable?'正文存在，可以结合正文分析。':'没有完整正文，limitations 必须包含“当前仅基于标题和互动数据分析。”');
    var rewrite=payload.action&&payload.action!=='generate',range=durationRange(payload.duration),rules={'new-opening':'只替换开场钩子，其余核心观点保持一致。',colloquial:'改成更自然的口语表达，事实和核心观点保持一致。',professional:'改成更专业、克制的表达，事实和核心观点保持一致。',shorter:'明显压缩当前脚本，body 字数不得超过当前 body 的 70%。','different-angle':'换一个不同的原创切入角度，不复用当前开场和论述顺序。'};
    return common+(rewrite?'只改写当前这一版，返回 {"variants":[一个版本]}。'+(rules[payload.action]||''):'生成三个真正不同的原创版本，依次为知识解释型、痛点切入型、观点表达型，返回 {"variants":[三个版本]}。')+' 每个版本包含 angle,title,coverTitle,hook,body,cta,tags,estimatedDuration，均为非空字符串。'+(payload.action==='shorter'?'':('body 去除空白后目标为 '+range[0]+'-'+range[1]+' 个中文字符。'))+' 平台 '+payload.platform+'、语气 '+payload.tone+'。';
  }
  function mapFailure(status){
    if(status===401||status===403)return providerError('AUTH_FAILED','认证失败，请检查 API Key。',status);
    if(status===404)return providerError('MODEL_NOT_FOUND','模型或接口地址不存在，请检查 Model 和 Base URL。',status);
    if(status===429)return providerError('RATE_LIMITED','请求过于频繁或额度不足（429）。',status);
    return providerError('PROVIDER_REQUEST_FAILED','模型服务请求失败（HTTP '+status+'）。',status);
  }
  function chat(config,messages,options){
    var checked=TextAIProvider.validate(config);if(!checked.valid)return Promise.reject(providerError('PROVIDER_NOT_CONFIGURED','请先在 设置 → 文字模型 API 中配置模型服务。'));
    config=checked.config;var controller=typeof AbortController==='function'?new AbortController():null,start=Date.now(),timer=setTimeout(function(){if(controller)controller.abort();},(options&&options.timeoutMs)||TIMEOUT_MS);if(controller)activeControllers.push(controller);
    return fetch(endpoint(config.baseUrl),{method:'POST',signal:controller?controller.signal:undefined,headers:{'Authorization':'Bearer '+config.apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:config.model,messages:messages,temperature:options&&options.temperature!=null?options.temperature:0.3,max_tokens:options&&options.maxTokens||undefined})})
      .then(function(response){if(!response.ok)throw mapFailure(response.status);return response.json();})
      .then(function(body){var content=body&&body.choices&&body.choices[0]&&body.choices[0].message&&body.choices[0].message.content;if(typeof content!=='string')throw providerError('INVALID_RESPONSE','模型返回内容为空。');return {content:content,latency:Date.now()-start,provider:config.providerId,model:config.model};})
      .catch(function(error){if(error&&error.name==='AbortError')throw providerError('TIMEOUT','连接超时，请检查网络或 Base URL。');if(error&&error.code)throw error;throw providerError('NETWORK_ERROR','网络失败或 Provider 不允许浏览器直连。该 Provider 可能需要代理模式。');})
      .finally(function(){clearTimeout(timer);if(controller){var index=activeControllers.indexOf(controller);if(index>=0)activeControllers.splice(index,1);}});
  }
  function invoke(action,payload){var config=TextAIProvider.getCurrentConfig();return chat(config,[{role:'system',content:instructions(action,payload)},{role:'user',content:JSON.stringify(payload)}],{temperature:0.5}).then(function(result){return {data:normalizeVariants(safeJson(result.content)),meta:result};});}
  function testConnection(config){return chat(config,[{role:'user',content:'Reply with OK.'}],{temperature:0,maxTokens:8,timeoutMs:15000}).then(function(result){return {ok:true,provider:result.provider,model:result.model,latency:result.latency};});}
  window.TextAIProviderAdapter={testConnection:testConnection,analyzeContent:function(config,work){return invoke('analyzeContent',work);},generateScript:function(config,options){return invoke('generateScript',options);},rewriteScript:function(config,options){options=Object.assign({},options,{action:options.action||'rewrite'});return invoke('generateScript',options);},request:invoke,abortAll:function(){activeControllers.splice(0).forEach(function(controller){try{controller.abort();}catch(e){}});},_test:{endpoint:endpoint,safeJson:safeJson,instructions:instructions,mapFailure:mapFailure}};
})();
/* ===== core/contentAI.js ===== */
(function() {
  'use strict';
  var ANALYSIS_VERSION='v8.3-real-v1', PROMPT_VERSION='v8.3-script-v1', PROXY_KEY='content_ai_proxy_url';
  var DEFAULT_PROXY_URL='https://ai-hotspot-content-ai.bualla450834969.workers.dev/api/ai';
  var requestVersion=0, activeController=null;
  function industryId(){var c=window.IndustryStore&&IndustryStore.getCurrent?IndustryStore.getCurrent():null;return c&&c.id?c.id:(window.CURRENT_INDUSTRY||'ai');}
  function cleanWork(work){work=work||{};return {workId:work.workId||work.sourceId||'',title:work.title||'',content:work.transcript||work.caption||'',platform:work.platform||'',keyword:work._keyword||'',metrics:{likes:Number(work.likes||work.likeCount||0),comments:Number(work.comments||work.commentCount||0),favorites:Number(work.collects||work.collectCount||0),shares:Number(work.shares||work.shareCount||0)}};}
  function workIdentity(work){var w=cleanWork(work),seed=w.workId||[w.platform,w.title,w.keyword].join('|'),hash=2166136261;for(var i=0;i<seed.length;i++){hash^=seed.charCodeAt(i);hash=Math.imul(hash,16777619);}return w.workId||('work_'+(hash>>>0).toString(36));}
  function analysisKey(work,id){return ['content_ai_analysis',encodeURIComponent(id||industryId()),encodeURIComponent(workIdentity(work)),ANALYSIS_VERSION].join('__');}
  function scriptKey(o,id){return ['content_ai_script',encodeURIComponent(id||industryId()),encodeURIComponent(workIdentity(o.work)),Number(o.duration||60),encodeURIComponent(o.platform||'douyin'),encodeURIComponent(o.tone||'natural'),PROMPT_VERSION].join('__');}
  function makeError(code,message){var e=new Error(message);e.code=code;return e;}
  function proxyUrl(){return String(StorageAdapter.getRaw(PROXY_KEY,DEFAULT_PROXY_URL)||DEFAULT_PROXY_URL).trim();}
  function current(version,id){return version===requestVersion&&id===industryId();}
  function proxyRequest(action,payload,id){
    var url=proxyUrl();if(!url)return Promise.reject(makeError('PROVIDER_NOT_CONFIGURED','尚未配置安全 AI 代理。'));
    requestVersion+=1;var version=requestVersion;if(activeController)activeController.abort();activeController=typeof AbortController==='function'?new AbortController():null;
    var timeout=setTimeout(function(){if(activeController)activeController.abort();},90000);
    return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},signal:activeController?activeController.signal:undefined,body:JSON.stringify({action:action,payload:payload,client:{feature:'hot-content-to-script',version:ANALYSIS_VERSION}})})
      .then(function(response){if(!response.ok)throw makeError('PROVIDER_REQUEST_FAILED','AI 分析暂时失败，请重试。');return response.json();})
      .then(function(body){if(!current(version,id))throw makeError('STALE_RESPONSE','请求已失效。');if(!body||body.ok===false)throw makeError('PROVIDER_INVALID_RESPONSE','AI 分析暂时失败，请重试。');return body.data||body;})
      .catch(function(reason){if(reason&&reason.name==='AbortError')throw makeError(current(version,id)?'PROVIDER_TIMEOUT':'STALE_RESPONSE','AI 分析暂时失败，请重试。');throw reason;})
      .finally(function(){clearTimeout(timeout);});
  }
  function providerRequest(action,payload,id){
    if(!window.TextAIProvider)return proxyRequest(action,payload,id);
    if(!TextAIProvider.isConfigured())return Promise.reject(makeError('PROVIDER_NOT_CONFIGURED','请先在 设置 → 文字模型 API 中配置模型服务。'));
    requestVersion+=1;var version=requestVersion;
    return TextAIProviderAdapter.request(action,payload).then(function(result){if(!current(version,id))throw makeError('STALE_RESPONSE','请求已失效。');return result&&result.data!==undefined?result.data:result;});
  }
  function text(value){return typeof value==='string'&&!!value.trim();}
  function validAnalysis(v){return v&&['topic','hook','angle','structure','reusablePattern','limitations'].every(function(k){return text(v[k]);})&&Array.isArray(v.keyPoints)&&v.keyPoints.length>0&&v.keyPoints.every(text)&&Array.isArray(v.interactionReasons)&&v.interactionReasons.length>0&&v.interactionReasons.every(text);}
  function variantsFrom(v){if(v&&Array.isArray(v.variants))return v.variants;if(v&&v.variant&&typeof v.variant==='object')return [v.variant];return v;}
  function validVariants(v,count){var a=variantsFrom(v),keys=['angle','title','coverTitle','hook','body','cta','tags','estimatedDuration'];return Array.isArray(a)&&a.length===count&&a.every(function(item){return item&&keys.every(function(k){return text(item[k]);});});}
  function translationKey(item,id){return ['github_description_zh',encodeURIComponent(id||industryId()),encodeURIComponent(String(item.id||item.name||''))].join('__');}
  function translateDescriptions(items){var id=industryId(),list=(items||[]).slice(0,20),pending=[];list.forEach(function(item){item.descriptionOriginal=item.description||'';if(/[\u3400-\u9fff]/.test(item.description||'')){item.descriptionZh=item.description;return;}var cached=StorageAdapter.getJSON(translationKey(item,id),null);if(cached&&cached.source===item.description&&text(cached.text)){item.descriptionZh=cached.text;return;}if(text(item.description))pending.push({id:String(item.id),text:item.description});});if(!pending.length)return Promise.resolve(list);return proxyRequest('translateDescriptions',{industryId:id,items:pending},id).then(function(result){var rows=result&&result.translations;if(!Array.isArray(rows))throw makeError('PROVIDER_INVALID_RESPONSE','项目简介翻译暂时失败。');var map={};rows.forEach(function(row){if(row&&text(row.id)&&text(row.text))map[String(row.id)]=row.text;});list.forEach(function(item){var translated=map[String(item.id)];if(translated){item.descriptionZh=translated;StorageAdapter.setJSON(translationKey(item,id),{source:item.description,text:translated});}});return list;});}
  var adapter={
    analysisVersion:ANALYSIS_VERSION,promptVersion:PROMPT_VERSION,getProxyUrl:proxyUrl,
    setProxyUrl:function(url){return StorageAdapter.setRaw(PROXY_KEY,String(url||'').trim());},
    getCachedAnalysis:function(work){return StorageAdapter.getJSON(analysisKey(work),null);},
    getCachedScripts:function(options){return StorageAdapter.getJSON(scriptKey(options),null);},
    abortAll:function(){requestVersion+=1;if(activeController)activeController.abort();activeController=null;if(window.TextAIProviderAdapter)TextAIProviderAdapter.abortAll();},
    analyzeContent:function(work){var id=industryId(),cached=StorageAdapter.getJSON(analysisKey(work,id),null);if(validAnalysis(cached))return Promise.resolve({analysis:cached,cached:true});var clean=cleanWork(work);return providerRequest('analyzeContent',{industryId:id,work:clean,analysisVersion:ANALYSIS_VERSION,contentAvailable:!!clean.content},id).then(function(result){var analysis=result.analysis||result;if(!validAnalysis(analysis))throw makeError('PROVIDER_INVALID_RESPONSE','AI 分析暂时失败，请重试。');StorageAdapter.setJSON(analysisKey(work,id),analysis);return {analysis:analysis,cached:false};});},
    generateScript:function(options){options=options||{};var id=industryId(),action=options.action||'generate',key=scriptKey(options,id),cached=action==='generate'&&!options.userInput?StorageAdapter.getJSON(key,null):null;if(validVariants(cached,3))return Promise.resolve({variants:cached,cached:true});var payload={industryId:id,work:cleanWork(options.work),analysis:options.analysis||null,duration:Number(options.duration||60),platform:options.platform||'douyin',tone:options.tone||'natural',userInput:String(options.userInput||''),action:action,currentScript:options.currentScript||null,promptVersion:PROMPT_VERSION};return providerRequest('generateScript',payload,id).then(function(result){var count=action==='generate'?3:1;if(!validVariants(result,count))throw makeError('PROVIDER_INVALID_RESPONSE','AI 分析暂时失败，请重试。');var variants=variantsFrom(result);if(action==='generate'&&!options.userInput)StorageAdapter.setJSON(key,variants);return {variants:variants,cached:false};});},
    translateDescriptions:translateDescriptions,
    _test:{cleanWork:cleanWork,workIdentity:workIdentity,analysisKey:analysisKey,scriptKey:scriptKey,translationKey:translationKey,validAnalysis:validAnalysis,validVariants:validVariants}
  };
  window.ContentAIAdapter=adapter;
})();
/* ===== core/radar.js ===== */
(function(){
  'use strict';
  var PROFILE_PREFIX='radar_profile__',SOCIAL_SNAPSHOT_PREFIX='radar_social_v3__',GITHUB_REPO_PREFIX='radar_github_repo__';
  var DAY_MS=86400000,WEEK_MS=7*DAY_MS,WINDOW_MS=DAY_MS,KEEP_MS=30*DAY_MS;
  function context(){return window.IndustryStore&&IndustryStore.getCurrent?IndustryStore.getCurrent():{id:window.CURRENT_INDUSTRY||'unknown',name:'当前行业'};}
  function key(prefix,id){return prefix+encodeURIComponent(id);}
  function day(time){return new Date(time==null?Date.now():time).toISOString().slice(0,10);}
  function terms(ctx){var cfg=window.DOMAIN_CONFIG||{};return [ctx.name,cfg.name,cfg.display_name].concat(cfg.collect_keywords||[],cfg.keywords||[]).filter(Boolean);}
  function infer(ctx){var list=terms(ctx),source=list.join(' '),developer=/AI|人工智能|大模型|LLM|Agent|编程|开发|代码|软件|开源|机器学习|MCP/i.test(source);return {industryId:ctx.id,industryName:ctx.name||source||'当前行业',type:developer?'developer':'general',sources:{social:{enabled:true,keywords:list.slice(0,12)},github:{enabled:developer,queries:developer?['AI agent','agent framework','AI skill','MCP','LLM agent','developer AI tools']:[]}},updatedAt:new Date().toISOString()};}
  var service={get:function(id){return StorageAdapter.getJSON(key(PROFILE_PREFIX,id),null);},getCurrent:function(){var ctx=context(),profile=this.get(ctx.id);if(!profile||!profile.sources){profile=infer(ctx);this.save(profile);}return profile;},save:function(profile){StorageAdapter.setJSON(key(PROFILE_PREFIX,profile.industryId),profile);return profile;},ensure:function(record){if(!record||!record.id)return null;return this.get(record.id)||this.save(infer(record));}};

  function socialSnapshotKey(id){return key(SOCIAL_SNAPSHOT_PREFIX,id);}
  function socialSnapshots(id){return (StorageAdapter.getJSON(socialSnapshotKey(id),[])||[]).filter(function(item){return item&&item.schemaVersion===3&&Array.isArray(item.items);});}
  function saveSocialSnapshot(id,items,nowMs){var now=nowMs==null?Date.now():nowMs,list=socialSnapshots(id),entry={schemaVersion:3,timestamp:new Date(now).toISOString(),date:day(now),source:'social',items:items},index=list.findIndex(function(item){return item.date===entry.date;});if(index>=0)list[index]=entry;else list.push(entry);list=list.filter(function(item){return now-new Date(item.timestamp||item.date).getTime()<=KEEP_MS;}).sort(function(a,b){return new Date(a.timestamp)-new Date(b.timestamp);});StorageAdapter.setJSON(socialSnapshotKey(id),list);return list;}
  function previousSocial(list){return list.length>1?list[list.length-2]:null;}

  function repoSnapshotKey(industryId,repoId){return GITHUB_REPO_PREFIX+encodeURIComponent(industryId)+'__'+encodeURIComponent(String(repoId));}
  function getRepoSnapshots(industryId,repoId){return StorageAdapter.getJSON(repoSnapshotKey(industryId,repoId),[])||[];}
  function saveRepoSnapshot(industryId,repo,nowMs){var now=nowMs==null?Date.now():nowMs,list=getRepoSnapshots(industryId,repo.id),entry={repoId:String(repo.id),fullName:repo.name||repo.full_name||'',stars:Number(repo.stars!=null?repo.stars:repo.stargazers_count)||0,forks:Number(repo.forks!=null?repo.forks:repo.forks_count)||0,timestamp:new Date(now).toISOString()},today=day(now),index=list.findIndex(function(item){return day(new Date(item.timestamp).getTime())===today;});if(index>=0)list[index]=entry;else list.push(entry);list=list.filter(function(item){return now-new Date(item.timestamp).getTime()<=KEEP_MS;}).sort(function(a,b){return new Date(a.timestamp)-new Date(b.timestamp);});StorageAdapter.setJSON(repoSnapshotKey(industryId,repo.id),list);return list;}
  function closestWeekSnapshot(list,nowMs){var target=nowMs-WEEK_MS,best=null,distance=Infinity;list.forEach(function(item){var delta=Math.abs(new Date(item.timestamp).getTime()-target);if(delta<=WINDOW_MS&&delta<distance){best=item;distance=delta;}});return best;}
  function githubMetrics(industryId,repo,nowMs){var now=nowMs==null?Date.now():nowMs,created=new Date(repo.createdAt||repo.created_at).getTime(),isNew=isFinite(created)&&now-created<WEEK_MS,currentStars=Number(repo.stars!=null?repo.stars:repo.stargazers_count)||0,old=isNew?null:closestWeekSnapshot(getRepoSnapshots(industryId,repo.id),now),result={historyStatus:'insufficient',isNew:isNew,ageDays:isFinite(created)?Math.max(0,Math.floor((now-created)/DAY_MS)):null,starsGained7d:null,growthRate7d:null};if(!isNew&&old){result.historyStatus='sufficient';result.starsGained7d=currentStars-Number(old.stars||0);result.growthRate7d=old.stars>0?result.starsGained7d/old.stars:null;}return result;}
  function rankWeekly(items){return items.filter(function(repo){return !repo.isNew&&repo.historyStatus==='sufficient';}).sort(function(a,b){return (b.starsGained7d-a.starsGained7d)||((b.growthRate7d||0)-(a.growthRate7d||0));});}
  function normalizeRepo(repo){return {id:String(repo.id),name:repo.full_name,owner:repo.owner&&repo.owner.login||'',url:repo.html_url,description:repo.description||'',topics:repo.topics||[],language:repo.language||'',stars:repo.stargazers_count||0,forks:repo.forks_count||0,updatedAt:repo.updated_at,createdAt:repo.created_at};}
  function repoRelevance(repo){var text=[repo.name,repo.description].concat(repo.topics||[]).join(' ').toLowerCase(),score=0;if(/\bskills?\b|agent-skills?/.test(text))score+=12;if(/\bmcp\b|model context protocol/.test(text))score+=10;if(/\bplugins?\b|extensions?/.test(text))score+=6;if(/\bagents?\b/.test(text))score+=4;if(/\btools?\b|toolkit/.test(text))score+=3;return score;}
  function githubSearch(query,since){return fetch('https://api.github.com/search/repositories?q='+encodeURIComponent(query+' stars:>10 pushed:>='+since)+'&sort=stars&order=desc&per_page=20',{headers:{Accept:'application/vnd.github+json'}}).then(function(response){if(!response.ok)throw new Error(response.status===403?'GitHub 公共接口额度暂时用尽。':'GitHub 数据加载失败。');return response.json();}).then(function(body){return body.items||[];});}
  var githubLoads={};
  var GitHubRadarAdapter={load:function(profile){var loadKey=profile.industryId+'__'+day();if(githubLoads[loadKey])return githubLoads[loadKey];var now=Date.now(),activeSince=day(now-WEEK_MS),queries=profile.sources.github.queries||[];githubLoads[loadKey]=Promise.all(queries.map(function(query){return githubSearch(query,activeSince).then(function(value){return {ok:true,value:value};},function(){return {ok:false,value:[]};});})).then(function(results){var groups=results.filter(function(result){return result.ok;}).map(function(result){return result.value;});if(!groups.length)throw new Error('GitHub 公共接口额度暂时用尽。');var seen={},repos=[];groups.forEach(function(group){group.forEach(function(repo){if(!seen[repo.id]){seen[repo.id]=true;repos.push(repo);}});});var items=repos.map(normalizeRepo).map(function(repo){var metrics=githubMetrics(profile.industryId,repo,now);saveRepoSnapshot(profile.industryId,repo,now);Object.keys(metrics).forEach(function(name){repo[name]=metrics[name];});repo.relevance=repoRelevance(repo);return repo;});var weekly=rankWeekly(items).slice(0,20);var emerging=items.filter(function(repo){return repo.isNew;}).sort(function(a,b){return (b.relevance-a.relevance)||(b.stars-a.stars);}).slice(0,20);var accumulating=items.filter(function(repo){return !repo.isNew&&repo.historyStatus==='insufficient'&&repo.relevance>0;}).sort(function(a,b){return (b.relevance-a.relevance)||(b.stars-a.stars);}).slice(0,20),visible=weekly.concat(emerging,accumulating),translation=window.ContentAIAdapter&&ContentAIAdapter.translateDescriptions?ContentAIAdapter.translateDescriptions(visible):Promise.resolve(visible);return translation.catch(function(){return visible;}).then(function(translated){var translatedMap={};translated.forEach(function(repo){translatedMap[repo.id]=repo;});[weekly,emerging,accumulating].forEach(function(group){group.forEach(function(repo,index){group[index]=translatedMap[repo.id]||repo;});});return {kind:'github',title:'GitHub Radar',items:weekly.concat(emerging,accumulating),weekly:weekly,emerging:emerging,accumulating:accumulating,note:'来源：GitHub 官方公开 API；周增长只使用最接近七天前（允许 ±24 小时）的真实快照差值。'};});}).catch(function(error){delete githubLoads[loadKey];throw error;});return githubLoads[loadKey];}};

  function workIdentity(work,index){var stable=work&&(work.workId||work.sourceId||work.noteId);if(stable)return String(stable);var fallback=[work&&work.platform,work&&(work.workUrl||work.url),work&&work.title,work&&(work.accountName||work.author),work&&work.publishTime].filter(Boolean).join('|');return fallback||('row:'+index);}
  function metric(work,name,aliases){var value=work&&work[name];if(value==null){for(var i=0;i<aliases.length;i++){if(work&&work[aliases[i]]!=null){value=work[aliases[i]];break;}}}value=Number(value);return isFinite(value)&&value>0?value:0;}
  function sourceKeywords(work){var values=Array.isArray(work&&work.sourceKeywords)?work.sourceKeywords.slice():[];[work&&work.sourceKeyword,work&&work._collectedKeyword,work&&work.queryKeyword,work&&work._keyword,work&&work.keyword].forEach(function(value){value=String(value||'').trim();if(value&&values.indexOf(value)<0)values.push(value);});return values;}
  function mergeWorks(works){var map={},order=[];(works||[]).forEach(function(work,index){var id=workIdentity(work,index),keywords=sourceKeywords(work);if(!map[id]){map[id]=Object.assign({},work,{sourceKeywords:keywords,keywordAttributionStatus:keywords.length?'attributed':'unknown'});order.push(id);return;}var current=map[id];keywords.forEach(function(keyword){if(current.sourceKeywords.indexOf(keyword)<0)current.sourceKeywords.push(keyword);});current.keywordAttributionStatus=current.sourceKeywords.length?'attributed':'unknown';});return order.map(function(id){return map[id];});}
  function attributionSuspect(items,groups){var capped=items.filter(function(item){return item.sampleWorks>=40;});if(capped.length<10)return false;for(var i=0;i<capped.length;i++){for(var j=i+1;j<capped.length;j++){var left=groups[capped[i].id]||[],right=groups[capped[j].id]||[],rightIds={};right.forEach(function(work,index){rightIds[workIdentity(work,index)]=true;});var overlap=left.filter(function(work,index){return rightIds[workIdentity(work,index)];}).length;if(overlap>=Math.min(left.length,right.length)*0.8)return true;}}return false;}
  function aggregateSocial(data){var rawWorks=Array.isArray(data&&data.works)?data.works:[],works=mergeWorks(rawWorks),hotwords=Array.isArray(data&&data.hotwords)?data.hotwords:[],searchTotals={},keywordOrder=[];hotwords.forEach(function(item){var name=String(item&&item.keyword||'').trim();if(!name)return;if(searchTotals[name]==null){searchTotals[name]=0;keywordOrder.push(name);}searchTotals[name]+=metric(item,'total',[]);});var groups={};works.forEach(function(work){work.sourceKeywords.forEach(function(keyword){if(!groups[keyword])groups[keyword]=[];groups[keyword].push(work);});});var contractErrors=[];var items=keywordOrder.map(function(keyword){var sample=groups[keyword]||[],item={id:keyword,keyword:keyword,name:keyword,sampleWorks:sample.length,likes:0,collects:0,comments:0,shares:0,maxLike:0,searchTotal:searchTotals[keyword],trend:'当前样本'};sample.forEach(function(work){var likes=metric(work,'likeCount',['likes','workLikedCount']),collects=metric(work,'collectCount',['collects','favoriteCount']),comments=metric(work,'commentCount',['comments']),shares=metric(work,'shareCount',['shares','repostCount']);item.likes+=likes;item.collects+=collects;item.comments+=comments;item.shares+=shares;if(likes>item.maxLike)item.maxLike=likes;});if(item.sampleWorks>works.length)contractErrors.push({keyword:keyword,sampleWorks:item.sampleWorks,worksLength:works.length});return item;});var attributed=works.filter(function(work){return work.sourceKeywords.length>0;}).length,metrics={totalWorks:works.length,rawWorks:rawWorks.length,attributedWorks:attributed,unattributedWorks:works.length-attributed,keywordCoverage:works.length?attributed/works.length:0,attributionErrors:contractErrors.length,attributionSuspect:attributionSuspect(items,groups)};window.RadarAttributionMetrics=metrics;return {items:items,contractErrors:contractErrors,worksLength:works.length,metrics:metrics};}
  function engagement(item){return Number(item.likes||0)+Number(item.collects||0)*2+Number(item.comments||0)*2+Number(item.shares||0)*3;}
  function applySocialTrend(items,old){if(!old)return items;var oldMap={};old.items.forEach(function(item){oldMap[item.id]=item;});items.forEach(function(item){var before=oldMap[item.id];if(!before){item.trend='数据不足';return;}item.sampleWorksDelta=item.sampleWorks-Number(before.sampleWorks||0);item.likesDelta=item.likes-Number(before.likes||0);item.collectsDelta=item.collects-Number(before.collects||0);item.commentsDelta=item.comments-Number(before.comments||0);item.sharesDelta=item.shares-Number(before.shares||0);var oldEngagement=engagement(before),currentEngagement=engagement(item);item.engagementDelta=currentEngagement-oldEngagement;item.engagementDeltaRate=oldEngagement>0?item.engagementDelta/oldEngagement:null;if(item.engagementDeltaRate==null)item.trend='数据不足';else if(item.engagementDeltaRate>=0.25)item.trend='快速升温';else if(item.engagementDeltaRate>0)item.trend='升温';else if(item.engagementDeltaRate<0)item.trend='降温';else item.trend='稳定';});return items;}
  var SocialRadarAdapter={load:function(profile,data){var aggregate=aggregateSocial(data||{}),items=aggregate.items.sort(function(a,b){return (engagement(b)-engagement(a))||(b.sampleWorks-a.sampleWorks)||(b.searchTotal-a.searchTotal);}).slice(0,20),snapshotItems=items.map(function(item){return {id:item.id,sampleWorks:item.sampleWorks,likes:item.likes,collects:item.collects,comments:item.comments,shares:item.shares,maxLike:item.maxLike,searchTotal:item.searchTotal};}),list=saveSocialSnapshot(profile.industryId,snapshotItems),old=previousSocial(list);applySocialTrend(items,old);if(aggregate.contractErrors.length&&window.console&&console.error)console.error('[DATA_CONTRACT_ERROR]',aggregate.contractErrors);return Promise.resolve({kind:'social',title:'行业本周升温关键词',items:items,contractErrors:aggregate.contractErrors,note:old?'趋势基于当前行业两个最近 Social Radar v3 真实采集快照；样本作品变化与互动变化分开计算。':'当前只有一个 Social Radar v3 真实采集快照，仅显示当前样本；继续采集后生成趋势。'});}};
  SocialRadarAdapter._test={socialSnapshotKey:socialSnapshotKey,socialSnapshots:socialSnapshots,saveSocialSnapshot:saveSocialSnapshot,aggregateSocial:aggregateSocial,engagement:engagement,applySocialTrend:applySocialTrend,workIdentity:workIdentity,sourceKeywords:sourceKeywords,mergeWorks:mergeWorks};
  GitHubRadarAdapter._test={repoSnapshotKey:repoSnapshotKey,getRepoSnapshots:getRepoSnapshots,saveRepoSnapshot:saveRepoSnapshot,closestWeekSnapshot:closestWeekSnapshot,githubMetrics:githubMetrics,rankWeekly:rankWeekly,normalizeRepo:normalizeRepo,repoRelevance:repoRelevance};
  window.RadarProfileService=service;
  window.RadarAdapters={github:GitHubRadarAdapter,social:SocialRadarAdapter};
})();
/* ===== core/renderer.js ===== */
/**
 * 通用渲染器 — 表格、卡片、图表、数字动画、标签
 * 所有业务模块共用，不包含领域逻辑
 */
(function() {
  'use strict';

  const Renderer = {
    /** 数字动画 */
    animateNumber(el, target, duration = 800) {
      if (!el) return;
      const start = 0;
      const startTime = performance.now();
      function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    },

    /** 格式化大数字 */
    formatNum(n) {
      if (n >= 10000) return (n / 10000).toFixed(1) + '万';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
      return n?.toLocaleString() || '0';
    },

    /** 趋势标签 */
    trendClass(trend) {
      if (!trend) return '';
      if (trend > 0) return 'trend-up';
      if (trend < 0) return 'trend-down';
      return 'trend-flat';
    },

    /** 生成标签chip */
    chip(text, color = 'default') {
      const colors = {
        default: 'rgba(255,255,255,0.08)',
        primary: 'rgba(139,92,246,0.15)',
        success: 'rgba(48,209,88,0.15)',
        warning: 'rgba(251,191,36,0.15)',
        danger: 'rgba(248,113,113,0.15)',
        info: 'rgba(96,165,250,0.15)',
      };
      const textColors = {
        default: '#94a3b8', primary: '#a78bfa', success: '#30D158',
        warning: '#fbbf24', danger: '#f87171', info: '#60a5fa',
      };
      return `<span class="kw-chip" style="background:${colors[color]};color:${textColors[color]}">${text}</span>`;
    },

    /** 通用卡片容器 */
    card(content, extraClass = '') {
      return `<div class="glass-card ${extraClass}" data-glow>${content}</div>`;
    },

    /** 进度条 */
    progressBar(percent, color = '#8b5cf6', height = 6) {
      return `<div class="progress-bar" style="height:${height}px;background:rgba(255,255,255,0.08);border-radius:${height/2}px;overflow:hidden;">
        <div style="width:${percent}%;height:100%;background:${color};border-radius:${height/2}px;transition:width 0.5s;"></div>
      </div>`;
    },

    /** 空状态 */
    emptyState(message = '暂无数据') {
      return `<div style="text-align:center;padding:40px 20px;color:var(--text-tertiary);font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;opacity:0.3;">📭</div>${message}
      </div>`;
    },

    /** 复制到剪贴板 */
    copyToClipboard(text, btnEl) {
      navigator.clipboard.writeText(text).then(() => {
        if (btnEl) {
          const orig = btnEl.textContent;
          btnEl.textContent = '✓ 已复制';
          TimerManager.setTimeout(() => btnEl.textContent = orig, 1500, 'button-feedback');
        }
      });
    },

    /** 表格排序 */
    sortTable(tableEl, colIndex, asc = true) {
      const tbody = tableEl.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aVal = parseFloat(a.cells[colIndex]?.textContent?.replace(/[^0-9.]/g, '')) || 0;
        const bVal = parseFloat(b.cells[colIndex]?.textContent?.replace(/[^0-9.]/g, '')) || 0;
        return asc ? aVal - bVal : bVal - aVal;
      });
      rows.forEach(r => tbody.appendChild(r));
    },

    /** 折叠section */
    toggleSection(id) {
      const el = document.getElementById(id);
      if (!el) return;
      const content = el.querySelector('.section-content') || el;
      const btn = el.querySelector('.section-collapse-btn');
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? '' : 'none';
      if (btn) btn.textContent = isHidden ? '收起' : '展开';
    },

    /** 初始化折叠功能 */
    initCollapse() {
      document.querySelectorAll('.section-collapse-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const section = btn.closest('.section');
          if (section) this.toggleSection(section.id);
        });
      });
    },
  };

  window.Renderer = Renderer;
  window.animateNumber = Renderer.animateNumber;
  window.toggleSection = Renderer.toggleSection;
})();


/* ===== core/framework.js ===== */
/**
 * 核心框架 — 模块注册、初始化、导航、筛选
 * 所有业务模块通过 Module.register() 注册，框架自动管理生命周期
 */
(function() {
  'use strict';

  // ===== 模块注册表 =====
  const modules = {};
  const moduleOrder = [];

  const Module = {
    /**
     * 注册一个业务模块
     * @param {Object} mod - 模块定义
     * @param {string} mod.id - 模块唯一ID（对应section的id）
     * @param {string[]} mod.requiredFields - 依赖的DATA字段，缺数据自动隐藏
     * @param {Function} mod.render - 渲染函数(data)
     * @param {Function} [mod.init] - 初始化函数（只执行一次）
     * @param {Function} [mod.destroy] - 销毁函数
     */
    register(mod) {
      if (!mod.id || !mod.render) {
        console.warn('[Module] 注册失败，缺少id或render:', mod);
        return;
      }
      modules[mod.id] = mod;
      moduleOrder.push(mod.id);
      if (mod.init) mod.init();
    },

    get(id) { return modules[id]; },
    all() { return moduleOrder.map(id => modules[id]); },

    /** 检查模块所需数据是否存在 */
    hasData(mod) {
      if (!mod.requiredFields) return true;
      const DATA = window.DASHBOARD_DATA || {};
      return mod.requiredFields.every(f => {
        const val = DATA[f];
        return val !== undefined && val !== null &&
               !(Array.isArray(val) && val.length === 0);
      });
    },
  };

  // ===== 安全数据访问 =====
  const Safe = {
    /** 安全获取嵌套字段，不存在返回默认值 */
    get(obj, path, def) {
      if (!obj) return def;
      const keys = path.split('.');
      let cur = obj;
      for (const k of keys) {
        if (cur == null || cur[k] === undefined) return def;
        cur = cur[k];
      }
      return cur === undefined ? def : cur;
    },
    arr(val) { return Array.isArray(val) ? val : []; },
    num(val, def) { return typeof val === 'number' ? val : (def || 0); },
    str(val, def) { return typeof val === 'string' ? val : (def || ''); },
  };

  // ===== 渲染调度 =====
  function renderAll() {
    // V8.1：渲染前统一补齐数据契约并计数
    try { if (window.normalizeDataContract) window.normalizeDataContract(); } catch (e) {}
    if (window.AppStore) window.AppStore.renderCount++;
    const DATA = window.DASHBOARD_DATA || {};
    const config = window.DOMAIN_CONFIG || {};
    const mods = config.modules || {};

    moduleOrder.forEach(id => {
      const mod = modules[id];
      if (!mod) return;

      // V8.2研究首页只执行可信数据管线和首页编排。
      if (document.body && document.body.classList.contains('v82-research') &&
          id !== 'evidenceInsights' && id !== 'homepageV82') return;

      // 模块开关检查
      if (mods[id] === false) {
        hideSection(id);
        return;
      }

      // 数据依赖检查
      if (!Module.hasData(mod)) {
        hideSection(id);
        return;
      }

      // 渲染 — 根据requiredFields传递子数据，单字段传子数据，多字段/无字段传完整DATA
      try {
        showSection(id);
        var renderData = DATA;
        if (mod.requiredFields && mod.requiredFields.length === 1) {
          renderData = DATA[mod.requiredFields[0]] || DATA;
        }
        mod.render(renderData);
      } catch (e) {
        console.error(`[Module] ${id} 渲染失败:`, e);
        if (window.AppErrorHandler) window.AppErrorHandler.handle(e, 'render:' + id);
        // 单个模块崩溃不影响其他模块
      }
    });

    // 更新导航
    updateNav();
  }

  function hideSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
  function showSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  }

  function updateNav() {
    const config = window.DOMAIN_CONFIG || {};
    const order = config.nav_order || [];
    const mods = config.modules || {};
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    nav.innerHTML = order.filter(id => {
      if (mods[id] === false) return false;
      const mod = modules[id];
      return mod ? Module.hasData(mod) : true;
    }).map(id => {
      const label = getSectionLabel(id);
      return `<a class="nav-link" data-target="${id}">${label}</a>`;
    }).join('');

    // 绑定导航点击
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const target = document.getElementById(link.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function getSectionLabel(id) {
    const labels = {
      hero: '工作台', techradar: '技术雷达', hotwords: '热点',
      breakdown: '爆款', topics: '选题', topicPerf: '效果',
      publishTime: '发布时间', titleFormulas: '标题公式',
      leadScripts: '引流话术', launchOps: '起号运营', audience: '受众',
      works: '作品', viralGenes: '爆款基因', insights: '洞察',
      schedule: '排期', commentScripts: '评论话术', checklist: '清单',
    };
    return labels[id] || id;
  }

  // ===== 平台筛选 =====
  let currentPlatform = 'all';
  function setPlatform(p) {
    currentPlatform = p;
    document.querySelectorAll('.platform-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.platform === p);
    });
    renderAll();
  }
  function filterByPlatform(arr) {
    if (!arr) return [];
    if (currentPlatform === 'all' || currentPlatform === 'compare') return arr;
    return arr.filter(item => item.platform === currentPlatform);
  }

  // ===== 分类筛选 =====
  let currentCategory = '';
  function applyFilter() {
    const sel = document.getElementById('categoryFilter');
    currentCategory = sel ? sel.value : '';
    renderAll();
  }

  // ===== 初始化 =====
  function init() {
    const DATA = window.DASHBOARD_DATA || {};
    const config = window.DOMAIN_CONFIG || {};

    // 更新时间
    const updateEl = document.getElementById('updateTime');
    if (updateEl) {
      updateEl.textContent = Safe.str(DATA.last_update, '暂无数据');
      // 数据新鲜度
      if (DATA.last_update) {
        const hours = (new Date() - new Date(DATA.last_update.replace(/-/g, '/'))) / 3600000;
        if (hours > 24) {
          updateEl.style.color = config.theme?.danger || '#f87171';
          updateEl.innerHTML = DATA.last_update + ' <span style="color:#f87171;font-size:11px;">⚠️ ' + (config.copy?.data_fresh_warning || '数据超过24小时未更新') + '</span>';
        }
      }
    }

    // 分类筛选器
    const cats = [...new Set(Safe.arr(DATA.hotwords).map(h => h.category).filter(Boolean))];
    const sel = document.getElementById('categoryFilter');
    if (sel) {
      sel.innerHTML = '<option value="">全部分类</option>' +
        cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // 页面标题
    document.title = config.display_name || '热点追踪工作台';

    // 数据准备与渲染由统一生命周期收口；兼容旧页面时仍可直接 renderAll。
    if (window.AppLifecycle) {
      window.AppLifecycle.prepare(DATA);
      window.AppLifecycle.render();
    } else {
      renderAll();
    }

    // 滚动动画
    initScrollReveal();

    // 导航隐藏
    initNavHide();

    // 表现层在 DOM 渲染后的下一帧初始化，不参与数据就绪判断。
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (typeof initSectionCollapse === 'function') initSectionCollapse();
      if (typeof checkDataFreshness === 'function') checkDataFreshness();
      if (window.EffectsManager) window.EffectsManager.initPage();
      else if (typeof initCardGlow === 'function') initCardGlow();
    }));
  }

  // ===== 滚动显现动画 =====
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.section, .glass-card, .hero-stat').forEach(el => {
      el.classList.add('anim-item');
      observer.observe(el);
    });
    if (window.EffectsManager) window.EffectsManager.register(() => observer.disconnect(), 'framework-reveal');
  }

  // ===== 导航栏滚动隐藏 =====
  function initNavHide() {
    let lastScroll = 0;
    const nav = document.querySelector('.top-nav');
    if (!nav) return;
    const onScroll = () => {
      const cur = window.scrollY;
      nav.style.transform = cur > lastScroll && cur > 100 ? 'translateY(-100%)' : 'translateY(0)';
      lastScroll = cur;
    };
    if (window.EventManager) window.EventManager.on(window, 'scroll', onScroll, { passive: true }, 'effect');
    else window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ===== 全局搜索 =====
  function doGlobalSearch(query) {
    if (!query) { renderAll(); return; }
    const q = query.toLowerCase();
    const DATA = window.DASHBOARD_DATA || {};
    // 筛选选题
    const topics = Safe.arr(DATA.topics).filter(t =>
      Safe.str(t.title).toLowerCase().includes(q) ||
      Safe.str(t.hook).toLowerCase().includes(q) ||
      Safe.str(t.keyword).toLowerCase().includes(q)
    );
    // 筛选热词
    const hotwords = Safe.arr(DATA.hotwords).filter(h =>
      Safe.str(h.keyword).toLowerCase().includes(q)
    );
    // 只渲染筛选结果（简化版）
    console.log('[Search] 选题:', topics.length, '热词:', hotwords.length);
    return { topics, hotwords };
  }

  // ===== 导出到全局（不自动init，由页面末尾在所有模块加载后调用initFramework()）=====
  window.Module = Module;
  window.Safe = Safe;
  window.renderAll = renderAll;
  window.setPlatform = setPlatform;
  window.filterByPlatform = filterByPlatform;
  window.applyFilter = applyFilter;
  window.doGlobalSearch = doGlobalSearch;
  window.initFramework = init;
  // 兼容原模板的全局DATA引用（所有模块IIFE内引用的DATA）
  // 必须用赋值而非const，避免遮蔽已存在的全局DATA
  try { window.DATA = window.DASHBOARD_DATA || {};

window.normalizeData(); } catch(e) {}
  // 同时尝试赋值给全局词法环境的DATA（如果是var声明的全局变量）
  if (typeof DATA !== 'undefined') {
    try { DATA = window.DASHBOARD_DATA || {}; } catch(e) {}
  }
  window.currentPlatform = 'all';
})();


/* ===== effects/glow.js ===== */
/**
 * effects/glow.js — UFO动态光晕特效
 * 自动扫描所有卡片元素，绑定鼠标跟随光晕
 * 特性：色相循环 + 椭圆轨道漂移 + 呼吸脉动 + 鼠标跟随
 * 零业务依赖，可独立使用
 */
(function() {
  'use strict';

  // 所有需要光晕的卡片选择器（与modules.css中的::before样式对应）
  const CARD_SELECTORS = [
    '.hero-stat', '.bento-card', '.breakdown-card', '.topic-card',
    '.insight-item', '.action-item', '.matrix-cell', '.small-item',
    '.formula-item', '.author-item', '.gene-card', '.persona-card',
    '.tech-card', '.tech-summary-card', '.kanban-card', '.schedule-item',
    '.checklist-item', '.compare-card', '.sat-item', '.tracker-bar',
    '.stat-card', '.glass-card', '.work-card', '.hotword-row',
    '[data-glow]'
  ].join(',');

  let animationId = null;
  const activeCards = new Set();

  /** 初始化所有光晕卡片 */
  function initCardGlow() {
    document.querySelectorAll(CARD_SELECTORS).forEach(card => {
      if (card._glowBound) return;
      // 跳过太小的元素和表格行
      if (card.offsetWidth < 30 || card.offsetHeight < 20) return;
      card._glowBound = true;
      card.setAttribute('data-glow', '');
      bindGlow(card);
    });

    if (!animationId) {
      animationId = requestAnimationFrame(animate);
    }
  }

  /** 绑定单个卡片的光晕 */
  function bindGlow(card) {
    card._glowState = {
      targetX: 50, targetY: 50,
      currentX: 50, currentY: 50,
      isHovering: false,
      hue: Math.random() * 360,
      orbitAngle: Math.random() * Math.PI * 2,
      breathPhase: Math.random() * Math.PI * 2
    };

    const enter = () => {
      card._glowState.isHovering = true;
      activeCards.add(card);
    };

    const leave = () => {
      card._glowState.isHovering = false;
      card._glowState.targetX = 50;
      card._glowState.targetY = 50;
    };

    const move = (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card._glowState.targetX = Math.max(0, Math.min(100, x));
      card._glowState.targetY = Math.max(0, Math.min(100, y));
    };
    if (window.EventManager) {
      window.EventManager.on(card, 'mouseenter', enter, false, 'effect');
      window.EventManager.on(card, 'mouseleave', leave, false, 'effect');
      window.EventManager.on(card, 'mousemove', move, false, 'effect');
    } else {
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      card.addEventListener('mousemove', move);
    }
  }

  /** 全局动画循环 — 所有卡片共享一个rAF */
  let lastTime = 0;
  function animate(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    activeCards.forEach(card => {
      const s = card._glowState;
      if (!s) return;

      // 平滑跟随鼠标
      s.currentX += (s.targetX - s.currentX) * 0.12;
      s.currentY += (s.targetY - s.currentY) * 0.12;

      // 椭圆轨道漂移（UFO感）
      s.orbitAngle += dt * 0.5;
      const orbitX = Math.cos(s.orbitAngle) * 3;
      const orbitY = Math.sin(s.orbitAngle * 1.3) * 2;

      // 色相循环
      s.hue = (s.hue + dt * 25) % 360;

      // 呼吸脉动
      s.breathPhase += dt * 1.5;
      const breath = 0.85 + Math.sin(s.breathPhase) * 0.15;

      const finalX = s.currentX + orbitX;
      const finalY = s.currentY + orbitY;

      card.style.setProperty('--mx', finalX.toFixed(2) + '%');
      card.style.setProperty('--my', finalY.toFixed(2) + '%');
      card.style.setProperty('--glow-hue', s.hue.toFixed(0));
      card.style.setProperty('--glow-opacity', breath.toFixed(2));

      // 鼠标离开后，光晕回到中心并淡出
      if (!s.isHovering && Math.abs(s.currentX - 50) < 0.5 && Math.abs(s.currentY - 50) < 0.5) {
        activeCards.delete(card);
      }
    });

    animationId = requestAnimationFrame(animate);
  }

  /** 重新扫描（动态添加卡片后调用） */
  function refreshGlow() {
    initCardGlow();
  }

  // 导出
  window.initCardGlow = initCardGlow;
  window.refreshGlow = refreshGlow;

  // DOM就绪后自动初始化（延迟等模块渲染完成）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(initCardGlow), { once: true });
  } else {
    requestAnimationFrame(initCardGlow);
  }

  // 监听DOM变化，自动给新元素绑定光晕
  const observer = new MutationObserver((mutations) => {
    let needsRefresh = false;
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches && node.matches(CARD_SELECTORS)) needsRefresh = true;
          if (node.querySelector && node.querySelector(CARD_SELECTORS)) needsRefresh = true;
        }
      });
    });
    if (needsRefresh) requestAnimationFrame(initCardGlow);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (window.EffectsManager) {
    window.EffectsManager.register(() => {
      observer.disconnect();
      if (animationId) cancelAnimationFrame(animationId);
      animationId = null;
      activeCards.clear();
    }, 'card-glow');
  }
})();


/* ===== effects/login.js ===== */

// 登录页Logo动效（通用版，支持多实例）

// 生成完整的Logo SVG HTML（包含defs、渐变、滤镜、玻璃路径、光晕层）
function createLogoSVG(prefix, width, height, brightness) {
  brightness = brightness || 1;
  var p = prefix;
  var paths = [
    'M243.31,288.55h42.82c4.49,0,8.71-2.18,11.31-5.84l115.29-162.35c3.26-4.59-0.02-10.95-5.65-10.95h-45.96c-6.74,0-13.06,3.26-16.96,8.76L234.83,272.12C229.94,279.01,234.86,288.55,243.31,288.55z',
    'M398.58,357.28h-49.56c-4.51,0-8.73-2.19-11.33-5.87l-36.66-51.92c-3.24-4.59,0.04-10.93,5.67-10.93h49.56c4.51,0,8.73,2.19,11.33,5.87l36.66,51.92C407.49,350.94,404.2,357.28,398.58,357.28z',
    'M586.1,178.14h-42.82c-4.49,0-8.71,2.18-11.31,5.84L416.67,346.33c-3.26,4.59,0.02,10.95,5.65,10.95h45.96c6.74,0,13.06-3.26,16.96-8.76l109.33-153.95C599.47,187.68,594.55,178.14,586.1,178.14z',
    'M430.83,109.41h49.56c4.51,0,8.73,2.19,11.33,5.87l36.66,51.92c3.24,4.59-0.04,10.93-5.67,10.93h-49.56c-4.51,0-8.73-2.19-11.33-5.87l-36.66-51.92C421.93,115.75,425.21,109.41,430.83,109.41z'
  ];

  var defs = '<defs>';
  for (var i = 1; i <= 4; i++) {
    defs += '<radialGradient id="' + p + 'Main' + i + '" cx="50%" cy="50%" r="75%">' +
      '<stop offset="0%" stop-color="#409cff" stop-opacity="' + (0.45*brightness).toFixed(2) + '"/>' +
      '<stop offset="35%" stop-color="#af52de" stop-opacity="' + (0.28*brightness).toFixed(2) + '"/>' +
      '<stop offset="65%" stop-color="#af52de" stop-opacity="' + (0.08*brightness).toFixed(2) + '"/>' +
      '<stop offset="100%" stop-color="#af52de" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="' + p + 'Sub' + i + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#ff64aa" stop-opacity="' + (0.26*brightness).toFixed(2) + '"/>' +
      '<stop offset="40%" stop-color="#64d2ff" stop-opacity="' + (0.14*brightness).toFixed(2) + '"/>' +
      '<stop offset="100%" stop-color="#64d2ff" stop-opacity="0"/>' +
      '</radialGradient>';
  }
  defs += '<radialGradient id="' + p + 'SparkGrad" cx="50%" cy="50%" r="50%">' +
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>' +
    '<stop offset="40%" stop-color="#64d2ff" stop-opacity="0.8"/>' +
    '<stop offset="100%" stop-color="#64d2ff" stop-opacity="0"/>' +
    '</radialGradient>' +
    '<filter id="' + p + 'SparkBlur" x="-50%" y="-50%" width="200%" height="200%">' +
    '<feGaussianBlur stdDeviation="2.5"/>' +
    '</filter>' +
    '<filter id="' + p + 'BlurM" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feGaussianBlur stdDeviation="8"/>' +
    '</filter>' +
    '<filter id="' + p + 'BlurS" x="-30%" y="-30%" width="160%" height="160%">' +
    '<feGaussianBlur stdDeviation="5"/>' +
    '</filter>' +
    '</defs>';

  var body = '';
  // 主光晕层
  for (var j = 0; j < 4; j++) {
    body += '<path d="' + paths[j] + '" class="' + p + 'm-' + (j+1) + '" fill="url(#' + p + 'Main' + (j+1) + ')" opacity="0.5"/>';
  }
  // 次光晕层
  for (var k = 0; k < 4; k++) {
    body += '<path d="' + paths[k] + '" class="' + p + 's-' + (k+1) + '" fill="url(#' + p + 'Sub' + (k+1) + ')" opacity="0.4"/>';
  }
  // 玻璃路径（可见形状+鼠标事件）
  for (var m = 0; m < 4; m++) {
    body += '<path d="' + paths[m] + '" class="login-glass" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>';
  }

  return '<svg viewBox="212.9 89.4 403.6 287.9" width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' + defs + body + '</svg>';
}

// 通用Logo特效初始化（呼吸、随机移动、鼠标跟随、颜色变化、边缘光点）
function initLogoEffect(svg, prefix) {
  if (!svg) return;
  var p = prefix || 'lg';
  var rgMains = [], rgSubs = [], glassPaths = [];
  for (var i = 1; i <= 4; i++) {
    rgMains.push(document.getElementById(p + 'Main' + i));
    rgSubs.push(document.getElementById(p + 'Sub' + i));
  }
  svg.querySelectorAll('path.login-glass').forEach(function(pp) { glassPaths.push(pp); });
  if (glassPaths.length === 0) return;

  var vb = svg.viewBox.baseVal;
  var vbX = vb.x, vbY = vb.y, vbW = vb.width, vbH = vb.height;
  var t = Math.random() * Math.PI * 2;
  var blocks = [];
  for (var bi = 0; bi < 4; bi++) {
    blocks.push({
      fx: 0.3 + Math.random() * 0.5, fy: 0.25 + Math.random() * 0.4,
      fx2: 0.1 + Math.random() * 0.2, fy2: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      breathSpeed: 0.012 + Math.random() * 0.004,
      breathPhase: bi * Math.PI / 2,
      hueSpeed: 0.4 + Math.random() * 0.3,
      huePhase: Math.random() * 360,
      cx: 50, cy: 50, mode: 'auto', targetCx: 50, targetCy: 50
    });
  }

  var sparks = [], frameCount = 0, activeSparkCount = 0, MAX_SPARKS = 2, TRAIL_LENGTH = 1;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  for (var si = 0; si < 4; si++) {
    var trailEls = [];
    for (var ti = 0; ti < TRAIL_LENGTH; ti++) {
      var cc = document.createElementNS(SVG_NS, 'circle');
      cc.setAttribute('fill', 'url(#' + p + 'SparkGrad)');
      cc.setAttribute('filter', 'url(#' + p + 'SparkBlur)');
      cc.setAttribute('opacity', '0');
      svg.appendChild(cc);
      trailEls.push(cc);
    }
    sparks.push({
      trailEls: trailEls, path: glassPaths[si], pathLen: glassPaths[si].getTotalLength(),
      active: false, progress: 0, baseSpeed: 0.004,
      nextFrame: 600 + Math.floor(Math.random() * 600),
      direction: 1, startOffset: 0, sparkle: 0
    });
  }

  function mouseToSvgPercent(e) {
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return {x:50,y:50};
    var svgPt = pt.matrixTransform(ctm.inverse());
    return {x:(svgPt.x-vbX)/vbW*100, y:(svgPt.y-vbY)/vbH*100};
  }

  glassPaths.forEach(function(path, idx) {
    path.addEventListener('mouseenter', function(e) {
      blocks[idx].mode = 'follow';
      var pp = mouseToSvgPercent(e);
      blocks[idx].targetCx = pp.x; blocks[idx].targetCy = pp.y;
    });
    path.addEventListener('mousemove', function(e) {
      if (blocks[idx].mode === 'follow') {
        var pp = mouseToSvgPercent(e);
        blocks[idx].targetCx = pp.x; blocks[idx].targetCy = pp.y;
      }
    });
    path.addEventListener('mouseleave', function() { blocks[idx].mode = 'auto'; });
  });

  function animate() {
    t += 0.012;
    for (var ai = 0; ai < 4; ai++) {
      var b = blocks[ai];
      var breath = 0.5 + 0.5 * Math.sin(t * b.breathSpeed * 60 + b.breathPhase);
      var mainR = (40 + breath * 48).toFixed(1) + '%';
      var subR = (25 + breath * 35).toFixed(1) + '%';
      var glowOpacity = (0.03 + breath * 0.85).toFixed(2);
      if (b.mode === 'auto') {
        b.targetCx = 50 + Math.sin(t*b.fx+b.phase)*20 + Math.sin(t*b.fx2+b.phase*2)*8;
        b.targetCy = 50 + Math.cos(t*b.fy+b.phase*1.5)*18 + Math.cos(t*b.fy2+b.phase)*6;
        b.cx += (b.targetCx-b.cx)*0.04; b.cy += (b.targetCy-b.cy)*0.04;
      } else {
        b.cx += (b.targetCx-b.cx)*0.15; b.cy += (b.targetCy-b.cy)*0.15;
      }
      if (rgMains[ai]) { rgMains[ai].setAttribute('cx',b.cx.toFixed(2)+'%'); rgMains[ai].setAttribute('cy',b.cy.toFixed(2)+'%'); rgMains[ai].setAttribute('r',mainR); }
      if (rgSubs[ai]) { rgSubs[ai].setAttribute('cx',(b.cx+5).toFixed(2)+'%'); rgSubs[ai].setAttribute('cy',(b.cy-3).toFixed(2)+'%'); rgSubs[ai].setAttribute('r',subR); }
      var mainPath = svg.querySelector('.' + p + 'm-' + (ai+1));
      var subPath = svg.querySelector('.' + p + 's-' + (ai+1));
      if (mainPath) mainPath.style.opacity = glowOpacity;
      if (subPath) subPath.style.opacity = (parseFloat(glowOpacity)*0.8).toFixed(2);
      var hue = (t*b.hueSpeed*60+b.huePhase)%360;
      if (mainPath) mainPath.style.filter = 'hue-rotate('+hue.toFixed(0)+'deg) url(#' + p + 'BlurM)';
      if (subPath) subPath.style.filter = 'hue-rotate('+hue.toFixed(0)+'deg) url(#' + p + 'BlurS)';
    }
    frameCount++;
    for (var sj = 0; sj < sparks.length; sj++) {
      var s = sparks[sj];
      if (!s.active && frameCount >= s.nextFrame) {
        if (activeSparkCount < MAX_SPARKS) {
          s.active = true; s.progress = 0;
          s.baseSpeed = 0.003 + Math.random()*0.004;
          s.direction = Math.random()>0.5?1:-1;
          s.startOffset = Math.random()*s.pathLen;
          activeSparkCount++;
        } else {
          s.nextFrame = frameCount + 200 + Math.floor(Math.random()*300);
        }
      }
      if (s.active) {
        var easeFactor = 0.25 + 0.75*Math.sin(s.progress*Math.PI);
        s.progress += s.baseSpeed*easeFactor;
        if (s.progress >= 1) {
          s.active = false; activeSparkCount--;
          s.nextFrame = frameCount + 1500 + Math.floor(Math.random()*2100);
          for (var tk=0; tk<TRAIL_LENGTH; tk++) s.trailEls[tk].setAttribute('opacity','0');
        } else {
          var globalOp;
          if (s.progress<0.12) globalOp = s.progress/0.12;
          else if (s.progress>0.88) globalOp = (1-s.progress)/0.12;
          else globalOp = 1;
          for (var tl=0; tl<TRAIL_LENGTH; tl++) {
            var trailProgress = Math.max(0, s.progress-tl*s.baseSpeed*10);
            var len = (s.startOffset+trailProgress*s.pathLen*s.direction)%s.pathLen;
            if (len<0) len += s.pathLen;
            var pt2 = s.path.getPointAtLength(len);
            var sizeFactor = 1-tl/TRAIL_LENGTH;
            var pulse = 1+0.15*Math.sin(s.progress*Math.PI*6+sj);
            if (Math.random()<0.008) s.sparkle = 1;
            s.sparkle *= 0.92;
            var sparkleBoost = 1+s.sparkle*0.9;
            var sizeSparkle = 1+s.sparkle*0.35;
            s.trailEls[tl].setAttribute('cx',pt2.x.toFixed(1));
            s.trailEls[tl].setAttribute('cy',pt2.y.toFixed(1));
            s.trailEls[tl].setAttribute('r',(5.5*sizeFactor*pulse*sizeSparkle+0.8).toFixed(1));
            var flicker = 0.85+0.15*Math.sin(s.progress*Math.PI*11+sj*2.3);
            s.trailEls[tl].setAttribute('opacity',(globalOp*sizeFactor*flicker*sparkleBoost).toFixed(2));
          }
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// 登录页Logo初始化（兼容旧调用）
function initLoginLogo() {
  var svg = document.querySelector('.login-logo-svg');
  if (svg) initLogoEffect(svg, 'lg');
}

// 滚动模糊渐显动效
function initScrollReveal() {
  var vh = window.innerHeight;
  function update() {
    if (document.body.classList.contains('v82-research')) {
      document.body.setAttribute('data-reveal', '1');
      var researchSections = document.querySelectorAll('#v82ResearchHome section');
      for (var r = 0; r < researchSections.length; r++) {
        researchSections[r].style.filter = 'none';
        researchSections[r].style.opacity = '1';
        researchSections[r].style.transform = 'none';
      }
      return;
    }
    if (document.getElementById('appSidebar')) {
      document.body.setAttribute('data-reveal', '1');
      var els = document.querySelectorAll('.hero, section');
      for (var i = 0; i < els.length; i++) {
        els[i].style.filter = 'none';
        els[i].style.opacity = '1';
        els[i].style.transform = 'none';
      }
      return;
    }
    var scrollY = window.scrollY;
    var reveal = Math.min(1, Math.max(0, (scrollY - vh * 0.15) / (vh * 0.65)));
    document.body.setAttribute('data-reveal', reveal.toFixed(2));
    var blur = (18 * (1 - reveal)).toFixed(1);
    var opacity = (0.25 + 0.75 * reveal).toFixed(2);
    var translateY = (50 * (1 - reveal)).toFixed(1);
    var els2 = document.querySelectorAll('.hero, section');
    for (var j = 0; j < els2.length; j++) {
      els2[j].style.filter = reveal >= 0.98 ? 'none' : 'blur(' + blur + 'px)';
      els2[j].style.opacity = opacity;
      els2[j].style.transform = reveal >= 0.98 ? 'none' : 'translateY(' + translateY + 'px)';
    }
  }
  window.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', function() { vh = window.innerHeight; update(); });
  update();
}

// 导航栏首屏隐藏逻辑
function initNavHide() {
  var nav = document.getElementById('topNav');
  if (!nav) return;
  function check() {
    if (window.scrollY < window.innerHeight * 0.5) {
      nav.classList.add('hidden-nav');
    } else {
      nav.classList.remove('hidden-nav');
    }
  }
  window.addEventListener('scroll', check, {passive:true});
  check();
}

// 初始化登录页所有特效
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initLoginLogo();
    initScrollReveal();
    initNavHide();
  });
} else {
  initLoginLogo();
  initScrollReveal();
  initNavHide();
}


/* ===== modules/_helpers.js ===== */
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
    const fallbackRules = [
      { match: ['工具','教程','入门','怎么做','做图','视频','ppt'], type: 'affiliate', score: 85, desc: '带货：工具会员/affiliate佣金' },
      { match: ['资讯','新闻','发布','agent'], type: 'ad', score: 70, desc: '广告：品牌合作、商单植入' },
      { match: ['工作流','自动化','效率'], type: 'private', score: 90, desc: '私域：引流微信，卖方案/咨询' },
      { match: ['提示词','prompt'], type: 'course', score: 75, desc: '知识付费：课程/社群' },
    ];
    const configuredRules = cfg('monetization_rules', fallbackRules);
    const rules = Array.isArray(configuredRules)
      ? configuredRules.filter(r => r && Array.isArray(r.match) && r.match.every(m => typeof m === 'string'))
      : [];
    if (!rules.length) rules.push(...fallbackRules);
    let type = 'affiliate', score = 60, desc = '带货：通用工具推荐';
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      if (r.match.some(m => kw.includes(m) || cat.includes(m))) {
        type = r.type; score = r.score; desc = r.desc; break;
      }
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
      if (sec.closest && sec.closest('#v82ResearchHome')) return;
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

      var isCollapsed = StorageAdapter.getRaw('sec_collapse_' + idx, '0') === '1';
      if (isCollapsed) {
        sec.classList.add('collapsed');
        btn.textContent = '展开';
      }

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var collapsed = sec.classList.toggle('collapsed');
        btn.textContent = collapsed ? '展开' : '收起';
        StorageAdapter.setRaw('sec_collapse_' + idx, collapsed ? '1' : '0');
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
    var text = '【' + cfg('name', '热点') + '选题清单】' + new Date().toLocaleDateString() + '\n\n';
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
  // CSV导出工具
  function downloadCSV(filename, rows) {
    var csv = rows.map(function(r) {
      return r.map(function(cell) {
        cell = String(cell == null ? '' : cell);
        if (cell.indexOf(',') >= 0 || cell.indexOf('"') >= 0 || cell.indexOf('\n') >= 0) {
          cell = '"' + cell.replace(/"/g, '""') + '"';
        }
        return cell;
      }).join(',');
    }).join('\n');
    var blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportHotwordsCSV() {
    var hw = DATA.hotwords || [];
    var rows = [['排名','关键词','分类','平台','作品数','最高赞','平均赞','收藏率','增长率','趋势','生命周期']];
    hw.forEach(function(h, i) {
      rows.push([
        i+1, h.keyword || '', h.category || '', h.platform || '',
        h.total || 0, h.max_like || 0, h.avg_like || 0,
        (h.collect_rate || 0) + '%', (h.growth || 0) + '%',
        h.trend || '', h.stage || ''
      ]);
    });
    downloadCSV(cfg('name','热点') + '_热词_' + new Date().toISOString().slice(0,10) + '.csv', rows);
  }

  function exportTopicsCSV() {
    var topics = filteredTopics();
    var rows = [['序号','标题','钩子','平台','优先级','人群','状态','关联热词']];
    topics.forEach(function(t, i) {
      var status = getTopicStatus(t.title);
      var statusText = status === 'published' ? '已发布' : status === 'shooting' ? '拍摄中' : '待拍摄';
      rows.push([
        i+1, t.title || '', t.hook || '', t.platform || '双平台',
        t.priority || '', t.audience || '', statusText, t.keyword || ''
      ]);
    });
    downloadCSV(cfg('name','热点') + '_选题_' + new Date().toISOString().slice(0,10) + '.csv', rows);
  }

  window.exportTopics = exportTopics;
  window.exportHotwordsCSV = exportHotwordsCSV;
  window.exportTopicsCSV = exportTopicsCSV;
  window.downloadCSV = downloadCSV;
})();


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
      if (window.RadarProfileService) RadarProfileService.ensure(record);
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
/* ===== modules/textAISettings.js ===== */
(function(){
  'use strict';
  var lastConnection=null;
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function field(id){var element=document.getElementById(id);return element?String(element.value||'').trim():'';}
  function currentForm(){var saved=TextAIProvider.getCurrentConfig();return {providerId:field('textAIProvider'),providerType:'openai-compatible',baseUrl:field('textAIBaseUrl'),apiKey:field('textAIKey')||(saved&&saved.apiKey)||'',model:field('textAIModel')};}
  function statusHtml(config){
    if(!config)return '<div class="text-ai-status is-empty"><strong>尚未配置文字模型</strong><span>配置后即可使用 AI 内容拆解、口播生成和快捷改写。</span></div>';
    var connection=config.connection||{status:'untested'},label=connection.status==='success'?'测试成功':(connection.status==='failed'?'测试失败':'未测试'),tone=connection.status==='success'?'is-success':(connection.status==='failed'?'is-error':'is-pending');
    return '<div class="text-ai-status '+tone+'"><strong>'+esc((PROVIDER_PRESETS[config.providerId]||{}).name||config.providerId)+' · '+esc(config.model)+'</strong><span>连接状态：'+label+' · Key：'+esc(TextAIProvider.maskKey(config.apiKey))+'</span></div>';
  }
  function render(){
    var host=document.getElementById('textAISettings');if(!host||!window.TextAIProvider)return;
    var config=TextAIProvider.getCurrentConfig(),provider=config&&config.providerId||'xiaomi-mimo',preset=PROVIDER_PRESETS[provider]||PROVIDER_PRESETS['openai-compatible'];
    host.innerHTML='<div class="text-ai-heading"><div><h3>文字模型 API</h3><p>使用自己的 API，配置对所有行业生效。</p></div><span class="text-ai-mode">浏览器直连</span></div>'+statusHtml(config)+
      '<div class="text-ai-form">'+
      '<label>Provider<select id="textAIProvider" class="industry-flow-input"><option value="xiaomi-mimo">Xiaomi MiMo</option><option value="openai-compatible">OpenAI-Compatible</option><option value="custom">Custom</option></select></label>'+
      '<label>API Base URL<input id="textAIBaseUrl" class="industry-flow-input" type="url" autocomplete="off" value="'+esc(config&&config.baseUrl||preset.baseUrl||'')+'" placeholder="https://provider.example/v1"></label>'+
      '<label>API Key<div class="text-ai-key-row"><input id="textAIKey" class="industry-flow-input" type="password" autocomplete="new-password" placeholder="'+esc(config?TextAIProvider.maskKey(config.apiKey):'输入 API Key')+'"><button type="button" data-text-ai-action="toggle-key" aria-label="显示 API Key" title="显示或隐藏 API Key">显示</button></div></label>'+
      '<label>Model<input id="textAIModel" class="industry-flow-input" type="text" autocomplete="off" value="'+esc(config&&config.model||'')+'" placeholder="'+esc(preset.modelPlaceholder||'model id')+'"></label>'+
      '<p class="text-ai-provider-note" id="textAIProviderNote">'+esc(preset.modelGuide||'')+'</p><div class="text-ai-result" id="textAIResult" aria-live="polite"></div>'+
      '<div class="text-ai-actions"><button type="button" data-text-ai-action="test">测试连接</button><button type="button" class="v82-primary" data-text-ai-action="save">保存配置</button><button type="button" class="is-danger" data-text-ai-action="clear">清除 API 配置</button></div></div>'+
      '<p class="text-ai-security">API Key 仅保存在当前浏览器，用于调用你选择的模型服务。请勿在公共电脑保存长期有效的 API Key。</p>'+
      '<details class="text-ai-guide"><summary>如何获取 API Key？</summary><ol><li>选择一个文字模型 Provider</li><li>前往 Provider 官网注册</li><li>创建 API Key</li><li>复制 API Key</li><li>返回本页面</li><li>填入 API Key 和 Model</li><li>点击测试连接</li></ol><p id="textAIGuideText">'+esc(preset.apiKeyGuide||'')+'</p></details>';
    document.getElementById('textAIProvider').value=provider;
  }
  function updatePreset(){var id=field('textAIProvider'),preset=PROVIDER_PRESETS[id]||PROVIDER_PRESETS.custom,base=document.getElementById('textAIBaseUrl'),model=document.getElementById('textAIModel');if(base)base.value=preset.baseUrl||'';if(model){model.value='';model.placeholder=preset.modelPlaceholder||'model id';}var note=document.getElementById('textAIProviderNote'),guide=document.getElementById('textAIGuideText');if(note)note.textContent=preset.modelGuide||'';if(guide)guide.textContent=preset.apiKeyGuide||'';lastConnection=null;}
  function result(message,type){var host=document.getElementById('textAIResult');if(host){host.className='text-ai-result '+(type||'');host.textContent=message;}}
  function test(){var config=currentForm(),checked=TextAIProvider.validate(config);if(!checked.valid){result('请填写：'+checked.missing.join('、'),'is-error');return;}result('正在测试最小连接请求…','is-pending');TextAIProviderAdapter.testConnection(config).then(function(value){lastConnection={status:'success',provider:value.provider,model:value.model,latency:value.latency};result('连接成功 · Provider：'+value.provider+' · Model：'+value.model+' · Latency：'+value.latency+'ms','is-success');}).catch(function(error){lastConnection={status:'failed',code:error&&error.code||'UNKNOWN'};result(error&&error.message||'连接失败。','is-error');});}
  function save(){var saved=TextAIProvider.saveConfig(currentForm());if(!saved.valid){result('请填写：'+saved.missing.join('、'),'is-error');return;}if(lastConnection)TextAIProvider.setConnection(lastConnection);render();result('配置已保存，仅存于当前浏览器。','is-success');}
  function clear(){TextAIProvider.clearConfig();lastConnection=null;render();result('文字模型配置已清除。','is-success');}
  document.addEventListener('click',function(event){var button=event.target.closest&&event.target.closest('[data-text-ai-action]');if(!button)return;var action=button.getAttribute('data-text-ai-action');if(action==='toggle-key'){var input=document.getElementById('textAIKey');if(input){input.type=input.type==='password'?'text':'password';button.textContent=input.type==='password'?'显示':'隐藏';button.setAttribute('aria-label',button.textContent+' API Key');}}else if(action==='test')test();else if(action==='save')save();else if(action==='clear')clear();});
  document.addEventListener('change',function(event){if(event.target&&event.target.id==='textAIProvider')updatePreset();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
  window.TextAISettings={render:render};
})();
/* ===== modules/hero.js ===== */
/**
 * modules/hero.js
 * 函数: renderHeroStats, renderActions, renderInsights
 * 依赖: ['hotwords', 'works', 'topics']
 */
(function() {
  'use strict';

  // renderHeroStats
  function renderHeroStats(hw, works, topics) {
    const totalLikes = works.reduce((s,w)=>s+(w.likeCount||0),0);
    const surging = hw.filter(h=>h.trend==='飙升'||h.trend==='新热').length;
    const topSurging = hw.filter(h=>h.trend==='飙升').sort((a,b)=>b.total-a.total)[0];
    document.getElementById('heroStats').innerHTML = `
      <div class="hero-stat">
        <div class="hs-label">${topSurging?'今日飙升热词':'追踪关键词'}</div>
        <div class="hs-value" id="heroMainVal">${topSurging?topSurging.keyword:hw.length}</div>
        <div class="hs-sub">${topSurging?topSurging.total.toLocaleString()+' 条作品 · '+topSurging.category:new Set(hw.map(h=>h.category)).size+' 个细分赛道'}</div>
        ${surging>0?`<span class="hs-trend up">▲ ${surging} 个热词异动</span>`:`<span class="hs-trend flat">— 市场平稳</span>`}
      </div>
      <div class="hero-stat">
        <div class="hs-label">采集作品</div>
        <div class="hs-value green" id="heroWorksVal">${works.length}</div>
        <div class="hs-sub">总点赞 ${(totalLikes/10000).toFixed(1)} 万</div>
      </div>
      <div class="hero-stat">
        <div class="hs-label">飙升 / 新热</div>
        <div class="hs-value red" id="heroSurgingVal">${surging}</div>
        <div class="hs-sub">飙升 ${hw.filter(h=>h.trend==='飙升').length} · 新热 ${hw.filter(h=>h.trend==='新热').length}</div>
      </div>
      <div class="hero-stat">
        <div class="hs-label">选题建议</div>
        <div class="hs-value orange" id="heroTopicsVal">${topics.length}</div>
        <div class="hs-sub">标题 + 钩子 + 形式</div><span class="export-btn" onclick="exportTopics()" style="margin-left:12px;">📋 导出选题</span>
      </div>`;
    TimerManager.setTimeout(()=>{
      animateNumber(document.getElementById('heroWorksVal'), works.length);
      animateNumber(document.getElementById('heroSurgingVal'), surging);
      animateNumber(document.getElementById('heroTopicsVal'), topics.length);
    }, 300, 'hero-counter');
  }

  // renderActions
  function renderActions() {
    const actions = DATA.daily_actions || [];
    const el = document.getElementById('actionList');
    if (!actions.length) { el.innerHTML='<div class="empty-state">暂无行动建议</div>'; return; }
    el.innerHTML = actions.map(a => `
      <div class="action-item ${a.priority==='高'?'':a.priority==='中'?'medium':'low'}">
        <div class="action-icon">${a.priority==='高'?'▲':a.priority==='中'?'●':'○'}</div>
        <div class="action-content">
          <span class="action-type">${a.type}</span>
          <div class="action-text">${a.content}</div>
          ${a.detail?`<div class="action-detail">${a.detail}</div>`:''}
        </div>
      </div>`).join('');
  }

  // renderInsights
  function renderInsights(hw, works) {
    const ins = [];
    const topWork = [...works].sort((a,b)=>(b.likeCount||0)-(a.likeCount||0))[0];
    if (topWork) ins.push({type:'hot',text:`单条最高赞 <b>${(topWork.likeCount/10000).toFixed(1)}万</b> — 「${(topWork.title||'').slice(0,16)}…」${topWork._keyword?' · '+topWork._keyword:''}`});
    const topCollect = [...hw].sort((a,b)=>(b.collect_rate||0)-(a.collect_rate||0))[0];
    if (topCollect && topCollect.collect_rate>0) ins.push({type:'value',text:`收藏率最高 <b>${topCollect.keyword}</b>（${topCollect.collect_rate}%），适合做教程型内容`});
    const blueOcean = hw.filter(h=>h.total<1000&&h.max_like>10000).sort((a,b)=>b.max_like-a.max_like)[0];
    if (blueOcean) ins.push({type:'value',text:`蓝海机会 <b>${blueOcean.keyword}</b> 仅${blueOcean.total}条但最高赞${blueOcean.max_like.toLocaleString()}，优先切入`});
    const surging = hw.filter(h=>h.trend==='飙升');
    if (surging.length) ins.push({type:'hot',text:`飙升热词 ${surging.slice(0,3).map(h=>h.keyword).join(' / ')}`});
    const pt = DATA.publish_time_dist||[];
    const bestHour = pt.sort((a,b)=>b.count-a.count)[0];
    if (bestHour && bestHour.count>0) ins.push({type:'warn',text:`最佳发布时段 <b>${bestHour.hour}:00</b>（占比${bestHour.pct}%）`});
    const sat = DATA.saturation || [];
    const lowestSat = sat[0];
    if (lowestSat && lowestSat.saturation < 50) ins.push({type:'value',text:`最低饱和度 <b>${lowestSat.keyword}</b>（${lowestSat.saturation}）· ${lowestSat.stage}`});
    document.getElementById('insightsGrid').innerHTML = ins.slice(0,6).map(i=>`<div class="insight-item ${i.type}">${i.text}</div>`).join('');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "hero",
      requiredFields: ['hotwords', 'works', 'topics'],
      render: function(data) {
        try { renderHeroStats(data.hotwords, data.works, data.topics); renderActions(data); renderInsights(data.hotwords, data.works); } catch(e) { console.error("[hero]", e); }
      }
    });
  }
  window.renderHeroStats = renderHeroStats;
  window.renderActions = renderActions;
  window.renderInsights = renderInsights;
})();


/* ===== modules/evidenceInsights.js ===== */
/**
 * V8.2 Alpha 1可信洞察管线。
 * 每份DATA对象只建立一次Evidence索引，并通过AppStore提供查询API。
 */
(function() {
  'use strict';

  var cachedData = null;
  var cachedAnalysis = null;

  function exposeStore(analysis) {
    if (!window.AppStore) return;
    var store = analysis.evidenceStore;
    AppStore.v82 = analysis;
    AppStore.evidenceStore = store;
    AppStore.getEvidence = function(id) { return store.getEvidence(id); };
    AppStore.getEvidenceByIds = function(ids) { return store.getEvidenceByIds(ids); };
    AppStore.getEvidenceByType = function(type) { return store.getEvidenceByType(type); };
    AppStore.getEvidenceByInsight = function(id) { return store.getEvidenceByInsight(id); };
  }

  function ensureAnalysis(data) {
    data = data && typeof data === 'object' ? data : {};
    if (cachedData !== data || !cachedAnalysis) {
      cachedData = data;
      cachedAnalysis = window.V82Evidence.buildAnalysis(data);
    }
    exposeStore(cachedAnalysis);
    return cachedAnalysis;
  }

  function render(data) {
    // 默认首页只保留分析能力和 AppStore 查询接口，不插入 Alpha 研究卡片。
    ensureAnalysis(data);
  }

  if (window.Module && window.V82Evidence) {
    Module.register({ id:'evidenceInsights', requiredFields:[], render:render });
  }
  window.ensureV82Analysis = ensureAnalysis;
})();
/* ===== modules/evidenceDrawer.js ===== */
(function() {
  'use strict';

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char];
    });
  }

  function fmt(value) {
    if (value === null || value === undefined) return '未采集';
    var number = Number(value);
    return isFinite(number) ? number.toLocaleString() : '未采集';
  }

  function safeUrl(value) {
    try {
      var url = new URL(String(value || ''), window.location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (e) { return ''; }
  }

  function ensureDrawer() {
    var drawer = document.getElementById('v82EvidenceDrawer');
    if (drawer) return drawer;
    drawer = document.createElement('aside');
    drawer.id = 'v82EvidenceDrawer';
    drawer.className = 'v82-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = '<div class="v82-drawer-backdrop" data-v82-close></div><div class="v82-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="v82DrawerTitle">' +
      '<header><div><span class="v82-drawer-kicker" id="v82DrawerKicker">原始证据</span><h2 id="v82DrawerTitle">证据</h2></div><button type="button" class="v82-close" data-v82-close aria-label="关闭">×</button></header>' +
      '<div class="v82-drawer-body" id="v82DrawerBody"></div></div>';
    document.body.appendChild(drawer);
    return drawer;
  }

  function insightById(id) {
    var analysis = window.AppStore && AppStore.v82;
    if (!analysis) return null;
    return analysis.insights.find(function(item) { return item.id === id; }) || null;
  }

  function evidenceCard(item) {
    var title = item.title || item.text || '未提供标题';
    var originalUrl = safeUrl(item.url);
    var link = originalUrl ? '<a href="' + escapeHTML(originalUrl) + '" target="_blank" rel="noopener noreferrer">查看原始内容</a>' : '<span class="v82-muted">原始链接未采集</span>';
    return '<article class="v82-evidence-card"><div class="v82-evidence-meta"><span>' + escapeHTML(item.platform || 'unknown') + '</span><span>' + escapeHTML(item.keyword || '未标注关键词') + '</span></div>' +
      '<h3>' + escapeHTML(title) + '</h3>' +
      (item.text && item.text !== item.title ? '<p>' + escapeHTML(item.text).slice(0, 180) + '</p>' : '') +
      '<div class="v82-metrics"><span>赞 ' + fmt(item.metrics.likes) + '</span><span>评 ' + fmt(item.metrics.comments) + '</span><span>藏 ' + fmt(item.metrics.favorites) + '</span></div>' +
      '<div class="v82-evidence-link">' + link + '</div></article>';
  }

  function interactionValue(item) {
    return ['likes', 'comments', 'favorites', 'shares'].reduce(function(total, key) {
      var value = item.metrics && item.metrics[key];
      return total + (value == null || !isFinite(Number(value)) ? 0 : Number(value));
    }, 0);
  }

  function renderBasis(insight, evidence) {
    var p = insight.provenance || {};
    var s = insight.evidenceStrength || {};
    var limitations = (p.limitations || []).concat((AppStore.v82.dataQuality && AppStore.v82.dataQuality.limitations) || []);
    var sourceName = insight.sourceType === 'REAL' ? '原始采集数据' : insight.sourceType === 'DERIVED' ? '由原始样本计算得出' : '基于现有样本推断';
    var strengthName = { HIGH:'高', MEDIUM:'中', LOW:'低' }[s.level] || '低';
    var method = insight.metrics && insight.metrics.averageEngagement != null
      ? '分析了 ' + evidence.length + ' 条相关作品标题，并计算点赞、评论、收藏和分享的平均互动。'
      : '分析了 ' + evidence.length + ' 条相关原始样本，按明确的采集关键词归组。';
    return '<section class="v82-basis"><p class="v82-basis-summary">' + escapeHTML(method) + '</p><dl>' +
      '<div><dt>数据来源</dt><dd>' + escapeHTML(sourceName) + '</dd></div>' +
      '<div><dt>样本数量</dt><dd>' + evidence.length + ' 条</dd></div>' +
      '<div><dt>依据强度</dt><dd>' + strengthName + '：来源 ' + (s.sourceCount || 0) + ' 个平台，字段完整度 ' + Math.round((s.completeness || 0) * 100) + '%</dd></div>' +
      '</dl><h3>需要注意</h3>' + (limitations.length ? '<ul>' + limitations.map(function(item) { return '<li>' + escapeHTML(item) + '</li>'; }).join('') + '</ul>' : '<p class="v82-muted">无额外限制记录</p>') +
      '<details class="v82-advanced"><summary>高级信息</summary><dl><div><dt>内部强度</dt><dd>' + escapeHTML(s.level || 'LOW') + '</dd></div><div><dt>来源字段</dt><dd>' + escapeHTML((p.sourceFields || []).join('、') || '未记录') + '</dd></div><div><dt>计算公式</dt><dd>' + escapeHTML(p.formula || '未使用公式') + '</dd></div><div><dt>生成模块</dt><dd>' + escapeHTML(p.generatedBy || '未记录') + '</dd></div></dl></details></section>';
  }

  function open(insightId, mode) {
    var drawer = ensureDrawer();
    var insight = insightById(insightId);
    var body = document.getElementById('v82DrawerBody');
    if (!insight || !body) {
      if (body) body.innerHTML = '<div class="v82-empty">未找到对应洞察或证据。</div>';
    } else {
      var evidence = AppStore.getEvidenceByInsight(insightId).slice().sort(function(a, b) {
        return interactionValue(b) - interactionValue(a);
      });
      document.getElementById('v82DrawerKicker').textContent = mode === 'basis' ? '计算依据' : '原始证据';
      document.getElementById('v82DrawerTitle').textContent = insight.title;
      body.innerHTML = mode === 'basis' ? renderBasis(insight, evidence) :
        '<div class="v82-drawer-summary"><strong>' + evidence.length + ' 条原始证据</strong>' +
        (insight.metrics && insight.metrics.keyword ? '<span>主要关键词：' + escapeHTML(insight.metrics.keyword) + '</span>' : '') +
        '<small>按互动量从高到低排列</small></div>' +
        (evidence.length ? evidence.map(evidenceCard).join('') : '<div class="v82-empty">该洞察当前没有可展示的原始证据。</div>');
    }
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function close() {
    var drawer = document.getElementById('v82EvidenceDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('click', function(event) {
    var action = event.target.closest && event.target.closest('[data-v82-action]');
    if (action) open(action.getAttribute('data-insight-id'), action.getAttribute('data-v82-action'));
    if (event.target.closest && event.target.closest('[data-v82-close]')) close();
  });
  document.addEventListener('keydown', function(event) { if (event.key === 'Escape') close(); });
  window.openEvidenceDrawer = open;
  window.closeEvidenceDrawer = close;
})();
/* ===== modules/homepageV82.js ===== */
(function() {
  'use strict';

  // Research Workspace 保留为显式预览，不再替代默认的原版工作台。
  var params = new URLSearchParams(window.location.search);
  if (params.get('view') !== 'research') return;

  document.body.classList.add('v82-research');

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char];
    });
  }

  function ensureRoot() {
    var root = document.getElementById('v82ResearchHome');
    if (root) return root;
    root = document.createElement('main');
    root.id = 'v82ResearchHome';
    root.className = 'v82-home';
    var hero = document.querySelector('.hero');
    if (hero && hero.parentNode) hero.parentNode.insertBefore(root, hero);
    else document.body.appendChild(root);
    return root;
  }

  function state(type, title, description) {
    return '<div class="v82-state v82-state-' + type.toLowerCase() + '" data-state="' + type + '"><strong>' + esc(title) + '</strong><p>' + esc(description) + '</p></div>';
  }

  function strengthLabel(value) { return { HIGH:'高', MEDIUM:'中', LOW:'低' }[value] || '低'; }

  function insightCard(insight) {
    var sourceLabel = insight.type === 'need' ? '基于真实评论' : '基于真实作品 · 推导分析';
    return '<article class="v82-research-card"><span class="v82-data-source">' + sourceLabel + '</span>' +
      '<h3>' + esc(insight.title) + '</h3><p>' + esc(insight.description) + '</p>' +
      '<div class="v82-card-meta"><span>' + insight.evidenceIds.length + ' 条原始证据</span><span>证据强度：' + strengthLabel(insight.evidenceStrength.level) + '</span></div>' +
      '<div class="v82-card-actions">' +
      '<button type="button" data-v82-action="evidence" data-insight-id="' + esc(insight.id) + '">查看证据</button>' +
      '<button type="button" class="v82-secondary-action" data-v82-action="basis" data-insight-id="' + esc(insight.id) + '">计算依据</button></div></article>';
  }

  function section(number, id, title, summary, content) {
    return '<section class="v82-home-section" id="' + id + '"><header class="v82-home-section-head"><span>' + number + '</span><div><h2>' + title + '</h2><p>' + summary + '</p></div></header>' + content + '</section>';
  }

  function renderHeader(data, quality) {
    var industry = (data.summary && data.summary.industry) || (AppStore.industry && AppStore.industry.name) || '当前行业';
    if (AppStore.industry.id === 'ai') industry = 'AI';
    if (AppStore.industry.id === 'shufa') industry = '书法';
    var platformNames = { douyin:'抖音', xiaohongshu:'小红书' };
    var platforms = quality.platforms && quality.platforms.length ? quality.platforms.map(function(item) { return platformNames[item] || item; }).join('、') : '暂无平台信息';
    return '<header class="v82-research-header"><div><span class="v82-eyebrow">Industry Research</span><h1>' + esc(industry) + '</h1>' +
      '<p>行业内容研究 · 基于真实采集数据</p></div>' +
      '<div class="v82-context"><div><span>最后采集</span><strong>' + esc(quality.collectionTime || '未记录') + '</strong></div><div><span>数据来源</span><strong>' + esc(platforms) + '</strong></div></div>' +
      '<div class="v82-header-actions"><button type="button" class="v82-primary" data-v82-home-action="collect">重新采集</button><button type="button" data-v82-home-action="settings">行业设置</button></div></header>';
  }

  function renderQuality(quality) {
    var items = [[quality.worksCount,'作品'],[quality.keywordsCount,'关键词'],[quality.commentsCount,'评论'],[quality.platformsCount,'平台']].map(function(item) {
      return '<div><strong>' + item[0].toLocaleString() + '</strong><span>' + item[1] + '</span></div>';
    }).join('');
    var limitations = quality.limitations.map(function(item) { return '<li>' + esc(item) + '</li>'; }).join('');
    return section('02', 'v82DataQuality', '数据质量', '结论范围由当前样本决定，不使用综合评分。', '<div class="v82-quality-strip">' + items +
      '<div class="v82-quality-time"><span>最后采集</span><strong>' + esc(quality.collectionTime || '未记录') + '</strong></div></div>' +
      (limitations ? '<ul class="v82-limitations">' + limitations + '</ul>' : ''));
  }

  function renderInsights(number, id, title, summary, insights, emptyText) {
    var content = insights.length ? '<div class="v82-research-grid">' + insights.map(insightCard).join('') + '</div>' : state('NO_DATA', '暂无可验证结论', emptyText);
    return section(number, id, title, summary, content);
  }

  function renderUserVoice(analysis) {
    var content;
    if (!analysis.dataQuality.commentsCount) {
      content = state('DATA_INSUFFICIENT', '当前暂无评论样本', '因此暂时无法分析高频问题、用户痛点和用户需求。采集到真实评论后，这里将展示常见表达。');
    } else if (!analysis.userVoiceInsights.length) {
      content = state('DATA_INSUFFICIENT', '评论主题尚不足以形成结论', '已有评论样本，但没有达到可重复验证的主题门槛。');
    } else content = '<div class="v82-research-grid">' + analysis.userVoiceInsights.map(insightCard).join('') + '</div>';
    return section('05', 'v82UserVoice', '用户声音', '只分析真实评论 Evidence。', content);
  }

  function renderDeepDive(analysis) {
    if (!analysis.evidenceStore.count()) return section('06', 'v82DeepDive', '深入研究', '原始记录与完整研究范围。', state('NO_DATA', '暂无原始数据', '完成采集后可在这里查看作品、关键词和 Evidence。'));
    var works = analysis.evidenceStore.getEvidenceByType('work').slice(0, 8);
    var keywords = analysis.evidenceStore.getEvidenceByType('keyword').slice(0, 16);
    var rows = works.map(function(work) {
      return '<tr><td>' + esc(work.platform) + '</td><td>' + esc(work.title || '未提供标题') + '</td><td>' + esc(work.keyword || '未标注') + '</td><td>' + (work.metrics.likes == null ? '未采集' : work.metrics.likes.toLocaleString()) + '</td></tr>';
    }).join('');
    var tags = keywords.map(function(item) { return '<span>' + esc(item.keyword) + '</span>'; }).join('');
    return section('06', 'v82DeepDive', '进一步研究', '按需展开原始记录，首页默认保持简洁。', '<div class="v82-deep-links">' +
      '<details><summary><strong>浏览原始作品</strong><span>' + analysis.dataQuality.worksCount + ' 条记录</span></summary><div class="v82-table-wrap"><table><thead><tr><th>平台</th><th>标题</th><th>关键词</th><th>点赞</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>' +
      '<details><summary><strong>查看全部关键词</strong><span>' + analysis.dataQuality.keywordsCount + ' 个关键词</span></summary><div class="v82-keyword-list">' + tags + '</div></details>' +
      '<div class="v82-deep-link"><strong>Evidence 索引</strong><span>' + analysis.evidenceStore.count() + ' 条可追溯证据</span></div>' +
      '<div class="v82-deep-link"><strong>历史数据</strong><span>' + (analysis.dataQuality.historyDays >= 2 ? analysis.dataQuality.historyDays + ' 天记录' : '当前数据不足') + '</span></div></div>');
  }

  function render(data) {
    var root = ensureRoot();
    if (!window.ensureV82Analysis) { root.innerHTML = state('ERROR', '分析模块加载失败', '请刷新页面后重试。'); return; }
    var analysis = window.ensureV82Analysis(data);
    root.innerHTML = renderHeader(data, analysis.dataQuality) + renderQuality(analysis.dataQuality) +
      renderInsights('03', 'v82WhatsHot', '现在值得关注', '按真实作品样本量排序，每条结论均可查看证据。', analysis.hotInsights.slice(0, 4), '当前没有作品或采集关键词，无法判断热点。') +
      renderInsights('04', 'v82ContentPatterns', '内容表现模式', '只使用标题和真实互动字段，不推断播放量或转化。', analysis.contentPatternInsights.slice(0, 4), '当前样本尚未形成可验证的标题互动模式。') +
      renderUserVoice(analysis) + renderDeepDive(analysis);
  }

  function openSettings(prefill) {
    var panel = document.getElementById('settingsPanel');
    if (!panel) return;
    document.body.classList.add('v82-settings-open');
    panel.style.display = 'block';
    if (prefill) { var input = document.getElementById('industryInput'); if (input) input.value = AppStore.industry.name || ''; }
    panel.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  document.addEventListener('click', function(event) {
    var action = event.target.closest && event.target.closest('[data-v82-home-action]');
    if (!action) return;
    var type = action.getAttribute('data-v82-home-action');
    openSettings(type === 'collect');
    if (window.DynamicIndustryFlow) {
      DynamicIndustryFlow.renderManager();
      if (type === 'collect') DynamicIndustryFlow.openRecollect();
    }
  });

  if (window.Module) Module.register({ id:'homepageV82', requiredFields:[], render:render });
})();
/* ===== modules/hotwords.js ===== */
/**
 * modules/hotwords.js
 * 函数: renderHotwordTable, renderCategory, renderRanking, renderHistory, showKeywordTrend, filteredHotwords
 * 依赖: ['hotwords']
 */
(function() {
  'use strict';

  function chartingReady() {
    return !!(window.echarts && typeof window.echarts.init === 'function');
  }

  // renderHotwordTable
  function renderHotwordTable(hw) {
    function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
    const sorted=[...hw].sort((a,b)=>b.total-a.total);
    const satMap = {};
    (DATA.saturation||[]).forEach(s=>satMap[s.keyword]=s.stage);
    document.querySelector('#hotwordTable tbody').innerHTML=sorted.map((h,i)=>`
      <tr><td>${i+1}</td><td><b style="color:var(--text);cursor:pointer;text-decoration:underline dotted" onclick="showKeywordTrend('${h.keyword.replace(/'/g,"\\'")}')" title="点击查看趋势">${esc(h.keyword)}</b><button type="button" class="v83-inline-action" data-v83-hotword="${esc(h.keyword)}">热门内容</button></td><td>${esc(h.category)}</td><td>${h.total.toLocaleString()}</td><td class="like-num">${h.max_like.toLocaleString()}</td><td class="collect-num">${h.collect_rate}%</td><td><span class="tag ${trendClass(h.trend)}">${esc(h.trend||'稳定')}</span></td><td><span class="tag ${satMap[h.keyword]==='萌芽期'?'sprout':satMap[h.keyword]==='上升期'?'rise':satMap[h.keyword]==='爆发期'?'boom':'decline'}">${esc(satMap[h.keyword]||'稳定期')}</span></td><td><span class="tag ${h.efficiency_tag==='蓝海'?'blue-ocean':h.efficiency_tag==='红海'?'red-ocean':'medium'}">${esc(h.efficiency_tag||'适中')}</span></td></tr>`).join('');
  }

  // renderCategory
  function renderCategory(hw) {
    if (!chartingReady()) return;
    const m={}; hw.forEach(h=>{m[h.category]=(m[h.category]||0)+h.total;});
    const data=Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({name:n,value:v}));
    if (charts.category) { safeChartDispose(charts.category); charts.category = null; }
    charts.category=ChartManager.create(document.getElementById('chartCategory'));
    charts.category.setOption({color:PALETTE,tooltip:{trigger:'item',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:'{b}<br/>{c} ({d}%)'},legend:{type:'scroll',orient:'vertical',right:5,top:'center',textStyle:{color:'rgba(255,255,255,0.6)',fontSize:10}},series:[{type:'pie',radius:['38%','65%'],center:['38%','50%'],data,label:{color:'rgba(255,255,255,0.6)',fontSize:10,formatter:'{d}%'},itemStyle:{borderColor:'rgba(10,10,18,0.6)',borderWidth:2},animationDuration:1200}]});
  }

  // renderRanking
  function renderRanking(hw) {
    if (!chartingReady()) return;
    const sorted=[...hw].sort((a,b)=>b.total-a.total).slice(0,15);
    if (charts.ranking) { safeChartDispose(charts.ranking); charts.ranking = null; }
    charts.ranking=ChartManager.create(document.getElementById('chartRanking'));
    charts.ranking.setOption({color:PALETTE,grid:{left:90,right:50,top:10,bottom:20},xAxis:{type:'value',axisLabel:{color:AXIS_COLOR,formatter:v=>v>=10000?(v/10000).toFixed(0)+'万':v},splitLine:{lineStyle:{color:SPLIT_COLOR}}},yAxis:{type:'category',data:sorted.map(d=>d.keyword).reverse(),axisLabel:{color:'rgba(255,255,255,0.7)',fontSize:11},axisLine:{lineStyle:{color:AXIS_LINE}}},series:[{type:'bar',data:sorted.map(d=>d.total).reverse(),itemStyle:{color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#0A84FF'},{offset:1,color:'#BF5AF2'}]),borderRadius:[0,4,4,0]},label:{show:true,position:'right',formatter:p=>p.value>=10000?(p.value/10000).toFixed(1)+'万':p.value,fontSize:10,color:'rgba(255,255,255,0.6)'},animationDuration:1200,animationEasing:'cubicOut'}],tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:p=>`${p[0].name}<br/>作品总数 ${p[0].value.toLocaleString()}`}});
  }

  // renderHistory
  function renderHistory(hw) {
    if (!chartingReady()) return;
    const hist = DATA.historical_trend || [];
    if (charts.hist) safeChartDispose(charts.hist);
    charts.hist = ChartManager.create(document.getElementById('chartHistory'));
    if (hist.length < 2) {
      charts.hist.setOption({title:{text:'数据积累中，跑满 2 天后显示趋势曲线',left:'center',top:'center',textStyle:{color:AXIS_COLOR,fontSize:13,fontWeight:'normal'}}});
      return;
    }
    // 合并每天的重复关键词（双平台未合并问题）
    const mergedHist = hist.map(h => {
      const map = {};
      h.hotwords.forEach(x => {
        if (map[x.keyword]) map[x.keyword] += x.total;
        else map[x.keyword] = x.total;
      });
      return { date: h.date, hotwords: Object.keys(map).map(k => ({keyword:k, total:map[k]})) };
    });
    const dates = mergedHist.map(h => h.date.slice(5));
    // 收集所有出现过的关键词，计算波动率（排除超大词AI避免压缩Y轴）
    const kwSet = new Set();
    mergedHist.forEach(h => h.hotwords.forEach(x => kwSet.add(x.keyword)));
    const kwVolatility = [];
    kwSet.forEach(kw => {
      if (cfg('exclude_keywords', ['AI']).includes(kw)) return; // 排除超大词
      const vals = mergedHist.map(h => {
        const f = h.hotwords.find(x => x.keyword === kw);
        return f ? f.total : null;
      }).filter(v => v !== null);
      if (vals.length < 2) return;
      const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
      if (avg < 10) return; // 排除过小词
      const variance = vals.reduce((s,v) => s + Math.pow(v-avg,2), 0) / vals.length;
      const cv = Math.sqrt(variance) / avg; // 变异系数
      kwVolatility.push({ kw, cv, avg, vals });
    });
    // 按波动率排序取TOP5，同时确保至少有数据
    kwVolatility.sort((a,b) => b.cv - a.cv);
    let topKws = kwVolatility.slice(0,5).map(x => x.kw);
    // 如果波动率不足5个，补充当前热门词
    if (topKws.length < 5) {
      const currentTop = [...hw].sort((a,b) => b.total-a.total).map(h => h.keyword).filter(k => !cfg('exclude_keywords', ['AI']).includes(k) && !topKws.includes(k));
      topKws = topKws.concat(currentTop).slice(0,5);
    }
    const series = topKws.map((kw,i) => {
      const vals = mergedHist.map(h => {
        const f = h.hotwords.find(x => x.keyword === kw);
        return f ? f.total : null;
      });
      return {
        name: kw, type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        data: vals,
        lineStyle: { width: 2 }, itemStyle: { color: PALETTE[i % PALETTE.length] },
        connectNulls: true,
      };
    });
    charts.hist.setOption({
      color: PALETTE,
      tooltip: { trigger: 'axis', backgroundColor: TOOLTIP_BG, borderColor: TOOLTIP_BORDER, textStyle: { color: TOOLTIP_TEXT } },
      legend: { data: topKws, textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 }, top: 0 },
      grid: { left: 60, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: dates, axisLabel: { color: AXIS_COLOR }, axisLine: { lineStyle: { color: AXIS_LINE } } },
      yAxis: { type: 'value', axisLabel: { color: AXIS_COLOR, formatter: v => v >= 10000 ? (v/10000).toFixed(0) + '万' : v }, splitLine: { lineStyle: { color: SPLIT_COLOR } } },
      series
    });
  }

  // showKeywordTrend
  function showKeywordTrend(keyword) {
    const trends = DATA.keyword_trends || {};
    const t = trends[keyword];
    const modal = document.getElementById('trendModal');
    document.getElementById('trendModalTitle').textContent = keyword + ' · 热度趋势';
    if (!t || !t.data || t.data.length < 2) {
      document.getElementById('trendModalBody').innerHTML = '<p style="color:var(--text-secondary)">历史数据不足，需积累更多天数据后显示趋势曲线。</p>';
    } else {
      const maxVal = Math.max(...t.data.map(d=>d.total), 1);
      let bars = '<div style="display:flex;align-items:flex-end;gap:6px;height:160px;margin-top:12px">';
      t.data.forEach(d => {
        const h = Math.round(d.total/maxVal*100);
        const dir = t.direction==='up' ? '#4ade80' : t.direction==='down' ? '#f87171' : '#facc15';
        bars += '<div style="flex:1;text-align:center"><div style="height:'+h+'%;background:linear-gradient(180deg,'+dir+','+dir+'66);border-radius:4px 4px 0 0;min-height:4px" title="'+d.date+': '+d.total.toLocaleString()+'"></div><div style="font-size:10px;color:var(--text-secondary);margin-top:4px">'+d.date.slice(5)+'</div></div>';
      });
      bars += '</div>';
      const growthColor = t.growth>0 ? '#4ade80' : t.growth<0 ? '#f87171' : 'var(--text-secondary)';
      bars += '<div style="margin-top:12px;font-size:14px">周期变化：<b style="color:'+growthColor+'">'+(t.growth>0?'+':'')+t.growth+'%</b> · '+ (t.direction==='up'?'上升期':t.direction==='down'?'衰退期':'平台期') +'</div>';
      document.getElementById('trendModalBody').innerHTML = bars;
    }
    modal.classList.add('active');
  }

  // filteredHotwords
  function filteredHotwords() { const p = filterByPlatform(DATA.hotwords||[]); return currentCategory==='all' ? p : p.filter(h=>h.category===currentCategory); }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "hotwords",
      requiredFields: ['hotwords'],
      render: function(data) {
        try { renderHotwordTable(data); renderCategory(data); renderRanking(data); renderHistory(data); } catch(e) { console.error("[hotwords]", e); }
      }
    });
  }
  window.renderHotwordTable = renderHotwordTable;
  window.renderCategory = renderCategory;
  window.renderRanking = renderRanking;
  window.renderHistory = renderHistory;
  window.showKeywordTrend = showKeywordTrend;
  window.filteredHotwords = filteredHotwords;
})();


/* ===== modules/works.js ===== */
/**
 * modules/works.js
 * 函数: renderWorksTable, renderSmallViral, renderAuthors, renderCompetitorWorks, renderFormatDist, filteredWorks
 * 依赖: ['works']
 */
(function() {
  'use strict';

  // renderWorksTable
  function renderWorksTable(works) {
    function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
    const sorted=[...works].sort((a,b)=>((b.likes||b.likeCount||0))-((a.likes||a.likeCount||0))).slice(0,20);
    document.querySelector('#worksTable tbody').innerHTML=sorted.map((w,i)=>`
      <tr><td>${i+1}</td><td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><button type="button" class="work-link v83-work-link" data-v83-work-id="${esc(window.ContentAIAdapter?ContentAIAdapter._test.workIdentity(w):(w.workId||w.sourceId||''))}" title="${esc(w.title||'')}">${esc(w.title||'无标题')}</button></td><td>${esc(w.accountName||'')}</td><td>${(w.followerCount||0).toLocaleString()}</td><td class="like-num">${(w.likeCount||0).toLocaleString()}</td><td class="collect-num">${(w.collectCount||0).toLocaleString()}</td><td class="share-num">${(w.shareCount||0).toLocaleString()}</td><td>${esc(w._keyword||'')}</td><td><span class="tag medium">${classifyHook(w.title||'')}</span></td></tr>`).join('');
  }

  // renderSmallViral
  function renderSmallViral(works) {
    const list = DATA.small_account_viral || [];
    const el = document.getElementById('smallViral');
    if (!list.length) { el.innerHTML='<div class="empty-state">暂无小账号爆款数据</div>'; return; }
    el.innerHTML = list.slice(0,6).map(w=>`
      <div class="small-item">
        <div class="si-info">
          <div class="si-title"><a href="${w.workUrl||'#'}" target="_blank" class="work-link">${(w.title||'无标题').slice(0,22)}</a></div>
          <div class="si-meta">${w.accountName||''} · 粉丝${(w.followerCount/10000).toFixed(1)}万 · ${w._keyword||''}</div>
        </div>
        <div class="si-likes">${(w.likeCount/10000).toFixed(1)}万</div>
      </div>`).join('');
  }

  // renderAuthors
  function renderAuthors(works) {
    const m={}; works.forEach(w=>{
      const n=w.accountName||'未知';
      if(!m[n])m[n]={name:n,followers:w.followerCount||0,likes:0,count:0,max:0,titles:[],keywords:{},platforms:{},accountType:w.accountType||'',formats:{},commentKw:{}};
      m[n].likes+=(w.likeCount||0);
      m[n].count++;
      const plat = w.platform||'dy';
      m[n].platforms[plat]=(m[n].platforms[plat]||0)+1;
      if(w.accountType) m[n].accountType=w.accountType;
      if((w.likeCount||0)>m[n].max)m[n].max=w.likeCount||0;
      if(w.title)m[n].titles.push(w.title);
      // 评论关键词
      if(w.commentTopKeywords && typeof w.commentTopKeywords === 'object') {
        Object.entries(w.commentTopKeywords).forEach(([k,v])=>{ m[n].commentKw[k]=(m[n].commentKw[k]||0)+(v||0); });
      }
    });
    // 提取内容主题关键词
    const themeKeywords = cfg('works.theme_keywords', ['可灵','即梦','绘画','视频','数字人','工作流','Agent','提示词','教程','实测','对比','免费','神器','效率','自动化','Sora','Midjourney','ComfyUI','Dify','Coze','豆包','GPT','Claude','剪映','PPT','电商','带货','变现','副业','编程','代码','写作','翻译','配音','音乐','图片','头像','壁纸','表情包','游戏','动漫','影视','解说','测评','盘点','干货','避坑','新手','入门','进阶','高阶','开源','GitHub','模型','大模型','LLM','RAG','微调','训练']);
    // 内容形式标签
    const formatKeywords = {'教程':['教程','手把手','入门','教学','怎么','如何','步骤'],'实测':['实测','体验','测试','对比','测评','横评'],'盘点':['盘点','排行','TOP','合集','汇总','清单'],'干货':['干货','技巧','方法','攻略','指南','避坑'],'资讯':['最新','发布','上线','更新','新闻','快讯'],'变现':['变现','赚钱','副业','带货','收入','盈利']};
    Object.values(m).forEach(a=>{
      a.titles.forEach(t=>{
        const tl = t.toLowerCase();
        themeKeywords.forEach(k=>{ if(tl.includes(k.toLowerCase()))a.keywords[k]=(a.keywords[k]||0)+1; });
        Object.entries(formatKeywords).forEach(([fmt, kws])=>{
          if(kws.some(k=>tl.includes(k))) a.formats[fmt]=(a.formats[fmt]||0)+1;
        });
      });
    });
    const top=Object.values(m).sort((a,b)=>b.likes-a.likes).slice(0,10);
    document.getElementById('authorList').innerHTML=top.map((a,i)=>{
      const avg=Math.round(a.likes/a.count);
      const themes=Object.entries(a.keywords).sort((x,y)=>y[1]-x[1]).slice(0,4).map(k=>k[0]);
      const formats=Object.entries(a.formats).sort((x,y)=>y[1]-x[1]).slice(0,2).map(f=>f[0]);
      const platDy = a.platforms['dy']||0;
      const platXhs = a.platforms['xhs']||0;
      const platLabel = platDy>0 && platXhs>0 ? '双平台' : platDy>0 ? '抖音' : '小红书';
      const platColor = platDy>0 && platXhs>0 ? '#a78bfa' : platDy>0 ? '#60a5fa' : '#f472b6';
      const learnNote = avg > 50000 ? '高均赞：内容质量驱动，值得拆解爆款结构' : a.count > 10 ? '高频更新：量产策略，可学习选题节奏' : '单条爆款：钩子+选题精准，可复用其标题公式';
      const themeTags = themes.length ? themes.map(t=>'<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(139,92,246,0.15);color:#a78bfa;">'+t+'</span>').join('') : '<span style="font-size:10px;color:var(--text-tertiary);">综合AI内容</span>';
      const formatTags = formats.length ? formats.map(f=>'<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(52,211,153,0.15);color:#34d399;">'+f+'</span>').join('') : '';
      return `
      <div class="author-item" style="flex-direction:column;align-items:stretch;gap:6px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="author-rank ${i<3?'r'+(i+1):'other'}">${i+1}</div>
          <div class="author-info" style="flex:1;">
            <div class="author-name">${a.name}
              <span style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(251,191,36,0.15);color:#fbbf24;margin-left:6px;">${a.accountType||'未分类'}</span>
              <span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${platColor}22;color:${platColor};margin-left:4px;">${platLabel}</span>
            </div>
            <div class="author-followers">粉丝${(a.followers/10000).toFixed(1)}万 · ${a.count}条作品 · 均赞${(avg/10000).toFixed(1)}万</div>
          </div>
          <div class="author-likes">总赞${(a.likes/10000).toFixed(1)}万<div style="font-size:10px;opacity:.6;margin-top:2px;">最高${(a.max/10000).toFixed(1)}万</div></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;padding-left:36px;align-items:center;">
          <span style="font-size:10px;color:var(--text-tertiary);">内容标签：</span>${themeTags}
        </div>
        ${formatTags ? '<div style="display:flex;flex-wrap:wrap;gap:4px;padding-left:36px;align-items:center;"><span style="font-size:10px;color:var(--text-tertiary);">内容形式：</span>'+formatTags+'</div>' : ''}
        <div style="font-size:10px;color:#34d399;padding-left:36px;">💡 ${learnNote}</div>
      </div>`;
    }).join('');
  }

  // renderCompetitorWorks
  function renderCompetitorWorks() {
    var works = DATA.works || [];
    if (!works.length) return;
    // 按账号分组，取每个账号最新的1-2条
    var byAuthor = {};
    works.forEach(function(w) {
      var name = w.accountName || '未知';
      if (!byAuthor[name]) byAuthor[name] = [];
      byAuthor[name].push(w);
    });
    // 按总点赞排序取top5账号
    var authors = Object.entries(byAuthor).map(function(entry) {
      return { name: entry[0], works: entry[1], totalLikes: entry[1].reduce(function(s,w){return s+(w.likeCount||0);},0) };
    }).sort(function(a,b){return b.totalLikes-a.totalLikes;}).slice(0,5);

    var html = '<div style="margin-top:12px;">';
    html += '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;">📡 竞品最新作品（来自搜索数据）</div>';
    authors.forEach(function(a) {
      var topWorks = a.works.sort(function(x,y){return (y.likeCount||0)-(x.likeCount||0);}).slice(0,2);
      topWorks.forEach(function(w) {
        var title = (w.title || '无标题').slice(0,40);
        var likes = (w.likeCount||0).toLocaleString();
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">';
        html += '<div style="flex:1;min-width:0;"><div style="font-size:11px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + title + '</div>';
        html += '<div style="font-size:10px;color:var(--text-tertiary);">' + a.name + '</div></div>';
        html += '<div style="font-size:11px;color:#f87171;margin-left:8px;">❤' + likes + '</div>';
        html += '</div>';
      });
    });
    html += '</div>';
    var el = document.getElementById('competitorWorks');
    if (el) el.innerHTML = html;
  }

  // renderFormatDist
  function renderFormatDist() {
    const container = document.getElementById('formatBars');
    if (!container) return;
    const formats = DATA.content_formats_dist || [];
    if (!formats.length) { container.innerHTML = '<div class="empty-state">暂无数据</div>'; return; }
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#6b7280'];
    container.innerHTML = formats.map(function(f, i) {
      return '<div class="format-bar-row">' +
        '<span class="format-bar-label">' + f.format + '</span>' +
        '<div class="format-bar-track"><div class="format-bar-fill" style="width:' + Math.min(f.proportion * 2, 100) + '%;background:' + colors[i % colors.length] + '"></div></div>' +
        '<span class="format-bar-val">' + f.count + '条 · ' + f.proportion + '% · 均赞' + f.avg_likes.toLocaleString() + '</span>' +
        '</div>';
    }).join('');
  }

  // filteredWorks
  function filteredWorks() {
    const p = filterByPlatform(DATA.works||[]);
    if (currentCategory==='all') return p;
    const kws = new Set(filteredHotwords().map(h=>h.keyword));
    return p.filter(w=>kws.has(w._keyword));
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "works",
      requiredFields: ['works'],
      render: function(data) {
        try { renderWorksTable(data); renderSmallViral(data); renderAuthors(data); renderCompetitorWorks(data); renderFormatDist(data); } catch(e) { console.error("[works]", e); }
      }
    });
  }
  window.renderWorksTable = renderWorksTable;
  window.renderSmallViral = renderSmallViral;
  window.renderAuthors = renderAuthors;
  window.renderCompetitorWorks = renderCompetitorWorks;
  window.renderFormatDist = renderFormatDist;
  window.filteredWorks = filteredWorks;
})();


/* ===== modules/hotContent.js ===== */
(function() {
  'use strict';

  var state = { keyword:'', work:null, analysis:null, scripts:[], sort:'engagement' };

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function number(value) { var n=Number(value); return isFinite(n) ? n : 0; }
  function fmt(value) { return number(value).toLocaleString(); }
  function id(work) { return ContentAIAdapter._test.workIdentity(work); }
  function metric(work, name, alias) { return number(work[name] != null ? work[name] : work[alias]); }
  function engagement(work) { return metric(work,'likes','likeCount') + metric(work,'comments','commentCount')*3 + metric(work,'collects','collectCount')*2 + metric(work,'shares','shareCount')*4; }

  function ensureDrawer() {
    var drawer=document.getElementById('v83ContentDrawer');
    if (drawer) return drawer;
    drawer=document.createElement('aside'); drawer.id='v83ContentDrawer'; drawer.className='v82-drawer v83-content-drawer';
    drawer.innerHTML='<div class="v82-drawer-backdrop" data-v83-action="close"></div><div class="v82-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="v83DrawerTitle"><header><div><span class="v82-drawer-kicker" id="v83DrawerKicker">热门内容</span><h2 id="v83DrawerTitle">内容详情</h2></div><button type="button" class="v82-close" data-v83-action="close" aria-label="关闭">×</button></header><div class="v82-drawer-body" id="v83DrawerBody"></div></div>';
    document.body.appendChild(drawer); return drawer;
  }
  function open(kicker,title,html) { var d=ensureDrawer(); d.querySelector('#v83DrawerKicker').textContent=kicker; d.querySelector('#v83DrawerTitle').textContent=title; d.querySelector('#v83DrawerBody').innerHTML=html; d.classList.add('is-open'); document.body.classList.add('v83-drawer-open'); }
  function close() { if(window.ContentAIAdapter)ContentAIAdapter.abortAll(); var d=document.getElementById('v83ContentDrawer'); if(d)d.classList.remove('is-open'); document.body.classList.remove('v83-drawer-open'); state.work=null; state.analysis=null; state.scripts=[]; }

  function currentWorks() { return Array.isArray(window.DATA && DATA.works) ? DATA.works : []; }
  function worksFor(keyword) { return currentWorks().filter(function(w){ return w._keyword===keyword || (!w._keyword && String(w.title||'').indexOf(keyword)>=0); }); }
  function sortWorks(list) {
    var key=state.sort;
    return list.slice().sort(function(a,b){
      if(key==='newest') return String(b.publishTime||'').localeCompare(String(a.publishTime||''));
      if(key==='likes') return metric(b,'likes','likeCount')-metric(a,'likes','likeCount');
      if(key==='comments') return metric(b,'comments','commentCount')-metric(a,'comments','commentCount');
      if(key==='favorites') return metric(b,'collects','collectCount')-metric(a,'collects','collectCount');
      return engagement(b)-engagement(a);
    });
  }
  function metricTags(work) {
    var values=[['赞',metric(work,'likes','likeCount')],['评',metric(work,'comments','commentCount')],['藏',metric(work,'collects','collectCount')],['转',metric(work,'shares','shareCount')]];
    return values.filter(function(x){return x[1]>0;}).map(function(x){return '<span>'+x[0]+' '+fmt(x[1])+'</span>';}).join('');
  }
  function renderList(keyword) {
    state.keyword=keyword; var list=sortWorks(worksFor(keyword));
    var options=[['engagement','综合互动'],['likes','点赞'],['comments','评论'],['favorites','收藏'],['newest','最新']].map(function(x){return '<option value="'+x[0]+'"'+(state.sort===x[0]?' selected':'')+'>'+x[1]+'</option>';}).join('');
    var rows=list.map(function(w){return '<article class="v83-work-card"><button type="button" data-v83-action="detail" data-work-id="'+esc(id(w))+'"><strong>'+esc(w.title||'无标题')+'</strong><span>'+esc(w.platform||'未知平台')+(w.publishTime?' · '+esc(w.publishTime):'')+'</span><span class="v83-metrics">'+metricTags(w)+'</span><small>engagementScore '+fmt(engagement(w))+'</small></button></article>';}).join('');
    open('Hot Topic → Works',keyword,'<div class="v83-toolbar"><label>排序<select data-v83-action="sort">'+options+'</select></label></div><p class="v83-formula">engagementScore = 点赞 + 评论×3 + 收藏×2 + 分享×4，仅用于当前列表排序。</p>'+(rows||'<div class="v82-empty">当前行业的该热点暂无关联作品。</div>'));
  }
  function findWork(workId) { return currentWorks().find(function(w){return id(w)===workId;}) || null; }
  function originalContent(work) {
    var text=work.transcript||work.caption||'';
    return text ? '<p class="v83-original-text">'+esc(text)+'</p>' : '<div class="v83-warning">当前仅采集到标题与互动指标，信息不足，无法完整分析正文内容。</div>';
  }
  function renderDetail(work) {
    state.work=work; state.analysis=ContentAIAdapter.getCachedAnalysis(work);
    var url=work.url||work.workUrl||'';
    var meta=[work.platform,work.author||work.accountName,work.publishTime].filter(Boolean).map(esc).join(' · ');
    var analysis=state.analysis ? renderAnalysis(state.analysis,true) : '<div class="v83-ai-empty"><p>尚未进行 AI 拆解。拆解只基于上方真实字段，缺失正文时会明确限制。</p><button type="button" class="v83-primary" data-v83-action="analyze">开始 AI 拆解</button></div>';
    open('Content Detail',work.title||'无标题','<section class="v83-section"><h3>【原始内容】</h3><p class="v83-meta">'+meta+'</p><div class="v83-metrics">'+metricTags(work)+'</div>'+originalContent(work)+(url?'<a class="v83-source" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">查看原始内容</a>':'<span class="v83-muted">原始链接未采集</span>')+'</section><section class="v83-section" id="v83Analysis"><h3>【AI 拆解】</h3>'+analysis+'</section>');
  }
  function renderAnalysis(a,cached) {
    var rows=[['主题',a.topic],['开头策略',a.hook],['内容角度',a.angle],['关键要点',(a.keyPoints||[]).join('；')],['内容结构',a.structure],['互动原因',(a.interactionReasons||[]).join('；')],['可借鉴模式',a.reusablePattern],['分析限制',a.limitations]];
    return '<div class="v83-analysis">'+(cached?'<span class="v83-cache">已缓存</span>':'')+rows.map(function(x){return '<div><strong>'+x[0]+'</strong><p>'+esc(x[1])+'</p></div>';}).join('')+'<button type="button" class="v83-primary" data-v83-action="script-settings">生成原创口播</button></div>';
  }
  function providerState(error) {
    var message=error&&error.message?error.message:'模型连接失败，请检查文字模型配置。';
    return '<div class="v83-provider-state"><strong>'+esc(message)+'</strong><p>请先配置你自己的文字模型服务。配置属于用户级设置，切换行业后仍然有效。</p><button type="button" data-v83-action="go-settings">前往设置</button></div>';
  }
  function analyze() {
    var host=document.getElementById('v83Analysis'); if(!host||!state.work)return;
    host.innerHTML='<h3>【AI 拆解】</h3><div class="v83-loading">正在基于真实内容字段拆解…</div>';
    ContentAIAdapter.analyzeContent(state.work).then(function(result){state.analysis=result.analysis; host.innerHTML='<h3>【AI 拆解】</h3>'+renderAnalysis(result.analysis,result.cached);}).catch(function(e){if(e&&e.code==='STALE_RESPONSE')return;host.innerHTML='<h3>【AI 拆解】</h3>'+providerState(e);});
  }
  function renderSettings() {
    open('Script Generator','生成原创口播','<section class="v83-section"><p class="v83-back"><button type="button" data-v83-action="back-detail">返回内容详情</button></p><div class="v83-settings"><label>时长<select id="v83Duration"><option value="30">30 秒</option><option value="60" selected>60 秒</option><option value="90">90 秒</option></select></label><label>平台<select id="v83Platform"><option value="douyin">抖音</option><option value="xiaohongshu">小红书</option><option value="wechat-video">微信视频号</option></select></label><label>语气<select id="v83Tone"><option value="natural">自然</option><option value="professional">专业</option><option value="opinion">观点鲜明</option><option value="light">轻松</option></select></label><label class="v83-full">我的观点（可选）<textarea id="v83UserInput" rows="3" placeholder="补充你自己的经验、立场或案例"></textarea></label><button type="button" class="v83-primary" data-v83-action="generate">生成 3 个原创角度</button></div><div id="v83GeneratorResult"></div></section>');
  }
  function scriptText(s) { return ['【角度】'+s.angle,'【标题】'+s.title,'【封面标题】'+s.coverTitle,'【开头】'+s.hook,'【完整口播】\n'+s.body,'【行动引导】'+s.cta,'【标签】'+s.tags,'【预计时长】'+s.estimatedDuration].join('\n\n'); }
  function renderScripts(scripts) {
    return '<div class="v83-script-list">'+scripts.map(function(s,i){return '<article class="v83-script"><header><strong>方案 '+(i+1)+'</strong><span>'+esc(s.estimatedDuration)+'</span></header><textarea rows="18" data-script-index="'+i+'">'+esc(scriptText(s))+'</textarea><div class="v83-quick">'+[['new-opening','换开头'],['colloquial','更口语'],['professional','更专业'],['shorter','缩短'],['expand','扩写'],['different-angle','换角度'],['regenerate','重新生成']].map(function(x){return '<button type="button" data-v83-action="refine" data-refine="'+x[0]+'" data-script-index="'+i+'">'+x[1]+'</button>';}).join('')+'</div></article>';}).join('')+'</div>';
  }
  function settings() { return {duration:document.getElementById('v83Duration').value,platform:document.getElementById('v83Platform').value,tone:document.getElementById('v83Tone').value,userInput:document.getElementById('v83UserInput').value}; }
  function generate(extra) {
    var host=document.getElementById('v83GeneratorResult'); if(!host)return;
    var opts=settings(); Object.keys(extra||{}).forEach(function(k){opts[k]=extra[k];}); opts.work=state.work; opts.analysis=state.analysis;
    host.innerHTML='<div class="v83-loading">正在生成 3 个原创角度…</div>';
    ContentAIAdapter.generateScript(opts).then(function(result){
      if(extra&&extra.targetIndex!=null){state.scripts[extra.targetIndex]=result.variants[0];}
      else state.scripts=result.variants;
      host.innerHTML=renderScripts(state.scripts);
    }).catch(function(e){if(e&&e.code==='STALE_RESPONSE')return;host.innerHTML=providerState(e);});
  }

  document.addEventListener('click',function(event){
    var hot=event.target.closest&&event.target.closest('[data-v83-hotword]'); if(hot){renderList(hot.getAttribute('data-v83-hotword'));return;}
    var tableWork=event.target.closest&&event.target.closest('[data-v83-work-id]'); if(tableWork){var work=findWork(tableWork.getAttribute('data-v83-work-id')); if(work)renderDetail(work);return;}
    var el=event.target.closest&&event.target.closest('[data-v83-action]'); if(!el)return; var action=el.getAttribute('data-v83-action');
    if(action==='close')close(); else if(action==='detail'){var w=findWork(el.getAttribute('data-work-id'));if(w)renderDetail(w);} else if(action==='analyze')analyze(); else if(action==='script-settings')renderSettings(); else if(action==='back-detail'&&state.work)renderDetail(state.work); else if(action==='generate')generate();
    else if(action==='go-settings'){close();if(window.switchPage)window.switchPage('settings');}
    else if(action==='refine'){var i=Number(el.getAttribute('data-script-index'));var area=document.querySelector('textarea[data-script-index="'+i+'"]');generate({action:el.getAttribute('data-refine'),currentScript:area?area.value:state.scripts[i],targetIndex:i});}
  });
  document.addEventListener('change',function(event){if(event.target&&event.target.getAttribute('data-v83-action')==='sort'){state.sort=event.target.value;renderList(state.keyword);}});
  document.addEventListener('keydown',function(event){if(event.key==='Escape')close();});
  window.V83HotContent={ openTopic:renderList, openWork:renderDetail, close:close, engagementScore:engagement };
})();
/* ===== modules/topics.js ===== */
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
        ${t.heat_phase ? '<span class="heat-phase-badge ' + (t.heat_phase_color || '') + '">' + t.heat_phase + '</span>' : ''}
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
        ${t.differentiated_angles && t.differentiated_angles.length ? '<div class="differentiated-angles"><div class="da-label">差异化角度</div>' + t.differentiated_angles.slice(0,3).map(function(a,ai){return '<div class="da-item"><span class="da-num">'+(ai+1)+'</span>'+a+'</div>'}).join('') + '</div>' : ''}
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
        <button class="copy-topic-btn" data-idx="${i}">📋 复制标题+钩子</button>
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
    const match = hw.category === cfg('name', 'AI') + '大类' ? 75 : 65;
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
      tags: cfgText('hashtags.core', '#AI #人工智能 #干货分享').replace('{cat}', '#' + cat.replace(/\s/g,'')),
      time: '12:00-13:00 或 19:00-21:00',
      format: cfg('content_format', '15-40秒口播+素材混剪'),
    };
    const xhs = {
      title_style: '干货体+emoji，标题控制在20字内',
      cover: '精致图文，3-5图轮播',
      tags: cfgText('hashtags.tool', '#AI工具 #效率神器 #新手必看').replace('{cat}', '#' + cat.replace(/\s/g,'')),
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
    const el=document.getElementById('commentScriptsContent');
    const scripts=DATA.comment_scripts||[];
    if(!el)return;
    if(!scripts.length){el.innerHTML='<div class="empty-state"><strong>暂无可生成话术</strong><br>需要真实评论文本后，才能根据用户需求生成针对性引流话术。<br>当前评论文本：0 条</div>';return;}
    el.innerHTML=scripts.map(function(s){return '<div class="comment-tpl"><div class="ct-type">'+s.type+'</div><div class="ct-text">'+s.text+'</div></div>';}).join('');
  }

  // CHECKLIST_ITEMS - 发布前自检清单
  const CHECKLIST_ITEMS = [
    { id: 'title', text: '确认选题标题和钩子文案（前3秒留人）' },
    { id: 'avatar', text: '准备数字人形象和口播文案（语速自然）' },
    { id: 'footage', text: cfg('tasks.collect_footage', '收集素材并完成混剪（60-90秒）') },
    { id: 'subtitle', text: '添加字幕、配乐和关键信息高亮' },
    { id: 'timing', text: '选择最佳发布时间（18:00-21:00）' },
    { id: 'comment', text: '准备评论区置顶引流话术和小号引导' },
  ];

  // renderChecklist
  function renderChecklist() {
    const saved = NS.get('publishChecklist', {}) || {};
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
    const saved = NS.get('publishChecklist', {}) || {};
    saved[id] = !saved[id];
    NS.set('publishChecklist', saved);
    renderChecklist();
  }

  // updateChecklistProgress
  function updateChecklistProgress() {
    const saved = NS.get('publishChecklist', {}) || {};
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
      cfg('tasks.collect_footage_short', '收集素材（截图/演示视频）'),
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


  // 一键复制标题+钩子
  function copyTopicText(idx) {
    try {
      var topics = filteredTopics();
      var t = topics[idx];
      if (!t) return;
      navigator.clipboard.writeText(t.title + '\n\n钩子：' + t.hook);
      var btn = document.querySelector('.copy-topic-btn[data-idx="'+idx+'"]');
      if (btn) {
        var orig = btn.textContent;
        btn.textContent = '✅ 已复制';
        btn.style.background = 'rgba(16,185,129,0.2)';
        TimerManager.setTimeout(function(){ btn.textContent = orig; btn.style.background = ''; }, 1500, 'button-feedback');
      }
    } catch(e) { console.warn('[copy]', e); }
  }
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.copy-topic-btn');
    if (btn) { e.stopPropagation(); copyTopicText(parseInt(btn.dataset.idx)); }
  });

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "topics",
      requiredFields: ['topics'],
      render: function(data) {
        [[renderTopics,data],[generateSchedule,data],[renderCommentScripts,data],[renderChecklist,null]].forEach(function(pair){
          try { pair[0](pair[1]); } catch(e) { console.error('[topics:'+pair[0].name+']', e); }
        });
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


/* ===== modules/techradar.js ===== */
(function(){
  'use strict';
  var loadVersion=0;
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function empty(title,text){return '<div class="empty-state"><strong>'+esc(title)+'</strong><br>'+esc(text)+'</div>';}
  function currentId(){var ctx=IndustryStore.getCurrent();return ctx&&ctx.id;}
  function repoBase(item,badge){var tags=(item.topics||[]).slice(0,4).map(function(tag){return '<span class="match-kw">'+esc(tag)+'</span>';}).join('');return '<article class="tech-card"><div class="tech-source">GitHub</div><div class="tech-header"><div class="tech-name">'+esc(item.name)+'</div>'+badge+'</div><div class="tech-desc">'+esc(item.descriptionZh||item.description||'暂无项目描述')+'</div><div class="tech-meta"><span>总 Stars '+item.stars.toLocaleString()+'</span><span>Forks '+item.forks.toLocaleString()+'</span><span>'+esc(item.language||'语言未知')+'</span><span>更新 '+esc(item.updatedAt.slice(0,10))+'</span></div>'+(tags?'<div class="tech-match">'+tags+'</div>':'')+'<a class="work-link" target="_blank" rel="noopener" href="'+esc(item.url)+'">查看 GitHub</a></article>';}
  function weeklyCard(item){var rate=item.growthRate7d==null?'':(' · '+(item.growthRate7d*100).toFixed(1)+'%');return repoBase(item,'<span class="tech-badge rise">+'+item.starsGained7d.toLocaleString()+' Stars / 7d'+rate+'</span>');}
  function emergingCard(item){return repoBase(item,'<span class="tech-badge blue">上线 '+item.ageDays+' 天 · 当前 '+item.stars.toLocaleString()+' Stars</span>');}
  function accumulatingCard(item){return repoBase(item,'<span class="tech-badge watch">近 7 天活跃 · 当前 '+item.stars.toLocaleString()+' Stars</span>');}
  function socialCard(item){var sample=item.sampleWorks>0?'<span>样本作品 '+item.sampleWorks.toLocaleString()+'</span>':'<span>当前样本 暂无采集作品</span>',delta=item.sampleWorksDelta==null?'':('<div class="tech-summary-note">样本作品变化 '+(item.sampleWorksDelta>=0?'+':'')+item.sampleWorksDelta.toLocaleString()+(item.engagementDeltaRate==null?'':' · 互动变化 '+(item.engagementDeltaRate*100).toFixed(1)+'%')+'</div>');return '<article class="tech-card"><div class="tech-source">RedFox 快照</div><div class="tech-header"><div class="tech-name">'+esc(item.name)+'</div><span class="tech-badge watch">'+esc(item.trend)+'</span></div><div class="tech-meta">'+sample+'<span>点赞 '+item.likes.toLocaleString()+'</span><span>收藏 '+item.collects.toLocaleString()+'</span><span>评论 '+item.comments.toLocaleString()+'</span><span>分享 '+item.shares.toLocaleString()+'</span></div>'+delta+'</article>';}
  function githubGroup(result){var weekly=result.weekly||[],emerging=result.emerging||[],accumulating=result.accumulating||[],weeklyHtml=weekly.length?weekly.map(weeklyCard).join(''):empty('历史数据积累中','持续采集 7 天后将显示真实周增长排名。'),emergingHtml=emerging.length?emerging.map(emergingCard).join(''):empty('暂无新兴项目','最近 7 天未发现符合当前 Radar Profile 的新仓库。'),accumulatingHtml=accumulating.length?accumulating.map(accumulatingCard).join(''):empty('暂无匹配项目','GitHub 当前未返回符合行业画像的活跃仓库。');return '<div class="radar-group"><div class="card-head"><span class="ch-bar"></span><span class="ch-title">GitHub 精准 Skill / 项目</span></div><div class="tech-summary-note">按当前行业画像检索近期活跃仓库；展示真实项目简介，周增长待快照积累后补充。</div><div class="tech-grid">'+accumulatingHtml+'</div></div><div class="radar-group"><div class="card-head"><span class="ch-bar"></span><span class="ch-title">本周 Star 增长最快</span></div><div class="tech-summary-note">'+esc(result.note)+'</div><div class="tech-grid">'+weeklyHtml+'</div></div><div class="radar-group"><div class="card-head"><span class="ch-bar"></span><span class="ch-title">新兴项目</span></div><div class="tech-summary-note">最近 7 天创建；展示当前 Stars 和上线天数，不标记为七天增长。</div><div class="tech-grid">'+emergingHtml+'</div></div>';}
  function standardGroup(result){return '<div class="radar-group"><div class="card-head"><span class="ch-bar"></span><span class="ch-title">'+esc(result.title)+'</span></div><div class="tech-summary-note">'+esc(result.note)+'</div><div class="tech-grid">'+(result.items.length?result.items.map(socialCard).join(''):empty('暂无数据','当前数据源暂未返回有效信号。'))+'</div></div>';}
  function renderResult(profile,results){var title=document.querySelector('[data-section="techradar"]'),summary=document.getElementById('techSummary'),grid=document.getElementById('techGrid'),total=results.reduce(function(sum,result){return sum+result.items.length;},0);if(title)title.textContent=profile.sources.github.enabled?'技术雷达':'行业雷达';if(!grid||!summary)return;summary.innerHTML='<div class="tech-summary-card"><div class="num">'+total+'</div><div class="label">当前真实信号</div></div><div class="tech-summary-card"><div class="label">GitHub 精准项目优先；行业热词作为辅助信号。</div></div>';if(!results.length){grid.innerHTML=empty('当前行业暂未形成足够趋势数据。','继续采集后，将根据 7 天变化自动生成雷达。');return;}results=results.slice().sort(function(a,b){return (a.kind==='github'?0:1)-(b.kind==='github'?0:1);});grid.innerHTML=results.map(function(result){return result.kind==='github'?githubGroup(result):standardGroup(result);}).join('');}
  function renderTechRadar(data){var profile=RadarProfileService.getCurrent(),grid=document.getElementById('techGrid'),summary=document.getElementById('techSummary'),version=++loadVersion,industryId=currentId(),jobs=[];if(profile.sources.social.enabled)jobs.push(RadarAdapters.social.load(profile,data||window.DASHBOARD_DATA||{}));if(profile.sources.github.enabled)jobs.push(RadarAdapters.github.load(profile));if(summary)summary.innerHTML='';if(grid)grid.innerHTML=empty('雷达数据加载中...','正在读取当前行业的数据源。');Promise.all(jobs).then(function(results){if(version!==loadVersion||industryId!==currentId())return;renderResult(profile,results);}).catch(function(error){if(version!==loadVersion||industryId!==currentId()||!grid)return;grid.innerHTML=empty('模块加载失败，请重试',error&&error.message?error.message:'雷达数据暂时不可用。');});}
  if(window.Module)Module.register({id:'techradar',render:function(data){renderTechRadar(data);}});
  window.renderTechRadar=renderTechRadar;
})();
/* ===== modules/breakdown.js ===== */
/**
 * modules/breakdown.js
 * 函数: renderBreakdowns, renderMatrix, renderFormulas, renderCollect, renderScatter, renderSaturation, renderCommentDemands, renderCommentKw, renderHook, renderDuration, renderPublishTime
 * 依赖: ['works', 'hot_breakdowns']
 */
(function() {
  'use strict';

  function chartingReady() {
    return !!(window.echarts && typeof window.echarts.init === 'function');
  }

  // renderBreakdowns
  function renderBreakdowns() {
    const list = DATA.hot_breakdowns || [];
    const el = document.getElementById('breakdownGrid');
    if (!list.length) { el.innerHTML='<div class="empty-state">暂无爆款拆解数据</div>'; return; }
    el.innerHTML = list.map((b,i)=>`
      <div class="breakdown-card">
        <div class="bd-header">
          <div class="bd-title">${i+1}. ${b.title}</div>
          <div style="display:flex;align-items:center;gap:6px;"><button class="fav-btn ${isFavorite(i) ? 'active' : ''}" onclick="toggleFavorite(${i})" title="收藏">${isFavorite(i) ? '⭐' : '☆'}</button><div class="bd-likes">${(b.likes/10000).toFixed(1)}万</div></div>
        </div>
        <div class="bd-row"><span class="bd-label">钩子</span><span class="bd-val">${b.hook}型</span></div>
        <div class="bd-row"><span class="bd-label">结构</span><span class="bd-val">${b.structure}</span></div>
        <div class="bd-row"><span class="bd-label">CTA</span><span class="bd-val">${b.cta}</span></div>
        ${b.target_persona ? `<div class="bd-row"><span class="bd-label">人群</span><span class="bd-val"><span style="color:#22d3ee;font-weight:600">${b.target_persona.name}</span> · ${b.target_persona.age} · ${(b.target_persona.needs||[]).slice(0,2).join(' / ')}</span></div>` : ''}
        <div class="bd-meta">
          <span>${b.author} · ${b.duration}</span>
          <span>${b.interaction} · <a href="${b.work_url||'#'}" target="_blank" class="work-link">原视频</a></span>
        </div>
      </div>`).join('');
  }

  // renderMatrix
  function renderMatrix() {
    const matrix = DATA.keyword_matrix || [];
    const el = document.getElementById('matrixGrid');
    if (!matrix.length) { el.innerHTML='<div class="empty-state">暂无矩阵数据</div>'; return; }
    el.innerHTML = matrix.map(m=>{
      const cls = m.level.includes('超热')?'super':m.level.includes('热门')?'hot':m.level.includes('上升')?'rise':'blue';
      return `<div class="matrix-cell ${cls}">
        <div class="mc-cat">${m.category}</div>
        <div class="mc-level">${m.level}</div>
        <div class="mc-stats">${m.count}关键词 · ${m.total.toLocaleString()}作品 · 最高赞${(m.max_like/10000).toFixed(1)}万</div>
        <div class="mc-kws">${m.keywords.join(' · ')}</div>
      </div>`;
    }).join('');
  }

  // renderFormulas
  function renderFormulas() {
    const list = DATA.title_formulas || [];
    const el = document.getElementById('formulaList');
    if (!list.length) { el.innerHTML='<div class="empty-state">暂无标题公式</div>'; return; }
    el.innerHTML = list.map(f=>`
      <div class="formula-item">
        <div class="f-name">${f.formula}</div>
        <div class="f-example">${f.example}</div>
        <div class="f-stats">命中 ${f.count} 条 · 平均点赞 ${f.avg_likes.toLocaleString()}</div>
      </div>`).join('');
  }

  // renderCommentSemantic
  function isRealCommentSource(data) {
    var source = String(data && (data.sourceType || data.source || (data.provenance && data.provenance.sourceType)) || '').toUpperCase();
    var count = Number(data && (data.commentTextCount != null ? data.commentTextCount : data.sampleSize) || 0);
    return count > 0 && (source === 'REAL' || source === 'DERIVED_REAL' || source === 'COMMENT_TEXT_DERIVED');
  }

  function hasRealCommentEvidence(meta) {
    if (isRealCommentSource(meta)) return true;
    return Array.isArray(DATA.comments) && DATA.comments.some(function(comment) {
      return !!String(comment && (comment.text || comment.content || comment.body || comment.comment) || '').trim();
    });
  }

  function renderCommentSemantic() {
    var el = document.getElementById('commentSemanticContent');
    if (!el) return;
    var data = DATA.comment_semantic || {};
    var themes = isRealCommentSource(data) ? (data.themes || []) : [];
    if (!themes.length) { el.innerHTML = '<div class="insight-empty"><strong>当前缺少评论正文</strong><span>暂无法可靠提取用户痛点、提问与讨论主题。</span></div>'; return; }
    var html = '<div class="insight-rows">';
    themes.forEach(function(t) {
      html += '<div class="insight-row"><div class="insight-row-copy"><span class="insight-row-name">' + t.name + '</span>' + (t.description ? '<span class="insight-row-desc">' + t.description + '</span>' : '') + '</div><span class="insight-count">' + Number(t.count || 0).toLocaleString() + '</span></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  // renderConversionSignals
  function renderConversionSignals() {
    var el = document.getElementById('conversionSignalList');
    if (!el) return;
    var meta = DATA.conversion_signal_meta || {};
    var signals = (DATA.conversion_signals || []).filter(function(s) { return isRealCommentSource({sourceType:s.sourceType || meta.sourceType, commentTextCount:s.commentTextCount != null ? s.commentTextCount : meta.commentTextCount, sampleSize:s.sampleSize != null ? s.sampleSize : meta.sampleSize}); });
    if (!signals.length) { el.innerHTML = '<div class="insight-empty"><strong>当前缺少评论正文</strong><span>暂无法识别购买、咨询与推荐意向。</span></div>'; return; }
    var html = '<div class="insight-rows">';
    signals.forEach(function(s) {
      var impact = s.impact || '低';
      var cls = impact === '高' ? 'high' : impact === '中' ? 'medium' : 'low';
      var count = s.evidenceCount != null ? s.evidenceCount : s.count;
      html += '<div class="insight-row"><div class="insight-row-copy"><span class="insight-row-name">' + s.signal + '</span>' + (s.desc ? '<span class="insight-row-desc">' + s.desc + '</span>' : '') + '</div><div class="insight-row-meta">' + (count != null ? '<span class="insight-count">' + Number(count).toLocaleString() + '</span>' : '') + '<span class="tag ' + cls + '">' + impact + '影响</span></div></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  // renderCollect
  function renderCollect(hw) {
    if (!chartingReady()) return;
    const sorted=[...hw].filter(h=>h.collect_rate>0).sort((a,b)=>b.collect_rate-a.collect_rate).slice(0,10);
    if (charts.collect) { safeChartDispose(charts.collect); charts.collect = null; }
    charts.collect=ChartManager.create(document.getElementById('chartCollect'));
    charts.collect.setOption({color:PALETTE,grid:{left:75,right:30,top:10,bottom:20},xAxis:{type:'value',axisLabel:{color:AXIS_COLOR,formatter:'{value}%'},splitLine:{lineStyle:{color:SPLIT_COLOR}}},yAxis:{type:'category',data:sorted.map(d=>d.keyword).reverse(),axisLabel:{color:'rgba(255,255,255,0.7)',fontSize:10},axisLine:{lineStyle:{color:AXIS_LINE}}},series:[{type:'bar',data:sorted.map(d=>d.collect_rate).reverse(),itemStyle:{color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#30D158'},{offset:1,color:'#64D2FF'}]),borderRadius:[0,4,4,0]},label:{show:true,position:'right',formatter:'{c}%',fontSize:10,color:'rgba(48,209,88,0.8)'},animationDuration:1000}],tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:'rgba(48,209,88,0.3)',textStyle:{color:TOOLTIP_TEXT}}});
  }

  // renderScatter
  function renderScatter(works) {
    if (!chartingReady()) return;
    const top=[...works].sort((a,b)=>(b.likeCount||0)-(a.likeCount||0)).slice(0,30);
    const data=top.map(w=>[w.likeCount||0,w.collectCount||0,w.title||'']);
    if (charts.scatter) { safeChartDispose(charts.scatter); charts.scatter = null; }
    charts.scatter=ChartManager.create(document.getElementById('chartScatter'));
    charts.scatter.setOption({color:PALETTE,grid:{left:50,right:15,top:15,bottom:30},xAxis:{name:'点赞',nameTextStyle:{color:AXIS_COLOR,fontSize:10},type:'value',axisLabel:{color:AXIS_COLOR,formatter:v=>v>=10000?(v/10000).toFixed(0)+'万':v},splitLine:{lineStyle:{color:SPLIT_COLOR}}},yAxis:{name:'收藏',nameTextStyle:{color:AXIS_COLOR,fontSize:10},type:'value',axisLabel:{color:AXIS_COLOR,formatter:v=>v>=10000?(v/10000).toFixed(0)+'万':v},splitLine:{lineStyle:{color:SPLIT_COLOR}}},series:[{type:'scatter',data,symbolSize:d=>Math.max(8,Math.min(28,Math.sqrt(d[0])/12)),itemStyle:{color:'rgba(10,132,255,0.5)',borderColor:'#64D2FF',borderWidth:1}}],tooltip:{backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:p=>`${(p.data[2]||'').slice(0,25)}<br/>点赞 ${p.data[0].toLocaleString()}<br/>收藏 ${p.data[1].toLocaleString()}`}});
  }

  // renderSaturation
  function renderSaturation(hw) {
    const sat = DATA.saturation || [];
    const filtered = currentCategory==='all' ? sat : sat.filter(s=>hw.some(h=>h.keyword===s.keyword));
    const el = document.getElementById('saturationList');
    if (!filtered.length) { el.innerHTML='<div class="empty-state">暂无饱和度数据</div>'; return; }
    // 合并重复关键词（双平台数据去重）
    const merged = {};
    filtered.forEach(s=>{
      if (!merged[s.keyword]) { merged[s.keyword] = {keyword:s.keyword, saturation:0, stage:s.stage}; }
      merged[s.keyword].saturation += (s.saturation || 0);
      const stageOrder = {'萌芽期':1,'上升期':2,'爆发期':3,'衰退期':4};
      if (stageOrder[s.stage] > stageOrder[merged[s.keyword].stage]) merged[s.keyword].stage = s.stage;
    });
    const mergedList = Object.values(merged);
    // 按饱和度升序（蓝海优先），取前12
    const sorted = mergedList.sort((a,b)=>a.saturation-b.saturation).slice(0,12);
    const maxSat = Math.max(...sorted.map(s=>s.saturation), 1);
    el.innerHTML = sorted.map(s=>{
      const pct = Math.max(2, Math.min(100, s.saturation/maxSat*100));
      const color = s.saturation<50?'#30D158':s.saturation<150?'#64D2FF':s.saturation<300?'#FF9F0A':'#FF453A';
      const satDisplay = s.saturation >= 10000 ? (s.saturation/10000).toFixed(1)+'万' : Math.round(s.saturation);
      return `<div class="sat-item">
        <div class="sat-name">${s.keyword}</div>
        <div class="sat-bar"><div class="sat-fill" style="width:${pct}%;background:${color};"></div></div>
        <div class="sat-val">${satDisplay}</div>
        <div class="sat-advice"><span class="tag ${s.stage==='萌芽期'?'sprout':s.stage==='上升期'?'rise':s.stage==='爆发期'?'boom':'decline'}">${s.stage}</span></div>
      </div>`;
    }).join('');
  }

  // renderCommentDemands
  function renderCommentDemands() {
    const d = DATA.comment_demands || {};
    const el = document.getElementById('commentDemands');
    const meta = DATA.comment_demands_meta || d;
    if (!hasRealCommentEvidence(meta)) { el.innerHTML = '<div class="empty-state">当前评论样本不足，暂无法分析需求。</div>'; return; }
    let html = '';
    if (d.questions && d.questions.length) {
      html += '<div class="demand-section"><div class="demand-label q">用户在问</div><div class="demand-tags">';
      html += d.questions.map(q=>`<span class="demand-tag">${q.demand}<span class="dc">${q.count}</span></span>`).join('');
      html += '</div></div>';
    }
    if (d.complaints && d.complaints.length) {
      html += '<div class="demand-section"><div class="demand-label c">用户在吐槽</div><div class="demand-tags">';
      html += d.complaints.map(q=>`<span class="demand-tag">${q.demand}<span class="dc">${q.count}</span></span>`).join('');
      html += '</div></div>';
    }
    if (d.needs && d.needs.length) {
      html += '<div class="demand-section"><div class="demand-label n">用户在求</div><div class="demand-tags">';
      html += d.needs.map(q=>`<span class="demand-tag">${q.demand}<span class="dc">${q.count}</span></span>`).join('');
      html += '</div></div>';
    }
    el.innerHTML = html || '<div class="empty-state">当前评论样本不足，暂无法分析需求。</div>';
  }

  // renderCommentKw
  function renderCommentKw(works) {
    const kws = DATA.comment_keywords || [];
    const el = document.getElementById('commentKw');
    const meta = DATA.comment_keywords_meta || {};
    if (!hasRealCommentEvidence(meta) || !kws.length) { el.innerHTML='<div class="empty-state">当前未采集到评论文本，暂无评论关键词数据。</div>'; return; }
    el.innerHTML = kws.slice(0,20).map((k,i)=>`<span class="kw-tag ${i<5?'hot':''}" style="font-size:${Math.max(11,16-i*0.4)}px;">${k.keyword} <span style="opacity:.5;font-size:10px;">${k.count}</span></span>`).join('');
  }

  // renderHook
  function renderHook(works) {
    if (!chartingReady()) return;
    const hs={}; works.forEach(w=>{const h=classifyHook(w.title||'');if(!hs[h])hs[h]={count:0,likes:0};hs[h].count++;hs[h].likes+=(w.likeCount||0);});
    const data=Object.entries(hs).map(([n,v])=>({name:n,value:Math.round(v.likes/v.count)}));
    if (charts.hook) { safeChartDispose(charts.hook); charts.hook = null; }
    charts.hook=ChartManager.create(document.getElementById('chartHook'));
    charts.hook.setOption({color:PALETTE,grid:{left:45,right:15,top:15,bottom:25},xAxis:{type:'category',data:data.map(d=>d.name),axisLabel:{color:'rgba(255,255,255,0.7)',fontSize:10},axisLine:{lineStyle:{color:AXIS_LINE}}},yAxis:{type:'value',axisLabel:{color:AXIS_COLOR},splitLine:{lineStyle:{color:SPLIT_COLOR}}},series:[{type:'bar',data:data.map(d=>d.value),itemStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#FF9F0A'},{offset:1,color:'#FF453A'}]),borderRadius:[4,4,0,0]},label:{show:true,position:'top',fontSize:10,color:'rgba(255,255,255,0.5)'},animationDuration:1000}],tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:p=>`${p[0].name}型<br/>平均点赞 ${p[0].value.toLocaleString()}`}});
  }

  // renderDuration
  function renderDuration(works) {
    if (!chartingReady()) return;
    const ranges = [
      { range: '0-15秒', min: 0, max: 15 },
      { range: '15-30秒', min: 15, max: 30 },
      { range: '30-60秒', min: 30, max: 60 },
      { range: '1-3分钟', min: 60, max: 180 },
      { range: '3分钟+', min: 180, max: Infinity },
    ];
    const counts = ranges.map(() => 0);
    const likes = ranges.map(() => 0);
    (works || []).forEach(w => {
      const durMs = w.duration || 0;
      if (durMs <= 0) return;
      const sec = durMs / 1000;
      for (let i = 0; i < ranges.length; i++) {
        if (sec >= ranges[i].min && sec < ranges[i].max) {
          counts[i]++;
          likes[i] += (w.likeCount || 0);
          break;
        }
      }
    });
    const dist = ranges.map((r, i) => ({
      range: r.range, count: counts[i],
      avg_likes: counts[i] > 0 ? Math.round(likes[i] / counts[i]) : 0
    }));
    if (charts.dur) safeChartDispose(charts.dur);
    charts.dur = ChartManager.create(document.getElementById('chartDuration'));
    charts.dur.setOption({color:PALETTE,grid:{left:45,right:15,top:15,bottom:25},xAxis:{type:'category',data:dist.map(d=>d.range),axisLabel:{color:AXIS_COLOR,fontSize:9,interval:0,rotate:15},axisLine:{lineStyle:{color:AXIS_LINE}}},yAxis:{type:'value',axisLabel:{color:AXIS_COLOR},splitLine:{lineStyle:{color:SPLIT_COLOR}}},series:[{type:'bar',data:dist.map(d=>({value:d.count,itemStyle:{color:d.avg_likes>5000?'#30D158':'#0A84FF'}})),label:{show:true,position:'top',fontSize:9,color:'rgba(255,255,255,0.5)',formatter:p=>`${p.value}条`},barWidth:'50%',animationDuration:1000}],tooltip:{trigger:'axis',backgroundColor:TOOLTIP_BG,borderColor:TOOLTIP_BORDER,textStyle:{color:TOOLTIP_TEXT},formatter:p=>{const d=dist[p[0].dataIndex];return `${d.range}<br/>作品数 ${d.count}<br/>平均点赞 ${d.avg_likes.toLocaleString()}`;}}});
  }

  // renderPublishTime
  function renderPublishTime(works) {
    if (!chartingReady()) return;
    // 从works实时计算发布时间分布
    const hourCount = new Array(24).fill(0);
    const hourLikes = new Array(24).fill(0);
    const hourViral = new Array(24).fill(0);
    (works || []).forEach(w => {
      const pt = w.publishTime;
      if (!pt) return;
      const m = pt.match(/ (\d{2}):/);
      if (!m) return;
      const h = parseInt(m[1]);
      hourCount[h]++;
      hourLikes[h] += (w.likeCount || 0);
      if ((w.likeCount || 0) >= 10000) hourViral[h]++;
    });
    const dist = hourCount.map((cnt, h) => ({
      hour: h,
      count: cnt,
      avg_likes: cnt > 0 ? Math.round(hourLikes[h] / cnt) : 0,
      viral_count: hourViral[h],
      viral_rate: cnt > 0 ? Math.round(hourViral[h] / cnt * 100) : 0
    }));
    if (charts.pt) { safeChartDispose(charts.pt); charts.pt = null; }
    charts.pt = ChartManager.create(document.getElementById('chartPublishTime'));
    charts.pt.setOption({
      color: PALETTE,
      grid: { left: 40, right: 15, top: 25, bottom: 25 },
      xAxis: {
        type: 'category',
        data: dist.map(d => d.hour + '时'),
        axisLabel: { color: AXIS_COLOR, fontSize: 9, interval: 2 },
        axisLine: { lineStyle: { color: AXIS_LINE } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: AXIS_COLOR },
        splitLine: { lineStyle: { color: SPLIT_COLOR } }
      },
      series: [{
        type: 'bar',
        data: dist.map(d => ({
          value: d.count,
          itemStyle: {
            color: d.viral_rate >= 10
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#FFD60A' }, { offset: 1, color: '#FF9F0A' }])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#0A84FF' }, { offset: 1, color: '#5E5CE6' }]),
            borderRadius: [4, 4, 0, 0]
          }
        })),
        animationDuration: 1000
      }],
      tooltip: {
        trigger: 'axis',
        backgroundColor: TOOLTIP_BG,
        borderColor: TOOLTIP_BORDER,
        textStyle: { color: TOOLTIP_TEXT },
        formatter: p => {
          const d = dist[p[0].dataIndex];
          return `${d.hour}时<br/>作品数 ${d.count}<br/>平均点赞 ${d.avg_likes.toLocaleString()}<br/>爆款数 ${d.viral_count}（${d.viral_rate}%）`;
        }
      }
    });
  }

  function renderCompletionRate() {
    var el=document.getElementById('completionRateChart'), list=DATA.completion_rate||[];
    if(!el)return;
    if(!list.length){el.innerHTML='<div class="empty-state">当前数据不包含真实完播率，暂无法分析不同时长的完播表现。</div>';return;}
    el.innerHTML=list.map(function(r){return '<div class="sat-item"><div class="sat-name">'+r.duration+'</div><div class="sat-bar"><div class="sat-fill" style="width:'+Math.max(0,Math.min(100,r.rate))+'%"></div></div><div class="sat-val">'+r.rate+'%</div></div>';}).join('');
  }

  function renderBestPostingCombo() {
    var el=document.getElementById('bestPostingComboContent'), combo=DATA.best_posting_combo;
    if(!el)return;
    if(!combo||!combo.time||!combo.platform||!combo.duration){el.innerHTML='<div class="empty-state">当前有效发布时间或时长样本不足，暂无法生成最佳发布组合。</div>';return;}
    el.innerHTML='<div class="cs-grid"><div class="cs-item"><span class="cs-name">最佳时段</span><span class="cs-count">'+combo.time+'</span></div><div class="cs-item"><span class="cs-name">平台</span><span class="cs-count">'+combo.platform+'</span></div><div class="cs-item"><span class="cs-name">时长</span><span class="cs-count">'+combo.duration+'</span></div></div>';
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "breakdown",
      requiredFields: ['works'],
      render: function(data) {
        var steps = [renderBreakdowns, renderMatrix, renderFormulas, renderCommentSemantic, renderConversionSignals, renderCompletionRate, renderBestPostingCombo, function(){renderCollect(DATA.hotwords);}, function(){renderScatter(data);}, function(){renderSaturation(DATA.hotwords);}, renderCommentDemands, function(){renderCommentKw(data);}, function(){renderHook(data);}, function(){renderDuration(data);}, function(){renderPublishTime(data);}];
        steps.forEach(function(fn){ try { fn(); } catch(e) { console.error("[bd]", e.message); } });
      }
    });
  }
  window.renderBreakdowns = renderBreakdowns;
  window.renderMatrix = renderMatrix;
  window.renderFormulas = renderFormulas;
  window.renderCollect = renderCollect;
  window.renderScatter = renderScatter;
  window.renderSaturation = renderSaturation;
  window.renderCommentDemands = renderCommentDemands;
  window.renderCommentKw = renderCommentKw;
  window.renderHook = renderHook;
  window.renderDuration = renderDuration;
  window.renderPublishTime = renderPublishTime;
  window.renderCommentSemantic = renderCommentSemantic;
  window.renderConversionSignals = renderConversionSignals;
  window.renderCompletionRate = renderCompletionRate;
  window.renderBestPostingCombo = renderBestPostingCombo;
})();


/* ===== modules/viralGenes.js ===== */
/**
 * modules/viralGenes.js
 * 函数: renderViralGenes
 * 依赖: ['viral_genes']
 */
(function() {
  'use strict';

  // renderViralGenes
  function renderViralGenes() {
    const genes = DATA.viral_genes;
    if (!genes) { document.getElementById('viralGenesContent').innerHTML='<p style="color:var(--text-secondary)">暂无数据</p>'; return; }
    let html = '<div class="gene-grid">';
    // 钩子分布
    const hooks = genes.hook_distribution || {};
    const maxHook = Math.max(...Object.values(hooks), 1);
    for (const [name, count] of Object.entries(hooks)) {
      const pct = Math.round(count/maxHook*100);
      html += '<div class="gene-card"><h4>'+name+'</h4><div class="gene-val">'+count+'<span style="font-size:12px;color:var(--text-secondary)"> 条</span></div><div class="gene-bar"><div class="gene-bar-fill" style="width:'+pct+'%"></div></div></div>';
    }
    html += '</div>';
    // 平均标题长度
    html += '<div style="margin-top:16px;font-size:13px;color:var(--text-secondary)">爆款平均标题长度：<b style="color:var(--text)">'+genes.avg_title_length+'</b> 字 | 样本：'+genes.sample_size+'条</div>';
    // 高频关键词
    const kws = genes.top_title_keywords || [];
    if (kws.length) {
      html += '<div class="kw-cloud">';
      kws.forEach(([kw, freq]) => { html += '<span>'+kw+' <small style="opacity:0.6">×'+freq+'</small></span>'; });
      html += '</div>';
    }
    // 结构示例
    const examples = genes.structure_examples || [];
    if (examples.length) {
      html += '<div style="margin-top:16px"><h4 style="color:var(--text-secondary);font-size:13px;margin-bottom:8px">爆款结构示例</h4>';
      examples.forEach(e => {
        html += '<div style="padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:6px;font-size:13px"><span class="tag medium" style="margin-right:8px">'+e.structure+'</span>'+e.title+' <span style="color:var(--text-secondary);float:right">'+(e.likes||0).toLocaleString()+'赞</span></div>';
      });
      html += '</div>';
    }
    document.getElementById('viralGenesContent').innerHTML = html;
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "viralGenes",
      requiredFields: ['viral_genes'],
      render: domainGuard("viralGenes", function(data) {
        try { renderViralGenes(data); } catch(e) { console.error("[viralGenes]", e); }
      })
    });
  }
  window.renderViralGenes = renderViralGenes;
})();


/* ===== modules/publishTime.js ===== */
/**
 * modules/publishTime.js
 * 函数: renderPublishTimeDetail
 * 依赖: ['publish_time_dist']
 */
(function() {
  'use strict';

  // renderPublishTimeDetail
  function renderPublishTimeDetail() {
    var works = DATA.works || [];
    if (!works.length) return;
    var hourData = {};
    for (var h = 0; h < 24; h++) {
      hourData[h] = { count: 0, totalLikes: 0, viralCount: 0, highLikeCount: 0 };
    }
    var platformHour = { douyin: {}, xiaohongshu: {} };
    for (var p in platformHour) {
      for (var h2 = 0; h2 < 24; h2++) platformHour[p][h2] = { count: 0, viralCount: 0, totalLikes: 0 };
    }

    works.forEach(function(w) {
      var pt = w.publishTime;
      if (!pt) return;
      var m = pt.match(/ (\d{2}):/);
      if (!m) return;
      var hour = parseInt(m[1]);
      var likes = w.likeCount || 0;
      var hd = hourData[hour];
      hd.count++;
      hd.totalLikes += likes;
      if (likes >= 10000) hd.viralCount++;
      if (likes >= 5000) hd.highLikeCount++;
      var plat = w.platform === 'xiaohongshu' ? 'xiaohongshu' : 'douyin';
      if (platformHour[plat]) {
        platformHour[plat][hour].count++;
        platformHour[plat][hour].totalLikes += likes;
        if (likes >= 10000) platformHour[plat][hour].viralCount++;
      }
    });

    // 计算爆款率，找出TOP3时段（样本量>=10）
    var hoursWithData = [];
    for (var h3 = 0; h3 < 24; h3++) {
      var d = hourData[h3];
      if (d.count >= 5) {
        var viralRate = d.viralCount / d.count * 100;
        var avgLikes = d.totalLikes / d.count;
        var score = viralRate * 0.5 + (d.highLikeCount / d.count * 100) * 0.3 + Math.min(avgLikes / 500, 100) * 0.2;
        hoursWithData.push({ hour: h3, count: d.count, avgLikes: avgLikes, viralRate: viralRate, score: score });
      }
    }
    hoursWithData.sort(function(a, b) { return b.score - a.score; });
    var bestHours = hoursWithData.slice(0, 3);
    var bestHourSet = {};
    bestHours.forEach(function(b) { bestHourSet[b.hour] = true; });

    // 渲染柱状图
    var maxCount = 0;
    for (var h4 = 0; h4 < 24; h4++) maxCount = Math.max(maxCount, hourData[h4].count);
    var chartHtml = '';
    for (var h5 = 0; h5 < 24; h5++) {
      var d5 = hourData[h5];
      var heightPct = maxCount > 0 ? (d5.count / maxCount * 100) : 0;
      var isBest = bestHourSet[h5];
      var viralLabel = (d5.count >= 5 && d5.viralCount > 0) ? (d5.viralCount / d5.count * 100).toFixed(0) + '%' : '';
      chartHtml += '<div class="pt-bar-wrap">';
      if (viralLabel) chartHtml += '<div class="pt-bar-viral">' + viralLabel + '</div>';
      chartHtml += '<div class="pt-bar' + (isBest ? ' best' : '') + '" style="height:' + Math.max(heightPct, 1) + '%" title="' + h5 + ':00 - ' + d5.count + '条作品, 平均点赞' + Math.round(d5.totalLikes / Math.max(d5.count,1)) + '"></div>';
      chartHtml += '<div class="pt-bar-label">' + h5 + '</div>';
      chartHtml += '</div>';
    }
    document.getElementById('ptChart').innerHTML = chartHtml;

    // 渲染TOP3最佳时段
    var rankEmoji = ['🥇', '🥈', '🥉'];
    var bestHtml = '';
    bestHours.forEach(function(b, i) {
      bestHtml += '<div class="pt-best-card">';
      bestHtml += '<div class="rank">' + rankEmoji[i] + '</div>';
      bestHtml += '<div class="time">' + b.hour + ':00 - ' + (b.hour + 1) + ':00</div>';
      bestHtml += '<div class="stats">样本<b>' + b.count + '</b>条<br>平均点赞<b>' + Math.round(b.avgLikes).toLocaleString() + '</b><br>爆款率<span class="viral-rate">' + b.viralRate.toFixed(1) + '%</span></div>';
      bestHtml += '</div>';
    });
    document.getElementById('ptBestCards').innerHTML = bestHtml;

    // 分平台最佳时段
    var platHtml = '';
    var platNames = { douyin: '抖音', xiaohongshu: '小红书' };
    for (var p2 in platformHour) {
      var bestH = -1, bestVR = -1, bestCount = 0, bestAvg = 0;
      for (var h6 = 0; h6 < 24; h6++) {
        var ph = platformHour[p2][h6];
        if (ph.count >= 5) {
          var vr = ph.viralCount / ph.count * 100;
          if (vr > bestVR) { bestVR = vr; bestH = h6; bestCount = ph.count; bestAvg = ph.totalLikes / ph.count; }
        }
      }
      if (bestH >= 0) {
        platHtml += '<div class="pt-platform-item">';
        platHtml += '<div class="plat-name">' + platNames[p2] + '最佳时段</div>';
        platHtml += '<div class="plat-best">' + bestH + ':00 - ' + (bestH + 1) + ':00</div>';
        platHtml += '<div style="color:var(--text-tertiary);font-size:11px;margin-top:2px;">爆款率' + bestVR.toFixed(1) + '% · 平均点赞' + Math.round(bestAvg).toLocaleString() + '</div>';
        platHtml += '</div>';
      }
    }
    document.getElementById('ptPlatform').innerHTML = platHtml;

    // 实操建议
    var tipsHtml = '<strong>💡 实操建议：</strong>';
    if (bestHours.length > 0) {
      tipsHtml += '优先在<strong>' + bestHours[0].hour + ':00前后</strong>发布，爆款率是平均水平的' + (bestHours[0].viralRate / Math.max(hoursWithData.reduce(function(s, x) { return s + x.viralRate; }, 0) / Math.max(hoursWithData.length, 1), 0.1)).toFixed(1) + '倍。';
    }
    tipsHtml += ' 避开<strong>13:00-14:00午间</strong>（'+cfg('name','该领域')+'内容互动最差）。';
    tipsHtml += ' 若一天发2条，选<strong>18点 + 20点</strong>覆盖晚高峰双波峰。';
    document.getElementById('ptTips').innerHTML = tipsHtml;
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "publishTime",
      requiredFields: ['works'],
      render: function(data) {
        try { renderPublishTimeDetail(data); } catch(e) { console.error("[publishTime]", e); }
      }
    });
  }
  window.renderPublishTimeDetail = renderPublishTimeDetail;
})();


/* ===== modules/titleFormulas.js ===== */
/**
 * modules/titleFormulas.js
 * 函数: renderTitleFormulas, copyFormula, genTitleVariants
 * 依赖: ['title_formulas_extracted']
 */
(function() {
  'use strict';

  // renderTitleFormulas
  function renderTitleFormulas() {
    var formulas = DATA.title_formulas_array || [];
    var examples = cfg('title_formula_examples', {
      '感叹句': '太绝了！这个工具让我效率提升10倍',
      '教程型': '手把手教你做XX，3分钟上手',
      '疑问句': '还在手动调参？这个方法90%的人不知道',
      '否定警告': '千万别再用XX了，这3个坑踩过的人都哭了',
      '极限词': '2026最强工具排行，第一名居然是它',
      '实测型': '我用这套工作流跑了一周，效率提升了200%',
      '免费型': '免费白嫖！这款工具比付费的还好用',
    });
    var dataExamples = {};
    (DATA.title_formulas||[]).forEach(function(f){ if(f.formula && f.example) dataExamples[f.formula]=f.example; });
    var html = formulas.map(function(f) {
      var name = f[0], count = f[1];
      var ex = dataExamples[name] || examples[name] || '点击查看套用示例';
      return '<div class="formula-item" onclick="copyFormula(\'' + name + '\')"><div class="fi-name">' + name + '</div><div class="fi-count">爆款中出现 ' + count + ' 次</div><div class="fi-example">示例：' + ex + '</div></div>';
    }).join('');
    var fg = document.getElementById('formulaGrid'); if (fg) fg.innerHTML = html || '<div style="color:var(--text-tertiary);">暂无数据</div>';
  }

  // copyFormula
  function copyFormula(name) {
    alert('已复制【' + name + '】标题公式，可在选题标题中套用');
  }

  // genTitleVariants
  function genTitleVariants(title) {
    var variants = [title];
    var core = title.replace(/^[^：:]*[：:]\s*/, '');
    variants.push('3个方法搞定：' + core);
    variants.push(core + '？90%的人不知道');
    return variants.slice(0, 3);
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "titleFormulas",
      requiredFields: ['title_formulas'],
      render: function(data) {
        try { renderTitleFormulas(data); } catch(e) { console.error("[titleFormulas]", e); }
      }
    });
  }
  // 智能标题生成器（基于爆款公式）
  function generateTitles(keyword) {
    if (!keyword || !keyword.trim()) return [];
    keyword = keyword.trim();
    var formulas = DATA.title_formulas || [];
    // 按出现次数排序，取Top5公式
    var topFormulas = formulas.slice().sort(function(a,b){return b[1]-a[1];}).slice(0,5).map(function(f){return f[0];});
    if (topFormulas.length === 0) topFormulas = ['数字型','悬念型','痛点型','对比型','教程型'];

    // 公式模板库
    var templates = {
      '数字型': [
        '3个方法搞定' + keyword + '，第2个绝了',
        keyword + '的5个隐藏用法，90%的人不知道',
        '用了' + keyword + '一周，效率提升了300%',
        keyword + '入门必看：4步从0到1',
      ],
      '悬念型': [
        keyword + '居然还能这么用？看完惊呆了',
        '我为什么放弃了付费工具，选择了' + keyword,
        keyword + '背后的秘密，圈内人都不说',
        '别再瞎用' + keyword + '了，正确姿势是这样',
      ],
      '痛点型': [
        '还在手动做' + keyword + '？这个方法救了我',
        keyword + '总是做不好？因为你漏了这一步',
        '踩了无数坑后，我终于搞懂了' + keyword,
        keyword + '最难的部分，我用10分钟讲清楚',
      ],
      '对比型': [
        keyword + ' vs 传统方法，差距有多大？',
        '同样是' + keyword + '，为什么别人爆款你扑街',
        keyword + '免费版vs付费版，差的不止是钱',
        '3款' + keyword + '工具横评，这款最值得入',
      ],
      '教程型': [
        '手把手教你用' + keyword + '，3分钟上手',
        keyword + '完整教程，从安装到出片全流程',
        '零基础学' + keyword + '，这一篇就够了',
        keyword + '实操演示，跟着做就能出效果',
      ],
      '感叹句': [
        '太绝了！' + keyword + '这个功能我怎么才发现',
        keyword + 'yyds！用一次就回不去了',
        '炸裂！' + keyword + '又更新了，这次是王炸',
      ],
      '疑问句': [
        keyword + '到底值不值得学？用了3个月说真话',
        '为什么大佬都在用' + keyword + '？',
        keyword + '真的能替代人工吗？实测告诉你',
      ],
      '否定警告': [
        '千万别再这样用' + keyword + '了，全是坑',
        '别再花钱学' + keyword + '了，这篇免费教你',
        keyword + '这3个错误，90%的新手都在犯',
      ],
      '极限词': [
        '2026最强' + keyword + '工具，没有之一',
        keyword + '天花板级教程，建议收藏',
        '目前最完整的' + keyword + '指南，全网首发',
      ],
      '实测型': [
        '我用' + keyword + '跑了30天，结果出乎意料',
        keyword + '深度实测：优点缺点全告诉你',
        '连续7天用' + keyword + '，说说真实感受',
      ],
      '免费型': [
        '免费白嫖！这款' + keyword + '工具比付费还香',
        keyword + '免费替代品，功能一样强',
        '不用花钱！' + keyword + '开源方案分享',
      ],
    };

    var results = [];
    var used = {};
    // 从Top公式中各取1-2个
    topFormulas.forEach(function(fname, idx) {
      var tpls = templates[fname] || templates['数字型'];
      var count = idx < 2 ? 2 : 1;  // Top2公式各取2个
      for (var i = 0; i < count && results.length < 8; i++) {
        var t = tpls[i % tpls.length];
        if (!used[t]) {
          used[t] = true;
          results.push({title: t, formula: fname});
        }
      }
    });
    // 补足到8个
    var allTpls = Object.values(templates).flat();
    for (var j = 0; j < allTpls.length && results.length < 8; j++) {
      if (!used[allTpls[j]]) {
        used[allTpls[j]] = true;
        results.push({title: allTpls[j], formula: '综合'});
      }
    }
    return results.slice(0, 8);
  }

  function renderGeneratedTitles(keyword) {
    var titles = generateTitles(keyword);
    var el = document.getElementById('titleGenResult');
    if (!el) return;
    if (titles.length === 0) {
      el.innerHTML = '<div style="color:var(--text-tertiary);padding:10px;">请输入关键词</div>';
      return;
    }
    el.innerHTML = titles.map(function(t, i) {
      return '<div class="gen-title-item" onclick="copyText(\'' + t.title.replace(/'/g, "\\'") + '\')">' +
        '<span class="gen-title-num">' + (i+1) + '</span>' +
        '<span class="gen-title-text">' + t.title + '</span>' +
        '<span class="gen-title-formula">' + t.formula + '</span>' +
        '<span class="gen-copy-btn">复制</span></div>';
    }).join('');
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(function() {
      // 视觉反馈
      document.querySelectorAll('.gen-title-item').forEach(function(el) {
        if (el.querySelector('.gen-title-text').textContent === text) {
          el.querySelector('.gen-copy-btn').textContent = '已复制';
          TimerManager.setTimeout(function(){ el.querySelector('.gen-copy-btn').textContent = '复制'; }, 1500, 'button-feedback');
        }
      });
    });
  }

  // 绑定输入框回车事件
  function initTitleGen() {
    var input = document.getElementById('titleGenInput');
    if (input && !input._bound) {
      input._bound = true;
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') renderGeneratedTitles(input.value);
      });
    }
  }

  window.renderTitleFormulas = renderTitleFormulas;
  window.copyFormula = copyFormula;
  window.genTitleVariants = genTitleVariants;
  window.generateTitles = generateTitles;
  window.renderGeneratedTitles = renderGeneratedTitles;
  window.copyText = copyText;
  window.initTitleGen = initTitleGen;
})();

// 页面加载后初始化标题生成器
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTitleGen);
} else {
  initTitleGen();
}


/* ===== modules/leadScripts.js ===== */
/**
 * modules/leadScripts.js
 * 函数: renderLeadScripts
 * 依赖: 无
 */
(function() {
  'use strict';

  // renderLeadScripts（优先用数据 comment_scripts，无则中性空状态，不硬编码行业内容）
  function renderLeadScripts() {
    var sc = document.getElementById('scriptContainer'); if (!sc) return;
    var scripts = (DATA.comment_scripts && DATA.comment_scripts.length) ? DATA.comment_scripts : cfg('lead_scripts_detail', []);
    if (!scripts.length) {
      sc.innerHTML = '<div style="padding:28px;text-align:center;color:var(--text-secondary);font-size:13px;line-height:1.8;">💬 采集到评论区需求后<br>将自动生成针对性的私域引流话术</div>';
      return;
    }
    sc.innerHTML = scripts.map(function(s) {
      return '<div class="script-card"><div class="sc-target">' + (s.type || s.target || '引流话术') + '</div><div class="sc-text">' + (s.text || '') + '</div><span class="sc-copy" onclick="copyScript(this)">📋 复制话术</span></div>';
    }).join('');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "leadScripts",
      requiredFields: [],
      render: function(data) {
        try { renderLeadScripts(data); } catch(e) { console.error("[leadScripts]", e); }
      }
    });
  }
  window.renderLeadScripts = renderLeadScripts;
})();


/* ===== modules/benchmarkExtras.js（内容形式ROI + 对标账号，数据驱动正式渲染）===== */
(function() {
  'use strict';
  function renderFormatROI() {
    var el = document.getElementById('formatROIList'); if (!el) return;
    var rois = DATA.format_roi || [];
    if (!rois.length) { el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-secondary);font-size:13px;">暂无数据，采集后自动生成</div>'; return; }
    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">' + rois.map(function(r){
      var pct = Math.max(0, Math.min(100, r.roi||0));
      return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:14px;font-weight:600;">'+r.format+'</span><span style="font-size:12px;color:#fbbf24;font-weight:700;">ROI '+pct+'</span></div>' +
        '<div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#8b5cf6,#ec4899);border-radius:3px;"></div></div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:var(--text-secondary);"><span>均赞 '+Number(r.avgLikes||0).toLocaleString()+'</span><span>收藏率 '+Number(r.collectRate||0)+'%</span></div>' +
        '</div>';
    }).join('') + '</div>';
  }
  function renderCompetitorList() {
    var el = document.getElementById('competitorList'); if (!el) return;
    var comps = DATA.competitor_list || [];
    if (!comps.length) { el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-secondary);font-size:13px;">暂无数据，采集后自动生成</div>'; return; }
    el.innerHTML = '<div style="display:grid;gap:10px;">' + comps.map(function(c){
      return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;">' +
        '<div><div style="font-size:14px;font-weight:600;">'+c.name+'</div><div style="font-size:11px;color:var(--text-secondary);margin-top:3px;">'+(c.strategy||'')+'</div></div>' +
        '<div style="text-align:right;font-size:11px;color:var(--text-secondary);"><div style="font-size:15px;color:#a78bfa;font-weight:700;">'+Number(c.avgLikes||0).toLocaleString()+'</div><div>'+Number(c.works||0)+' 作品</div></div>' +
        '</div>';
    }).join('') + '</div>';
  }
  if (window.Module) {
    Module.register({ id:'benchmarkExtras', requiredFields:[], render:function(){
      try{renderFormatROI();}catch(e){console.error('[formatROI]',e);}
      try{renderCompetitorList();}catch(e){console.error('[competitorList]',e);}
    }});
  }
  window.renderFormatROI = renderFormatROI;
  window.renderCompetitorList = renderCompetitorList;
})();


/* ===== modules/launchOps.js ===== */
/**
 * modules/launchOps.js
 * 函数: renderLaunchOps
 * 从hotwords/topics/works实时生成起号运营追踪数据
 */
(function() {
  'use strict';

  function renderLaunchOps() {
    // 如果有预计算的launch_ops则直接用，否则从数据生成
    var lo = DATA.launch_ops;
    if (!lo || !lo.phase || !lo.tag_health) { lo = generateLaunchOps(); }
    if (!lo) return;

    // 阶段横幅
    var phaseColors = {'打标期':'#fbbf24','验证期':'#60a5fa','放大期':'#30D158'};
    var pc = phaseColors[lo.phase] || '#a78bfa';
    var bannerEl = document.getElementById('launchBanner');
    if (bannerEl) bannerEl.innerHTML =
      '<div class="launch-phase-icon">' + (lo.phase==='打标期'?'🏷️':lo.phase==='验证期'?'📊':'🚀') + '</div>' +
      '<div class="launch-phase-info"><div class="launch-phase-name" style="color:'+pc+'">' + lo.phase + '</div>' +
      '<div class="launch-phase-desc">' + lo.desc + ' · 起号日 ' + lo.start_date + '</div></div>' +
      '<div class="launch-phase-day">第' + lo.days + '天<span>of 14天打标</span></div>';

    // 健康度
    var hs = lo.tag_health || 0;
    var hsEl = document.getElementById('healthScore');
    if (hsEl) {
      hsEl.textContent = hs;
      hsEl.className = 'health-score ' + (hs>=60?'':hs>=40?'mid':'low');
    }
    var ccEl = document.getElementById('coreCoverage');
    if (ccEl) ccEl.textContent = lo.core_coverage + '%';
    var hb = document.getElementById('healthBar');
    if (hb) {
      hb.style.width = hs + '%';
      hb.style.background = hs>=60 ? 'linear-gradient(90deg,#30D158,#4ade80)' : hs>=40 ? 'linear-gradient(90deg,#fbbf24,#f97316)' : 'linear-gradient(90deg,#f87171,#ef4444)';
    }
    var htEl = document.getElementById('healthTip');
    if (htEl) htEl.textContent = hs>=60 ? '标签健康，算法可精准推流' : hs>=40 ? '标签正在形成，继续保持垂直输出' : '标签混乱，建议减少泛内容，聚焦核心领域';

    // 关键词云
    var kws = lo.core_keywords || [];
    var kwEl = document.getElementById('coreKwCloud');
    if (kwEl) kwEl.innerHTML = kws.length ? kws.map(function(k){return '<span class="kw-chip">'+k+'</span>';}).join('') : '<span style="font-size:11px;color:var(--text-tertiary);">暂无核心关键词覆盖</span>';

    // 内容配比
    var r = lo.content_ratio || {};
    var total = (r.core||0)+(r.related||0)+(r.general||0) || 1;
    var corePct = Math.round((r.core||0)/total*100);
    var relPct = Math.round((r.related||0)/total*100);
    var genPct = 100-corePct-relPct;
    var rbEl = document.getElementById('ratioBar');
    if (rbEl) rbEl.innerHTML =
      '<div class="ratio-seg" style="width:'+corePct+'%;background:#30D158;">'+(corePct>10?corePct+'%':'')+'</div>' +
      '<div class="ratio-seg" style="width:'+relPct+'%;background:#60a5fa;">'+(relPct>10?relPct+'%':'')+'</div>' +
      '<div class="ratio-seg" style="width:'+genPct+'%;background:rgba(255,255,255,0.15);">'+(genPct>10?genPct+'%':'')+'</div>';
    var rlEl = document.getElementById('ratioLegend');
    if (rlEl) rlEl.innerHTML =
      '<span><span class="ratio-dot" style="background:#30D158;"></span>核心 '+corePct+'% (目标70%)</span>' +
      '<span><span class="ratio-dot" style="background:#60a5fa;"></span>关联 '+relPct+'% (目标20%)</span>' +
      '<span><span class="ratio-dot" style="background:rgba(255,255,255,0.15);"></span>泛内容 '+genPct+'% (目标10%)</span>';
    var rtEl = document.getElementById('ratioTip');
    if (rtEl) rtEl.textContent = corePct < 50 ? '⚠️ 核心内容占比过低，打标期建议核心内容>70%，否则算法无法识别账号标签' : corePct >= 70 ? '✅ 核心占比达标，标签识别良好' : '核心占比接近目标，继续保持';

    // 任务清单
    var tasks = lo.tasks || [];
    var ltEl = document.getElementById('launchTasks');
    if (ltEl) ltEl.innerHTML = tasks.map(function(t,i){
      return '<div class="task-item"><div class="task-check"></div><span>'+t+'</span></div>';
    }).join('');

    // 避坑提醒
    var pitfalls = (lo.pitfalls||[]).filter(function(p){return p.active;});
    var pfEl = document.getElementById('pitfallList');
    if (pfEl) pfEl.innerHTML = pitfalls.map(function(p){
      return '<div class="pitfall-item '+p.level+'"><span>'+(p.level==='high'?'🔴':p.level==='mid'?'🟡':'⚪')+'</span><span>'+p.text+'</span></div>';
    }).join('');
  }

  // 从现有数据生成起号运营信息
  function generateLaunchOps() {
    var hotwords = DATA.hotwords || [];
    var topics = DATA.topics || [];
    var works = DATA.works || [];

    // 核心关键词 = TOP10热词
    var coreKws = hotwords.slice(0, 10).map(function(h) { return h.keyword; });

    // 标签健康度 = 选题中覆盖核心关键词的比例
    var coreCoverage = 0;
    if (topics.length && coreKws.length) {
      var covered = topics.filter(function(t) {
        return coreKws.some(function(kw) { return (t.title || '').indexOf(kw) >= 0; });
      }).length;
      coreCoverage = Math.round(covered / topics.length * 100);
    }
    var tagHealth = Math.min(95, Math.round(coreCoverage * 0.7 + 20));

    // 内容配比 = 基于选题分类
    var coreCount = 0, relCount = 0, genCount = 0;
    topics.forEach(function(t) {
      var cat = t.category || '';
      if (cat.indexOf(cfg('name','AI')) >= 0 || cat.indexOf('工具') >= 0 || cat.indexOf('工作流') >= 0) coreCount++;
      else if (cat.indexOf('教程') >= 0 || cat.indexOf('测评') >= 0) relCount++;
      else genCount++;
    });
    if (topics.length === 0) { coreCount = 14; relCount = 4; genCount = 2; }

    // 起号日 = 数据采集日
    var startDate = (DATA.last_update || '2026-09-01').slice(0, 10);
    var today = new Date();
    var start = new Date(startDate);
    var days = Math.max(1, Math.floor((today - start) / 86400000) + 1);

    return {
      phase: days <= 7 ? '打标期' : days <= 14 ? '验证期' : '放大期',
      desc: days <= 7 ? '聚焦垂直内容，让算法识别账号标签' : days <= 14 ? '验证标签精准度，测试爆款选题' : '放大爆款，矩阵化运营',
      start_date: startDate,
      days: Math.min(days, 14),
      tag_health: tagHealth,
      core_coverage: coreCoverage,
      core_keywords: coreKws,
      content_ratio: { core: coreCount, related: relCount, general: genCount },
      tasks: [
        cfg('launch.daily_content', '每日发布1条核心领域垂直内容（口播+素材混剪）'),
        '选题覆盖TOP5飙升热词，标题包含关键词',
        '发布时间选择18:00-21:00黄金时段',
        '前3秒钩子用数字/痛点/对比型',
        '评论区置顶引流话术，引导扣"1"领资料',
        '发布后30分钟内回复前10条评论',
        '关注5个对标账号，拆解其爆款结构'
      ],
      pitfalls: [
        { level: 'high', active: true, text: '不要发泛娱乐/蹭热点内容，会打乱账号标签' },
        { level: 'high', active: true, text: '不要频繁删视频/隐藏视频，影响账号权重' },
        { level: 'mid', active: true, text: '不要买粉/买赞，算法会识别异常流量' },
        { level: 'mid', active: true, text: '打标期不要接广告/带货，保持内容纯净度' },
        { level: 'low', active: true, text: '视频时长控制在60-90秒，完播率更优' }
      ]
    };
  }

  if (window.Module) {
    Module.register({
      id: "launchOps",
      render: function() {
        try { renderLaunchOps(); } catch(e) { console.error("[launchOps]", e); }
      }
    });
  }
  window.renderLaunchOps = renderLaunchOps;
  window.generateLaunchOps = generateLaunchOps;
})();


/* ===== modules/audience.js ===== */
/**
 * modules/audience.js
 * 函数: renderAudience
 * 依赖: ['audience_personas']
 */
(function() {
  'use strict';

  // renderAudience
  function renderAudience() {
    const personas = DATA.audience_personas || [];
    if (!personas.length) {
      document.getElementById('personaGrid').innerHTML = '<p style="color:var(--text-secondary)">暂无人群画像数据</p>';
      return;
    }

    // 分布柱状图
    const chartDom = document.getElementById('audienceChart');
    if (chartDom && typeof echarts !== 'undefined') {
      const chart = ChartManager.create(chartDom);
      chart.setOption({
        grid: { left: 80, right: 20, top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#9ca3af', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        yAxis: { type: 'category', data: personas.map(p => p.name).reverse(), axisLabel: { color: '#d1d5db', fontSize: 12 } },
        series: [{
          type: 'bar',
          data: personas.map(p => Math.max(p.proportion, 0.5)).reverse(),
          itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#8b5cf6'},{offset:1,color:'#ec4899'}]), borderRadius: [0,4,4,0] },
          barWidth: 16,
          label: { show: true, position: 'right', color: '#c4b5fd', fontSize: 11, formatter: '{c}%' }
        }]
      });
    }

    // 画像卡片
    const grid = document.getElementById('personaGrid');
    grid.innerHTML = personas.map(p => `
      <div class="persona-card">
        <div class="persona-name">${p.name}</div>
        <div class="persona-cat">${p.category} · 占比 ${Math.max(p.proportion,0.1)}%</div>
        <div class="persona-meta">
          <span>${p.age}</span>
          <span>${p.gender}</span>
        </div>
        <div class="persona-tags">
          ${(p.traits||[]).map(t => '<span class="persona-tag">'+t+'</span>').join('')}
        </div>
        <div class="persona-section">
          <div class="persona-label">核心需求</div>
          <div class="persona-needs">
            ${(p.needs||[]).map(n => '<span class="need-tag">'+n+'</span>').join('')}
          </div>
        </div>
        <div class="persona-section">
          <div class="persona-label">内容偏好</div>
          <div class="persona-value">${p.content_pref}</div>
        </div>
        <div class="persona-section">
          <div class="persona-label">活跃时间</div>
          <div class="persona-value">${p.active_time}</div>
        </div>
        <div class="persona-section">
          <div class="persona-label">变现方式</div>
          <div class="persona-value" style="color:#c4b5fd">${p.monetization}</div>
        </div>
        <div class="persona-section">
          <div class="persona-label">痛点</div>
          <div class="persona-needs">
            ${(p.pain_points||[]).map(pp => '<span class="pain-tag">'+pp+'</span>').join('')}
          </div>
        </div>
        <div class="persona-bar"><div class="persona-bar-fill" style="width:${Math.min(Math.max(p.proportion,1),100)}%"></div></div>
      </div>
    `).join('');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "audience",
      requiredFields: ['audience_personas'],
      render: function(data) {
        try { renderAudience(data); } catch(e) { console.error("[audience]", e); }
      }
    });
  }
  window.renderAudience = renderAudience;
})();


/* ===== modules/engagement.js ===== */
/**
 * modules/engagement.js
 * 函数: renderEngagement
 * 从works数据直接计算互动质量
 */
(function() {
  'use strict';

  function renderEngagement() {
    var works = (DATA.works || []).filter(function(w) { return (w.likeCount || 0) > 0; });
    if (!works.length) {
      var el1 = document.getElementById('avgCommentRate');
      if (el1) el1.textContent = '0%';
      var el2 = document.getElementById('avgCollectRate');
      if (el2) el2.textContent = '0%';
      var listEl = document.getElementById('highCommentList');
      if (listEl) listEl.innerHTML = '<div style="font-size:11px;color:var(--text-tertiary);">暂无数据</div>';
      return;
    }
    // 计算每条作品的评论率和收藏率（以点赞数为分母）
    var withRates = works.map(function(w) {
      var likes = w.likeCount || 1;
      return {
        title: w.title || '无标题',
        platform: w.platform || 'douyin',
        comment_rate: Math.round((w.commentCount || 0) / likes * 1000) / 10,
        collect_rate: Math.round((w.collectCount || 0) / likes * 1000) / 10,
        comments: w.commentCount || 0,
        collects: w.collectCount || 0,
        likes: likes
      };
    });
    var avgComment = Math.round(withRates.reduce(function(s, w) { return s + w.comment_rate; }, 0) / withRates.length * 10) / 10;
    var avgCollect = Math.round(withRates.reduce(function(s, w) { return s + w.collect_rate; }, 0) / withRates.length * 10) / 10;

    var el1 = document.getElementById('avgCommentRate');
    if (el1) el1.textContent = avgComment + '%';
    var el2 = document.getElementById('avgCollectRate');
    if (el2) el2.textContent = avgCollect + '%';

    var listEl = document.getElementById('highCommentList');
    if (!listEl) return;
    var top = withRates.sort(function(a, b) { return b.comment_rate - a.comment_rate; }).slice(0, 5);
    var html = top.map(function(w) {
      var shortTitle = w.title.length > 22 ? w.title.substring(0, 22) + '…' : w.title;
      var platLabel = w.platform === 'xiaohongshu' ? '小红书' : '抖音';
      return '<div class="engage-item"><span class="ei-title">' + shortTitle + '</span><span class="ei-rate">' + w.comment_rate + '%</span><span class="ei-plat">' + platLabel + '</span></div>';
    }).join('');
    listEl.innerHTML = html || '<div style="font-size:11px;color:var(--text-tertiary);">暂无数据</div>';
  }

  if (window.Module) {
    Module.register({
      id: "engagement",
      render: function() {
        try { renderEngagement(); } catch(e) { console.error("[engagement]", e); }
      }
    });
  }
  window.renderEngagement = renderEngagement;
})();


/* ===== modules/topicPerf.js ===== */
/**
 * modules/topicPerf.js
 * 函数: renderTopicPerf, recordPerf, calcHitRate, getPerfData, savePerfData
 * 依赖: ['topic_performance']
 */
(function() {
  'use strict';

  // renderTopicPerf
  function renderTopicPerf() {
    const perf = DATA.topic_performance;
    if (!perf) { document.getElementById('topicPerfContent').innerHTML='<p style="color:var(--text-secondary)">暂无数据</p>'; return; }
    let html = '<div class="gene-grid">';
    html += '<div class="gene-card"><h4>选题总数</h4><div class="gene-val">'+(perf.total_topics||0)+'</div></div>';
    html += '<div class="gene-card"><h4>已发布</h4><div class="gene-val">'+(perf.published||0)+'</div></div>';
    html += '<div class="gene-card"><h4>命中率</h4><div class="gene-val">'+(perf.hit_rate||0)+'%</div></div>';
    html += '</div>';
    if (perf.note) { html += '<p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">'+perf.note+'</p>'; }
    document.getElementById('topicPerfContent').innerHTML = html;
  }

  // recordPerf
  function recordPerf(title) {
    var views = prompt('请输入播放量（数字）：', '');
    if (views === null) return;
    var likes = prompt('请输入点赞数（数字）：', '');
    if (likes === null) return;
    var followers = prompt('请输入涨粉数（数字）：', '');
    if (followers === null) return;
    var perf = getPerfData();
    perf[title] = { views: parseInt(views)||0, likes: parseInt(likes)||0, followers: parseInt(followers)||0, date: new Date().toLocaleDateString() };
    savePerfData(perf);
    renderTopics();
    updateTracker();
    alert('效果数据已保存！');
  }

  // calcHitRate
  function calcHitRate() {
    var perf = getPerfData();
    var published = Object.keys(perf).length;
    if (published === 0) return { rate: 0, avgViews: 0, avgLikes: 0, total: 0 };
    var totalViews = 0, totalLikes = 0, hits = 0;
    Object.values(perf).forEach(function(p) {
      totalViews += p.views; totalLikes += p.likes;
      if (p.views >= 10000) hits++;
    });
    return { rate: Math.round(hits/published*100), avgViews: Math.round(totalViews/published), avgLikes: Math.round(totalLikes/published), total: published };
  }

  // getPerfData
  function getPerfData() {
    return NS.get('topic_perf', {}) || {};
  }

  // savePerfData
  function savePerfData(d) { NS.set('topic_perf', d); }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "topicPerf",
      requiredFields: [],
      render: function(data) {
        try { renderTopicPerf(data); } catch(e) { console.error("[topicPerf]", e); }
      }
    });
  }
  window.renderTopicPerf = renderTopicPerf;
  window.recordPerf = recordPerf;
  window.calcHitRate = calcHitRate;
  window.getPerfData = getPerfData;
  window.savePerfData = savePerfData;
})();


/* ===== modules/kanban.js ===== */
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
    return NS.get('ai_hotspot_status', {}) || {};
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
    NS.set('ai_hotspot_status', all);
    renderKanban();
    renderTopics();
  }

  // cycleKanbanStatus
  function cycleKanbanStatus(i, title) {
    const status = getKanbanStatus();
    const cur = status[title] || 'pending';
    const next = cur==='pending'?'shooting':cur==='shooting'?'published':'pending';
    if (next==='pending') delete status[title]; else status[title]=next;
    NS.set('ai_hotspot_status', status);
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
  function getKanbanStatus() { return NS.get('ai_hotspot_status', {}) || {}; }

  // resetKanbanStatus
  function resetKanbanStatus() { NS.remove('ai_hotspot_status'); renderTopics(); }

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
  window.renderKanban = renderKanban;
  window.getAllKanbanStatus = getAllKanbanStatus;
  window.getTopicStatus = getTopicStatus;
  window.setTopicStatus = setTopicStatus;
  window.cycleKanbanStatus = cycleKanbanStatus;
  window.cycleKanbanStatusByTitle = cycleKanbanStatusByTitle;
  window.getKanbanStatus = getKanbanStatus;
  window.resetKanbanStatus = resetKanbanStatus;
})();


/* ===== modules/favorites.js ===== */
/**
 * modules/favorites.js
 * 函数: getFavorites, isFavorite, toggleFavorite, renderFavorites, removeFavorite
 * 依赖: 无
 */
(function() {
  'use strict';

  // getFavorites
  function getFavorites() {
    return NS.get('viral_favorites', []) || [];
  }

  // isFavorite
  function isFavorite(i) { const favs = NS.get('viral_favorites', []) || []; return favs.some(f => f.title === DATA.hot_breakdowns[i]?.title); }

  // toggleFavorite
  function toggleFavorite(index) {
    const favs = getFavorites();
    const work = DATA.hot_breakdowns[index];
    const exists = favs.findIndex(function(f) { return f.title === work.title; });
    if (exists >= 0) { favs.splice(exists, 1); } else { favs.push(work); }
    NS.set('viral_favorites', favs);
    renderBreakdowns();
    renderFavorites();
  }

  // renderFavorites
  function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;
    const favs = getFavorites();
    if (!favs.length) {
      grid.innerHTML = '<div class="empty-state">还没有收藏，点击爆款拆解卡片右上角的☆收藏</div>';
      return;
    }
    grid.innerHTML = favs.map(function(b, i) {
      const pname = (b.target_persona && b.target_persona.name) ? b.target_persona.name : '';
      return '<div class="breakdown-card">' +
        '<div class="bd-header"><div class="bd-title">' + (i+1) + '. ' + b.title + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<button class="fav-btn active" onclick="removeFavorite(' + i + ')" title="取消收藏">⭐</button>' +
        '<div class="bd-likes">' + (b.likes/10000).toFixed(1) + '万</div></div></div>' +
        '<div class="bd-row"><span class="bd-label">钩子</span><span class="bd-val">' + b.hook + '型</span></div>' +
        '<div class="bd-row"><span class="bd-label">结构</span><span class="bd-val">' + b.structure + '</span></div>' +
        '<div class="bd-row"><span class="bd-label">CTA</span><span class="bd-val">' + b.cta + '</span></div>' +
        (pname ? '<div class="bd-row"><span class="bd-label">人群</span><span class="bd-val"><span style="color:#22d3ee;font-weight:600">' + pname + '</span></span></div>' : '') +
        '<div class="bd-meta"><span>' + b.author + '</span><span><a href="' + (b.work_url || '#') + '" target="_blank" class="work-link">原视频</a></span></div>' +
        '</div>';
    }).join('');
  }

  // removeFavorite
  function removeFavorite(index) {
    const favs = getFavorites();
    favs.splice(index, 1);
    NS.set('viral_favorites', favs);
    renderFavorites();
    renderBreakdowns();
  }


  // 模块注册
  if (window.Module) {
    Module.register({
      id: "favorites",
      render: function() {
        try { renderFavorites(); } catch(e) { console.error("[favorites]", e); }
      }
    });
  }

  window.getFavorites = getFavorites;
  window.isFavorite = isFavorite;
  window.toggleFavorite = toggleFavorite;
  window.renderFavorites = renderFavorites;
  window.removeFavorite = removeFavorite;
})();


/* ===== modules/credit.js ===== */
/**
 * modules/credit.js
 * 函数: renderCreditMonitor
 * 依赖: 无
 */
(function() {
  'use strict';

  // renderCreditMonitor
  function renderCreditMonitor() {
    // 估算：每天约13次API调用，每次0.4积分 = 每天5.2积分
    var dailyCost = 5.2;
    var today = new Date();
    var dayOfMonth = today.getDate();
    var estimatedMonthly = dailyCost * 30;
    var usedSoFar = dailyCost * dayOfMonth;
    var pct = Math.min(usedSoFar / 1000 * 100, 100);
    var html = '<span>💰 积分</span>';
    html += '<div class="cm-bar"><div class="cm-fill" style="width:' + pct + '%"></div></div>';
    html += '<span>已用' + Math.round(usedSoFar) + '/1000</span>';
    // 插入到hero区域或导航栏
    var heroStats = document.querySelector('.hero-stats');
    if (heroStats && !document.getElementById('creditMonitor') && heroStats.parentNode) {
      var monitor = document.createElement('div');
      monitor.id = 'creditMonitor';
      monitor.className = 'credit-monitor';
      monitor.innerHTML = html;
      heroStats.parentNode.insertBefore(monitor, heroStats.nextSibling);
    }
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "credit",
      requiredFields: [],
      render: function(data) {
        try { renderCreditMonitor(data); } catch(e) { console.error("[credit]", e); }
      }
    });
  }
  window.renderCreditMonitor = renderCreditMonitor;
})();


/* ===== modules/scriptGen.js ===== */
/**
 * modules/scriptGen.js
 * 函数: generateScript, closeScriptModal, copyScript
 * 依赖: 无
 */
(function() {
  'use strict';

  // generateScript
  function generateScript(title) {
    const topic = DATA.topics.find(function(t) { return t.title === title; });
    if (!topic) return;
    const persona = topic.target_persona || {};
    const needs = (persona.needs || []).slice(0, 2).join('、');
    const script = {
      opening: '【0-3秒】' + topic.hook + '\n画面：数字人正面出镜，背景用' + cfg('script_templates.bg_desc', '生成的') + topic.keyword + '相关场景\n字幕：大字突出关键词',
      body: '【3-30秒】核心内容\n1. 痛点引入：' + (needs ? '你是不是也在为"' + needs + '"发愁？' : '很多人不知道这个技巧') + '\n2. 方法拆解：分3步讲清楚' + topic.keyword + '的核心用法\n3. 案例展示：用AI生成的实际效果画面佐证\n画面：数字人口播+AI素材混剪，每5秒切一次画面',
      cta: '【最后5秒】引导行动\n"' + cfg('script_templates.follow_cta', '关注我，每天分享一个实用技巧') + '"\n"' + cfg('script_templates.comment_cta', '评论区扣1，发你完整工具包') + '"\n画面：数字人指向关注按钮+账号二维码',
      subtitles: '字幕要点：' + topic.keyword + '、' + (needs || '实用技巧') + '、关注领取\nBGM：轻快科技感纯音乐，音量-15db',
      seo: '标签：' + cfg('script_templates.hashtag_prefix', '#') + topic.keyword.replace(/\s/g, '') + ' #AI工具 #干货分享\n发布时间：' + (persona.active_time || '19:00-21:00')
    };
    const modal = document.getElementById('scriptModal');
    document.getElementById('scriptModalTitle').textContent = '脚本：' + topic.title.slice(0, 20);
    document.getElementById('scriptModalContent').innerHTML =
      '<div class="script-section"><div class="script-section-label">钩子标题</div><div class="script-section-content">' + topic.hook + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">开头（0-3秒）</div><div class="script-section-content">' + script.opening + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">正文（3-30秒）</div><div class="script-section-content">' + script.body + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">结尾CTA</div><div class="script-section-content">' + script.cta + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">字幕/BGM</div><div class="script-section-content">' + script.subtitles + '</div></div>' +
      '<div class="script-section"><div class="script-section-label">标签/发布</div><div class="script-section-content">' + script.seo + '</div></div>';
    modal.classList.add('active');
    window._currentScript = '【钩子】' + topic.hook + '\n\n【开头】' + script.opening + '\n\n【正文】' + script.body + '\n\n【结尾】' + script.cta + '\n\n【字幕/BGM】' + script.subtitles + '\n\n【标签/发布】' + script.seo;
  }

  // closeScriptModal
  function closeScriptModal() {
    document.getElementById('scriptModal').classList.remove('active');
  }

  // copyScript
  function copyScript(el) {
    var text = el.previousElementSibling.textContent;
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    el.textContent = '✅ 已复制';
    TimerManager.setTimeout(function(){ el.textContent = '📋 复制话术'; }, 2000, 'button-feedback');
  }

  window.generateScript = generateScript;
  window.closeScriptModal = closeScriptModal;
  window.copyScript = copyScript;
})();


/* ===== modules/comparison.js ===== */
/**
 * modules/comparison.js
 * 函数: renderComparison
 * 依赖: ['comparison']
 */
(function() {
  'use strict';

  // renderComparison
  function renderComparison() {
    const comp = DATA.comparison || {};
    const ps = comp.platform_summary || {};
    const dy = ps.douyin || {};
    const xhs = ps.xiaohongshu || {};
    function fmt(n) { return n >= 10000 ? (n/10000).toFixed(1) + '万' : n.toLocaleString(); }
    document.getElementById('compareSummary').innerHTML = `
      <div class="compare-card douyin"><h4><span class="compare-tag dy">抖音</span>平台概览</h4>
        <div class="stat-row"><span class="stat-label">覆盖关键词</span><span class="stat-value">${dy.total_keywords || 0} 个</span></div>
        <div class="stat-row"><span class="stat-label">作品总量</span><span class="stat-value">${fmt(dy.total_works || 0)}</span></div>
        <div class="stat-row"><span class="stat-label">平均点赞</span><span class="stat-value">${fmt(dy.avg_like || 0)}</span></div>
      </div>
      <div class="compare-card xiaohongshu"><h4><span class="compare-tag xhs">小红书</span>平台概览</h4>
        <div class="stat-row"><span class="stat-label">覆盖关键词</span><span class="stat-value">${xhs.total_keywords || 0} 个</span></div>
        <div class="stat-row"><span class="stat-label">笔记总量</span><span class="stat-value">${fmt(xhs.total_works || 0)}</span></div>
        <div class="stat-row"><span class="stat-label">平均点赞</span><span class="stat-value">${fmt(xhs.avg_like || 0)}</span></div>
      </div>`;
    const tbody = document.querySelector('#overlapTable tbody');
    tbody.innerHTML = (comp.overlapping || []).map(o => `<tr>
      <td><strong>${o.keyword}</strong></td><td>${o.category || ''}</td>
      <td>${fmt(o.douyin_total)}</td><td>${fmt(o.xhs_total)}</td>
      <td>${fmt(o.douyin_max_like)}</td><td>${fmt(o.xhs_max_like)}</td>
      <td><span class="compare-tag ${o.hotter_platform === 'douyin' ? 'dy' : 'xhs'}">${o.hotter_platform === 'douyin' ? '抖音' : '小红书'}</span></td>
    </tr>`).join('');
    document.getElementById('dyOnlyList').innerHTML = (comp.douyin_only || []).map(i => `<div class="stat-row"><span class="stat-label">${i.keyword}</span><span class="stat-value">${fmt(i.total)}</span></div>`).join('');
    document.getElementById('xhsOnlyList').innerHTML = (comp.xhs_only || []).map(i => `<div class="stat-row"><span class="stat-label">${i.keyword}</span><span class="stat-value">${fmt(i.total)}</span></div>`).join('');
  }

  // 模块注册
  if (window.Module) {
    Module.register({
      id: "comparison",
      requiredFields: ['comparison'],
      render: function(data) {
        try { renderComparison(data); } catch(e) { console.error("[comparison]", e); }
      }
    });
  }
  window.renderComparison = renderComparison;
})();


/* ===== modules/sidebar.js ===== */
/**
 * modules/sidebar.js
 * 左侧导航栏模块 - 动态创建sidebar，按分组切换显示section
 * 不修改现有HTML结构，只控制显示/隐藏
 */
(function() {
  'use strict';

  // 导航分组配置（每个分组包含的section/元素ID）
  const NAV_GROUPS = [
    {
      id: 'overview',
      icon: '📊',
      label: '概览',
      sections: ['hero', 'actionList', 'heroStats'],
      title: '数据概览'
    },

    {
      id: 'techradar',
      icon: '🛰️',
      label: '技术雷达',
      sections: ['techradar', 'techSummary', 'techGrid'],
      title: '技术雷达'
    },
    {
      id: 'hotspots',
      icon: '🔥',
      label: '热点追踪',
      sections: ['works', 'hotwords', 'history', 'hotwordTable', 'worksTable', 'chartRanking', 'chartCategory', 'chartPublishTime', 'chartDuration', 'chartHook', 'insightsGrid', 'growthRanking', 'blueOcean', 'anomalyDetection', 'ownPerformance'],
      title: '热点追踪'
    },
    {
      id: 'breakdown',
      icon: '💥',
      label: '爆款拆解',
      sections: ['breakdown', 'breakdownGrid', 'viralGenes', 'saturationList', 'commentDemands', 'commentKw', 'chartScatter', 'chartCollect', 'matrixGrid', 'commentSemantic', 'conversionSignals'],
      title: '爆款拆解'
    },
    {
      id: 'content',
      icon: '✍️',
      label: '内容创作',
      sections: ['titleGen', 'titleFormulas', 'formulaGrid', 'leadScripts', 'scriptContainer', 'publishTime', 'ptChart', 'ptBestCards', 'ptPlatform', 'ptTips', 'titleGenes', 'bestPostingCombo', 'postingReminder', 'completionRate'],
      title: '内容创作'
    },
    {
      id: 'topics',
      icon: '📋',
      label: '选题管理',
      sections: ['topics', 'topicsGrid', 'topicTracker', 'kanbanBoard', 'topicPerf', 'topicPerfContent', 'crossPlatform'],
      title: '选题管理'
    },
    {
      id: 'launch',
      icon: '🚀',
      label: '起号运营',
      sections: ['launchOps', 'launchBanner', 'healthScore', 'healthBar', 'coreKwCloud', 'ratioBar', 'ratioLegend', 'launchTasks', 'pitfallList'],
      title: '起号运营'
    },
    {
      id: 'audience',
      icon: '👥',
      label: '人群洞察',
      sections: ['audience', 'audienceChart', 'personaGrid', 'avgCommentRate', 'avgCollectRate', 'highCommentList'],
      title: '人群洞察'
    },
    {
      id: 'benchmark',
      icon: '📚',
      label: '对标与发布',
      sections: ['compareSection', 'compareSummary', 'overlapTable', 'dyOnlyList', 'xhsOnlyList', 'authorList', 'competitorWorks', 'smallViral', 'formatBars', 'schedule', 'scheduleContent', 'commentScripts', 'commentScriptsContent', 'checklist', 'checklistContent', 'checklistProgress', 'favoritesGrid', 'formatROI', 'competitorStrategy', 'contentCalendar'],
      title: '对标与发布'
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: '设置',
      sections: ['settingsPanel'],
      title: '设置'
    }
  ];

  let currentPage = 'overview';
  let sidebarEl = null;
  let mainContentEl = null;

  // 创建sidebar
  function createSidebar() {
    if (document.getElementById('appSidebar')) return;

    const sidebar = document.createElement('aside');
    sidebar.id = 'appSidebar';
    sidebar.className = 'app-sidebar';

    // 品牌区
    const brand = document.createElement('div');
    brand.className = 'sidebar-brand';
    brand.innerHTML = `
      <div class="brand-carousel" id="brandCarousel">
        <div class="brand-slide brand-slide-logo active" id="brandSlideLogo">
          <div class="sidebar-logo" id="sbLogoContainer"></div>
        </div>
        <div class="brand-slide brand-slide-text" id="brandSlideText">
          <div class="sidebar-brand-text">
            <div class="sb-brand-name">PYRALUMA</div>
            <div class="sb-brand-tag">热点追踪工作台</div>
          </div>
        </div>
      </div>
    `;
    sidebar.appendChild(brand);

    // 导航列表
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';

    NAV_GROUPS.filter(function(g) {
      var mods = (window.DOMAIN_CONFIG||{}).modules||{};
      return mods[g.id] !== false;
    }).forEach(function(group) {
      const item = document.createElement('div');
      item.className = 'sidebar-nav-item' + (group.id === currentPage ? ' active' : '');
      item.dataset.page = group.id;
      item.innerHTML = `<span class="sb-icon">${group.icon}</span><span class="sb-label">${group.label}</span>`;
      item.addEventListener('click', function() {
        switchPage(group.id);
      });
      nav.appendChild(item);
    });

    sidebar.appendChild(nav);

    // 底部信息
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = `
      <div class="sb-update-time" id="sbUpdateTime">数据加载中...</div>
      <div class="sb-version">v6.0 · Config Driven</div>
    `;
    sidebar.appendChild(footer);

    document.body.appendChild(sidebar);

    // 品牌轮播：logo与文字交替显示
    var carousel = document.getElementById('brandCarousel');
    var slideLogo = document.getElementById('brandSlideLogo');
    var slideText = document.getElementById('brandSlideText');
    if (carousel && slideLogo && slideText) {
      var currentSlide = 0;
      var slides = [slideLogo, slideText];
      TimerManager.setInterval(function() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
      }, 4000);
    }

    // 初始化侧边栏Logo（复用登录页Logo特效）
    var logoContainer = document.getElementById('sbLogoContainer');
    if (logoContainer && typeof createLogoSVG === 'function') {
      logoContainer.innerHTML = createLogoSVG('sb', 36, 36, 1.5);
      var sbLogoSvg = logoContainer.querySelector('svg');
      if (sbLogoSvg && typeof initLogoEffect === 'function') {
        initLogoEffect(sbLogoSvg, 'sb');
      }
    }
    sidebarEl = sidebar;

    // 给body加class
    document.body.classList.add('has-sidebar');

    // 隐藏登录页（只首次显示，进入工作台后永久隐藏）
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
    }

    // 立即重置滚动位置到顶部（登录页隐藏后内容从顶部开始）
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 禁用登录页的滚动渐显效果（强制内容完全清晰显示）
    document.body.setAttribute('data-reveal', '1');
    document.querySelectorAll('.hero, section').forEach(function(el) {
      el.style.filter = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });

    // 同步更新时间到侧边栏底部
    const updateTime = document.getElementById('updateTime');
    const sbUpdateTime = document.getElementById('sbUpdateTime');
    if (updateTime && sbUpdateTime) {
      sbUpdateTime.textContent = updateTime.textContent;
    }

    // 进入工作台后自动体检（createSidebar 仅执行一次）
    TimerManager.setTimeout(function(){
      if (typeof window.runFullAudit === 'function' && !window.__auditAutoDone) {
        window.__auditAutoDone = true;
        window.runFullAudit({auto:true});
      }
    }, 1300);
  }

  // 切换页面
  function switchPage(pageId) {
    const group = NAV_GROUPS.find(function(g) { return g.id === pageId; });
    if (!group) return;

    currentPage = pageId;

    if (pageId === 'settings' && window.DynamicIndustryFlow) {
      DynamicIndustryFlow.renderManager();
    }
    if (pageId === 'settings' && window.TextAISettings) {
      TextAISettings.render();
    }

    // 确保登录页已隐藏（进入工作台后不再显示）
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen && loginScreen.style.display !== 'none') {
      loginScreen.style.display = 'none';
    }

    // 更新导航激活状态
    document.querySelectorAll('.sidebar-nav-item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    // 只隐藏顶层section和hero（body的直接子元素）
    const topSections = document.querySelectorAll('body > .section, body > .hero');
    topSections.forEach(function(el) {
      el.style.display = 'none';
    });

    // 显示当前分组相关的顶层section
    group.sections.forEach(function(id) {
      const el = document.getElementById(id);
      if (el) {
        // 找到最近的顶层section祖先并显示
        let target = el;
        while (target && target.parentElement !== document.body) {
          target = target.parentElement;
        }
        if (target && (target.classList.contains('section') || target.classList.contains('hero'))) {
          target.style.display = '';
        }
        // 也显示元素本身
        el.style.display = '';
      }
    });

    // 概览页特殊处理：显示hero所有子元素
    if (pageId === 'overview') {
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.display = '';
        hero.querySelectorAll('*').forEach(function(el) {
          el.style.display = '';
        });
      }
    }

    // 更新页面标题
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      var title = group.title;
      if (pageId === 'techradar' && window.RadarProfileService) title = RadarProfileService.getCurrent().sources.github.enabled ? '技术雷达' : '行业雷达';
      pageTitle.textContent = title + ' - 热点追踪工作台';
    }

    // 延迟resize图表
    TimerManager.setTimeout(function() {
      if (window.charts) {
        Object.values(window.charts).forEach(function(chart) {
          safeChartResize(chart);
        });
      }
      if (window.initGlow) window.initGlow();
    }, 150);

    window.scrollTo(0, 0);

    // 强制anim元素完成动画（避免隐藏/显示后停留在初始状态）
    TimerManager.setTimeout(function() {
      document.querySelectorAll('.anim').forEach(function(el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 50);
  }

  // 检查是否已滚过登录页
  function isPastLogin() {
    return window.scrollY > window.innerHeight * 0.4;
  }

  // 初始化
  function initSidebar() {
    if (isPastLogin()) {
      // 已滚过登录页，直接创建
      createSidebar();
      TimerManager.setTimeout(function() { switchPage('overview'); }, 200);
    } else {
      // 等待滚动过登录页
      let created = false;
      function onScroll() {
        if (!created && isPastLogin()) {
          created = true;
          createSidebar();
          TimerManager.setTimeout(function() { switchPage('overview'); }, 200);
          window.removeEventListener('scroll', onScroll);
        }
      }
      window.addEventListener('scroll', onScroll, {passive: true});
    }
  }

  // 暴露到window
  window.initSidebar = initSidebar;
  window.switchPage = switchPage;
  window.NAV_GROUPS = NAV_GROUPS;

  // DOM加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
})();


/* ===== modules/blueOcean.js ===== */
/**
 * modules/blueOcean.js
 * 蓝海关键词 + 关键词上升速率榜
 */
(function() {
  'use strict';

  function renderEmpty(containerId, msg) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-secondary);font-size:13px;">' + (msg || '暂无数据') + '</div>';
  }

  function renderBlueOcean(data) {
    var el = document.getElementById('blueOceanList');
    if (!el) return;
    var list = data || (window.DATA && window.DATA.blue_ocean_list) || [];
    if (!list.length) { renderEmpty('blueOceanList', '暂无蓝海关键词数据'); return; }
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:4px 0;">';
    list.forEach(function(b) {
      var score = b.score || 75;
      var color = score >= 85 ? '#30d158' : score >= 70 ? '#fbbf24' : '#f87171';
      html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;">';
      html += '<div style="font-size:14px;font-weight:600;margin-bottom:6px;">' + (b.keyword||b.name||'') + '</div>';
      html += '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">需求 ' + (b.demand||'中') + ' · 竞争 ' + (b.competition||'低') + '</div>';
      html += '<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;"><div style="width:' + score + '%;height:100%;background:' + color + ';border-radius:2px;"></div></div><span style="font-size:12px;color:' + color + ';font-weight:600;">' + score + '</span></div>';
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function renderGrowthRanking(data) {
    var el = document.getElementById('growthRankingList');
    if (!el) return;
    var list = data || (window.DATA && window.DATA.growth_ranking) || [];
    if (!list.length) { renderEmpty('growthRankingList', '暂无上升速率数据'); return; }
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0;">';
    list.forEach(function(g, i) {
      var growth = g.growth || 0;
      var arrow = growth > 50 ? '🚀' : growth > 20 ? '📈' : '📊';
      html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;">';
      html += '<div style="font-size:11px;color:#64748b;margin-bottom:4px;">#' + (i+1) + '</div>';
      html += '<div style="font-size:14px;font-weight:600;margin-bottom:6px;">' + (g.keyword||'') + '</div>';
      html += '<div style="font-size:13px;color:#30d158;font-weight:600;">' + arrow + ' +' + growth + '%</div>';
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  if (window.Module) {
    Module.register({
      id: 'blueOcean',
      requiredFields: ['blue_ocean_list'],
      render: function(data) { try { renderBlueOcean(data); } catch(e) { console.error('[blueOcean]', e); } }
    });
    Module.register({
      id: 'growthRanking',
      requiredFields: ['growth_ranking'],
      render: function(data) { try { renderGrowthRanking(data); } catch(e) { console.error('[growthRanking]', e); } }
    });
  }
  window.renderBlueOcean = renderBlueOcean;
  window.renderGrowthRanking = renderGrowthRanking;



// Run after data loads（兜底填充已由 Module 渲染系统接管，safeRender 为空操作）
  var safeRender = function(){};
  function start() {
    safeRender();
    // Re-run after a delay to catch late-loading sections
    TimerManager.setTimeout(safeRender, 1000, 'blue-ocean-render');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.__fillEmptySections = safeRender;
})();

/* ===== modules/cardAudit.js（自动化卡片体检助手 · 正式模块）=====
 * runCardAudit   检测当前 DOM 所有 .section（空内容/undefined/NaN/暂无数据/占位符/代码泄漏）
 * runFullAudit   全程逐页巡检 + 自动重渲染修复（换行业后自动跑）
 * scheduleAutoAudit  等待滚过启动页、侧边栏就绪后自动体检
 */
(function(){
  'use strict';

  // ---------- 核心检测（基于 DOM，不依赖可见性）----------
  function runCardAudit() {
    var sections = document.querySelectorAll('.section');
    var problems = [];
    var stats = { total:0, visible:0, hidden:0, ok:0, failed:0 };
    sections.forEach(function(sec, idx){
      var titleEl = sec.querySelector('.section-title');
      var title = titleEl ? titleEl.textContent.trim() : '(无标题)';
      var style = window.getComputedStyle(sec);
      var isVisible = style.display !== 'none' && style.visibility !== 'hidden';
      stats.total++; if (isVisible) stats.visible++; else stats.hidden++;

      var bodyText='', contentNodes=0, hasCanvas=false, hasSvg=false, hasTable=false, hasForm=false;
      Array.from(sec.children).forEach(function(child){
        if (!child.classList.contains('section-header')) {
          var t = child.textContent.trim();
          if (t) bodyText += t+' ';
          if (child.children.length>0 || t.length>0) contentNodes++;
          if (child.querySelector('canvas')) hasCanvas=true;
          if (child.querySelector('svg')) hasSvg=true;
          if (child.querySelector('table')) hasTable=true;
          if (child.querySelector('input,button,textarea,select')) hasForm=true;
        }
      });
      bodyText = bodyText.trim();
      var hasRenderedContent = contentNodes>0 || hasCanvas || hasSvg;
      var issues=[];
      if (!hasRenderedContent) issues.push('无内容');
      var uc = (bodyText.match(/undefined/g)||[]).length; if (uc>0) issues.push('含undefined×'+uc);
      var ncn = (bodyText.match(/NaN/g)||[]).length; if (ncn>0) issues.push('含NaN×'+ncn);
      if (bodyText.indexOf('暂无数据')>=0) issues.push('显示暂无数据');
      if (!hasCanvas && !hasTable && !hasForm) {
        var meaningful = bodyText.replace(/[-–—\s0-9.%:：]/g,'');
        if (meaningful.length<5 && bodyText.length<40 && contentNodes>0) issues.push('占位符无数据');
      }
      if (bodyText.indexOf('function')>=0 || /setTimeout|querySelector/.test(bodyText)) {
        if (bodyText.length<400) issues.push('代码泄漏');
      }
      if (issues.length>0) {
        stats.failed++;
        problems.push({idx:idx, title:title, visible:isVisible, issues:issues, preview:bodyText.substring(0,50)});
      } else stats.ok++;
    });
    return { stats:stats, problems:problems };
  }

  // ---------- 工具 ----------
  function delay(ms){ return new Promise(function(res){ TimerManager.setTimeout(res,ms); }); }
  function getPages(){
    return Array.from(document.querySelectorAll('.sidebar-nav-item')).map(function(it){
      return { page:it.dataset.page, label:it.textContent.trim() };
    });
  }

  // ---------- 体检浮层 ----------
  var toastEl=null;
  function ensureToast(){
    if (toastEl && document.getElementById('auditToast')) return toastEl;
    toastEl = document.createElement('div');
    toastEl.id='auditToast';
    toastEl.style.cssText='position:fixed;right:20px;bottom:20px;z-index:9999;min-width:260px;max-width:340px;padding:14px 16px;border-radius:14px;background:rgba(20,22,32,0.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.12);box-shadow:0 12px 40px rgba(0,0,0,0.45);font-size:12px;color:#e8ecf4;line-height:1.6;transition:opacity .3s,transform .3s;';
    document.body.appendChild(toastEl);
    return toastEl;
  }
  function toast(html){ ensureToast().innerHTML=html; toastEl.style.opacity='1'; toastEl.style.transform='translateY(0)'; }
  function dismissToast(ms){
    TimerManager.setTimeout(function(){
      if(toastEl){ toastEl.style.opacity='0'; toastEl.style.transform='translateY(10px)';
        TimerManager.setTimeout(function(){ if(toastEl&&toastEl.parentNode) toastEl.parentNode.removeChild(toastEl); toastEl=null; },350); }
    }, ms);
  }

  // 扫描单个页面（切换→等待→检测，只收可见问题）
  function scanPage(page, label, wait){
    if (typeof window.switchPage==='function') window.switchPage(page);
    return delay(wait||520).then(function(){
      var r = runCardAudit();
      return r.problems.filter(function(p){ return p.visible; }).map(function(p){
        return { page:page, label:label, title:p.title, issues:p.issues, preview:p.preview };
      });
    });
  }

  // ---------- 全程巡检 ----------
  function runFullAudit(opts){
    opts = opts||{};
    var maxPasses = opts.maxPasses!=null ? opts.maxPasses : 2;
    if (window.__auditRunning) { console.log('[Audit] 已有体检进行中'); return Promise.resolve(window.__auditLast); }
    window.__auditRunning=true;

    var pages = getPages();
    var activeEl = document.querySelector('.sidebar-nav-item.active');
    var startPage = activeEl ? activeEl.dataset.page : 'overview';

    toast('<div style="font-weight:600;margin-bottom:6px;">🔍 工作台体检中…</div><div style="color:#9aa4b8;">准备中</div>');

    var chain = Promise.resolve([]);
    pages.forEach(function(pg, i){
      chain = chain.then(function(acc){
        toast('<div style="font-weight:600;margin-bottom:6px;">🔍 工作台体检中 ('+(i+1)+'/'+pages.length+')</div><div style="color:#9aa4b8;">'+pg.label+'</div>');
        return scanPage(pg.page, pg.label, 520).then(function(probs){ return acc.concat(probs); });
      });
    });

    return chain.then(function(all){
      // 自动修复轮：重渲染后复检
      var pass=0;
      function repairRound(cur){
        if (cur.length===0 || pass>=maxPasses) return Promise.resolve(cur);
        pass++;
        console.warn('[Audit] 第'+pass+'轮发现 '+cur.length+' 个问题，重渲染修复…', cur);
        try { if (typeof window.renderAll==='function') window.renderAll(); } catch(e){ console.error('[Audit] renderAll',e); }
        return delay(700).then(function(){
          var rc = Promise.resolve([]);
          pages.forEach(function(pg, j){
            rc = rc.then(function(acc){
              toast('<div style="font-weight:600;margin-bottom:6px;">🔧 修复复检 ('+(j+1)+'/'+pages.length+')</div><div style="color:#9aa4b8;">'+pg.label+'</div>');
              return scanPage(pg.page, pg.label, 620).then(function(probs){ return acc.concat(probs); });
            });
          });
          return rc.then(function(re){ return repairRound(re); });
        });
      }
      return repairRound(all).then(function(finalProbs){ return {finalProbs:finalProbs, pass:pass}; });
    }).then(function(res){
      var all = res.finalProbs, pass = res.pass;
      if (typeof window.switchPage==='function') window.switchPage(startPage||'overview');
      window.__auditRunning=false;
      window.__auditLast={ pages:pages.length, problems:all, repairedPasses:pass };
      console.log('[Audit] 体检完成：'+pages.length+'页，问题 '+all.length+'个', window.__auditLast);

      if (all.length===0){
        toast('<div style="font-weight:600;color:#34d399;">✅ 体检通过</div><div style="color:#9aa4b8;margin-top:4px;">'+pages.length+' 个板块全部正常</div>');
        dismissToast(3500);
      } else {
        var rows = all.slice(0,8).map(function(p){
          return '<div style="margin-top:4px;"><span style="color:#fbbf24;">['+p.label+']</span> '+p.title.slice(0,18)+' <span style="color:#f87171;">'+p.issues.join(',')+'</span></div>';
        }).join('');
        var more = all.length>8 ? '<div style="color:#9aa4b8;margin-top:4px;">…其余 '+(all.length-8)+' 项见控制台</div>' : '';
        toast('<div style="font-weight:600;color:#fbbf24;">⚠️ 体检完成，'+all.length+' 项待处理</div><div style="margin-top:4px;color:#9aa4b8;">多为数据缺失，需重新采集；详情见控制台</div>'+rows+more);
      }

      var sr = document.getElementById('manualAuditResult');
      if (sr){
        if (all.length===0) sr.innerHTML='<span style="color:#34d399;">✅ '+pages.length+' 个板块全部正常</span>';
        else sr.innerHTML='<span style="color:#fbbf24;">⚠️ '+all.length+' 项待处理：</span>'+all.map(function(p){
          return '<div style="margin-top:3px;">['+p.label+'] '+p.title.slice(0,16)+' '+p.issues.join(',')+'</div>';
        }).join('');
      }
      return window.__auditLast;
    });
  }

  window.runCardAudit=runCardAudit;
  window.runFullAudit=runFullAudit;
  console.log('[Audit] 卡片体检助手已固化（runFullAudit）');
})();
