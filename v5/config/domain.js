/**
 * 领域配置 — 书法领域
 * 换领域时唯一需要修改的文件
 */
window.DOMAIN_CONFIG = {
  // ===== 基础信息 =====
  id: 'calligraphy',
  name: '书法',
  default_cta: '关注我，每天分享书法干货',
  display_name: '书法热点追踪',
  tagline: '书法内容运营 · 数据驱动起号',
  language: 'zh-CN',

  // ===== 品牌配置 =====
  brand: {
    name_en: 'PYRALUMA',
    name_cn: '璃火矩创',
    slogan: 'Calligraphy Intelligence',
    logo_type: 'shapes',
  },

  // ===== 采集关键词 =====
  collect_keywords: [
    '书法', '毛笔字', '硬笔书法', '楷书', '行书',
    '草书', '隶书', '篆书', '书法教学', '练字',
    '字帖', '书法作品', '书法入门', '毛笔', '钢笔字',
    '书法考级', '书法比赛', '书法欣赏', '书法技巧', '临帖'
  ],

  // ===== 核心关键词 =====
  core_keywords: [
    '书法教学', '练字技巧', '楷书入门', '行书教程', '毛笔字',
    '硬笔书法', '临帖方法', '书法考级', '书法作品', '书法名家',
    '笔画教学', '结构讲解', '握笔姿势', '宣纸', '墨汁'
  ],
  exclude_keywords: ['书法'],
  related_keywords: [
    '毛笔', '宣纸', '墨汁', '砚台', '字帖',
    '楷书', '行书', '草书', '隶书', '篆书',
    '硬笔', '钢笔字', '练字'
  ],

  // ===== 内容分类规则 =====
  content_categories: [
    { name: '书法教学', keywords: ['教学', '教程', '入门', '怎么写', '手把手', '讲解'] },
    { name: '作品展示', keywords: ['作品', '展示', '欣赏', '书法作品', '创作'] },
    { name: '技巧讲解', keywords: ['技巧', '方法', '诀窍', '要点', '细节', '笔法'] },
    { name: '名家赏析', keywords: ['名家', '大师', '王羲之', '颜真卿', '柳公权', '欧阳询', '赵孟頫'] },
    { name: '工具测评', keywords: ['毛笔', '宣纸', '墨汁', '砚台', '测评', '推荐', '工具'] },
    { name: '考级比赛', keywords: ['考级', '比赛', '考试', '等级', '参赛'] },
    { name: '练字打卡', keywords: ['打卡', '每日一练', '坚持', '练习', '练字'] },
    { name: '书法资讯', keywords: ['资讯', '新闻', '展览', '趋势', '最新'] },
  ],

  // ===== 视频格式分类规则 =====
  format_rules: [
    { name: '教学实操', keywords: ['教学', '教程', '步骤', '怎么', '实操', '手把手', '演示'] },
    { name: '作品展示', keywords: ['展示', '作品', '创作', '欣赏', '书写过程'] },
    { name: '技巧干货', keywords: ['技巧', '干货', '诀窍', '要点', '方法', '总结'] },
    { name: '工具测评', keywords: ['测评', '评测', '对比', '推荐', '工具', '开箱'] },
    { name: '观点解读', keywords: ['观点', '解读', '分析', '思考', '为什么', '误区'] },
  ],

  // ===== 模块开关 =====
  modules: {
    hero: true, works: true, techradar: false, hotwords: true,
    history: true, breakdown: true, viralGenes: true, insights: true,
    topics: true, titleGen: true, schedule: true, topicPerf: true,
    commentScripts: true, checklist: true, publishTime: true,
    titleFormulas: true, leadScripts: true, launchOps: true,
    audience: true, saturation: true,
  },

  // ===== 导航顺序 =====
  nav_order: ['hero', 'hotwords', 'breakdown', 'topics', 'topicPerf', 'publishTime', 'titleFormulas', 'leadScripts', 'launchOps', 'audience'],

  // ===== 导航标签 =====
  nav_labels: {
    hero: '总览', techradar: '工具雷达', hotwords: '热词',
    breakdown: '爆款拆解', topics: '选题', topicPerf: '选题表现',
    publishTime: '发布时间', titleFormulas: '标题公式',
    leadScripts: '口播话术', launchOps: '起号运营', audience: '人群洞察',
  },

  // ===== 标题公式 =====
  title_formulas: [
    { formula: '{keyword}入门，这3个错误90%的人都在犯', type: '痛点型' },
    { formula: '练了{num}年{keyword}，总结出这{num}个秘诀', type: '经验型' },
    { formula: '{keyword}写不好？因为你忽略了这个细节', type: '悬念型' },
    { formula: '零基础学{keyword}，第{num}天就能写成这样', type: '对比型' },
    { formula: '{keyword}的正确写法，看完就会了', type: '教学型' },
    { formula: '这幅{keyword}作品，行家看了都点赞', type: '展示型' },
    { formula: '{keyword}工具怎么选？{num}款实测对比', type: '测评型' },
    { formula: '为什么你的{keyword}总是写不好？原因在这', type: '诊断型' },
  ],

  title_formula_examples: [
    '楷书入门，这3个错误90%的人都在犯',
    '练了5年毛笔字，总结出这5个秘诀',
    '行书写不好？因为你忽略了这个细节',
    '零基础学书法，第30天就能写成这样',
  ],

  // ===== 口播话术 =====
  lead_scripts: [
    { hook: '你写的字为什么总是不好看？', body: '今天教你一个简单技巧，让你的字立刻提升一个档次。' },
    { hook: '练了这么久书法，你可能一直在走弯路。', body: '这几个常见误区，看看你中了几个。' },
    { hook: '零基础也能写好字，关键在于方法。', body: '跟着我这样练，一个月就能看到明显变化。' },
  ],

  lead_scripts_detail: [
    { target: '练字新手', text: '你写的字为什么总是不好看？今天教你一个简单技巧，让你的字立刻提升一个档次。关注我，每天分享书法干货。' },
    { target: '进阶爱好者', text: '练了这么久书法，你可能一直在走弯路。这几个常见误区，看看你中了几个。点赞收藏，避免踩坑。' },
    { target: '零基础人群', text: '零基础也能写好字，关键在于方法。跟着我这样练，一个月就能看到明显变化。评论区打卡，一起进步。' },
  ],

  // ===== 变现规则 =====
  monetization_rules: {
    primary: '书法教程+工具带货',
    methods: ['教程售卖', '文房四宝带货', '一对一教学', '作品定制', '考级辅导'],
    price_range: '99-999元',
  },

  // ===== 标签 =====
  hashtags: {
    core: '#书法 #练字 #传统文化 #书法教学 #每日一练',
    tool: '#毛笔字 #硬笔书法 #文房四宝 #楷书入门 #行书教程',
    list: ['#书法', '#练字', '#毛笔字', '#硬笔书法', '#楷书', '#行书', '#书法教学', '#每日一练', '#传统文化', '#写字']
  },
  script_templates: {
    hashtag_prefix: '#'
  },

  // ===== 起号运营任务 =====
  launch_tasks: [
    { day: '第1-3天', task: '确定细分方向（楷书/行书/硬笔），完善账号资料', priority: '高' },
    { day: '第4-7天', task: '每天发布2条教学短视频，测试内容方向', priority: '高' },
    { day: '第2周', task: '根据数据优化选题，建立固定更新节奏', priority: '中' },
    { day: '第3周', task: '开启直播练字，增强粉丝粘性', priority: '中' },
    { day: '第4周', task: '推出入门教程产品，开始私域转化', priority: '高' },
  ],

  launch_pitfalls: [
    '不要一开始就追求完美作品，先保证更新频率',
    '不要只展示作品不教学，教学内容更容易涨粉',
    '不要忽视硬笔书法市场，受众比毛笔更大',
    '工具带货要选自己用过的，避免翻车',
  ],

  // ===== 爆款基因（书法领域）=====
  viral_genes: [
    { gene: '前后对比', desc: '练字前后对比，视觉冲击力强', example: '零基础30天练字对比' },
    { gene: '慢动作演示', desc: '放慢书写过程，观众看得清学得会', example: '楷书基本笔画慢动作' },
    { gene: '纠错教学', desc: '指出常见错误，观众有代入感', example: '写楷书最容易犯的5个错误' },
    { gene: '名家临摹', desc: '临摹名家作品，自带流量', example: '临摹王羲之兰亭序' },
    { gene: '工具开箱', desc: '文房四宝开箱，满足好奇心', example: '100元和1000元毛笔对比' },
  ],

  // ===== 人群画像 =====
  audience_personas: [
    { name: '学生党', category: '应试练字', proportion: 30, age: '12-22岁', gender: '男女均衡', traits: ['学生','考级','卷面分','硬笔'], needs: ['快速提升卷面分','考级通过','字帖推荐'], content_pref: '硬笔教学、考级辅导、每日打卡', monetization: '字帖、课程、文具' },
    { name: '职场人', category: '兴趣修身', proportion: 28, age: '25-40岁', gender: '女性偏多(60%)', traits: ['职场','减压','签名','行书'], needs: ['减压放松','签名好看','碎片时间练习'], content_pref: '快速练字技巧、行书教学、工具测评', monetization: '教程、工具、社群' },
    { name: '退休人群', category: '兴趣社交', proportion: 22, age: '55-70岁', gender: '男女均衡', traits: ['退休','兴趣','社交','毛笔'], needs: ['兴趣爱好','社交活动','作品展示'], content_pref: '毛笔入门、作品展示、名家赏析', monetization: '工具、社群、线下活动' },
    { name: '书法爱好者', category: '进阶提升', proportion: 20, age: '20-50岁', gender: '男性偏多(55%)', traits: ['爱好者','进阶','临帖','创作'], needs: ['进阶提升','技法交流','作品点评'], content_pref: '名家赏析、技巧干货、临帖指导', monetization: '高阶课程、工具、一对一' },
  ],

  // ===== 技术雷达配置（书法领域用工具雷达替代）=====
  tech_radar: {
    enabled: false,
    title: '书法工具雷达',
    sources: ['淘宝热销', '京东排行', '小红书种草'],
  },

  // ===== 饱和度配置 =====
  saturation: {
    low_threshold: 30,
    medium_threshold: 60,
    high_threshold: 80,
  },

  // ===== 专属模块（AI领域专属，书法领域不显示）=====
  domain_specific_modules: ['techradar', 'viralGenes'],
};

// 工具函数：读取配置，带兜底
function cfg(path, defaultValue) {
  try {
    var keys = path.split('.');
    var val = window.DOMAIN_CONFIG;
    for (var i = 0; i < keys.length; i++) {
      val = val[keys[i]];
      if (val === undefined) return defaultValue;
    }
    return val;
  } catch (e) {
    return defaultValue;
  }
}

// 领域守卫：AI专属模块在非AI领域显示提示
function domainGuard(moduleId, renderFn) {
  var specific = cfg('domain_specific_modules', []);
  if (specific.indexOf(moduleId) >= 0 && cfg('id') !== 'ai') {
    return function(container, data) {
      if (container) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.4);">该模块为AI领域专属，当前领域暂不适用</div>';
      }
    };
  }
  return renderFn;
}
