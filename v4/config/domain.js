/**
 * 领域配置 — 换领域时唯一需要修改的文件
 * 所有业务文案、关键词、模块开关、配色都从这里读取
 */
window.DOMAIN_CONFIG = {
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
  domain_specific_modules: ['techradar', 'viralGenes', 'saturation'],
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
