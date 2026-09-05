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
    logo_type: 'shapes',  // shapes / image / text
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
  related_keywords: [
    'AI工具', 'AI绘画', 'AI视频', '大模型', 'GPT',
    'Claude', '可灵', '即梦', 'Midjourney', 'Sora',
    '开源', 'GitHub'
  ],

  // ===== 模块开关（false时section自动隐藏，不崩溃）=====
  modules: {
    hero: true,
    works: true,
    techradar: true,        // AI专属：GitHub技术雷达
    hotwords: true,
    history: true,
    breakdown: true,
    viralGenes: true,       // AI专属：爆款基因
    insights: true,
    topics: true,
    titleGen: true,
    schedule: true,
    topicPerf: true,
    commentScripts: true,
    checklist: true,
    publishTime: true,
    titleFormulas: true,
    leadScripts: true,
    launchOps: true,
    audience: true,         // 半通用：人群画像分类
    saturation: true,       // AI专属：饱和度
  },

  // ===== 导航顺序（只显示开启的模块）=====
  nav_order: ['hero', 'techradar', 'hotwords', 'breakdown', 'topics', 'topicPerf', 'publishTime', 'titleFormulas', 'leadScripts', 'launchOps', 'audience'],

  // ===== 主题配色 =====
  theme: {
    bg: '#0a0a0f',
    bg_gradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1025 50%, #0f1a2a 100%)',
    primary: '#8b5cf6',
    primary_light: '#a78bfa',
    accent: '#30D158',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',
    text: '#f1f5f9',
    text_secondary: '#94a3b8',
    text_tertiary: '#64748b',
    glass_bg: 'rgba(255,255,255,0.06)',
    glass_border: 'rgba(255,255,255,0.1)',
    glow_hue_start: 280,
    glow_hue_end: 200,
  },

  // ===== 起号配置 =====
  launch: {
    start_date: '2026-09-01',
    target_ratio: { core: 70, related: 20, general: 10 },
  },

  // ===== 人群画像（半通用，可配置）=====
  audience_categories: [
    { name: '技术极客', proportion: 65.9, needs: ['深度教程', '工作流', '源码', '前沿技术'] },
    { name: '视觉创作者', proportion: 15.2, needs: ['AI绘画', 'AI视频', '提示词', '风格参考'] },
    { name: '泛AI关注者', proportion: 10.1, needs: ['资讯', '测评', '趋势', '入门'] },
    { name: '职场效率', proportion: 5.3, needs: ['办公自动化', 'PPT', '文案', '效率工具'] },
    { name: '创业者', proportion: 3.5, needs: ['AI创业', '变现', '商业模式', '投资'] },
  ],

  // ===== 文案模板（可配置）=====
  copy: {
    hero_title: '热点追踪工作台',
    hero_subtitle: '双平台数据 · 智能选题 · 起号运营',
    data_fresh_warning: '数据超过24小时未更新',
    collect_failed: '采集失败，显示上次缓存数据',
  },
};
