# v3 架构说明

## 设计目标
换领域（如美妆/健身/财经）时，只需修改 `config/domain.js`，不碰核心代码。

## 目录结构
```
v3/
├── config/
│   ├── domain.js          # 领域配置（换领域唯一需改的文件）
│   └── domain.json        # 后端用配置（与domain.js同步）
├── data/
│   └── data.js            # 数据（由analyzer.py生成）
├── src/
│   ├── core/
│   │   ├── framework.js   # 核心框架：模块注册制、防御性渲染、安全数据访问
│   │   ├── state.js       # localStorage状态管理
│   │   └── renderer.js    # 通用渲染器：数字动画/格式化/标签/进度条
│   ├── effects/
│   │   ├── glow.js        # UFO动态光晕（自动扫描[data-glow]元素）
│   │   └── login.js       # 登录页+Logo特效+滚动模糊渐显
│   ├── styles/
│   │   ├── base.css       # 变量/重置/布局/排版/响应式
│   │   ├── components.css # 按钮/标签/表格/模态框/进度条
│   │   ├── glass.css      # 液态玻璃+UFO光晕CSS
│   │   ├── login.css      # 登录页+Logo特效
│   │   └── modules.css    # 业务模块样式
│   └── modules/           # 17个业务模块（每个独立文件）
│       ├── hero.js        # 顶部统计
│       ├── hotwords.js    # 热词表
│       ├── works.js       # 爆款作品
│       ├── topics.js      # 选题建议
│       ├── techradar.js   # 技术雷达
│       ├── breakdown.js   # 爆款拆解
│       ├── viralGenes.js  # 爆款基因
│       ├── publishTime.js # 发布时间分析
│       ├── titleFormulas.js # 标题公式
│       ├── leadScripts.js # 私域引流话术
│       ├── launchOps.js   # 起号运营
│       ├── audience.js    # 人群画像
│       ├── engagement.js  # 互动分析
│       ├── topicPerf.js   # 选题表现
│       ├── kanban.js      # 选题看板
│       ├── credit.js      # API积分监控
│       ├── comparison.js  # 平台对比
│       ├── favorites.js   # 收藏
│       ├── scriptGen.js   # 脚本生成
│       └── _helpers.js    # 公共辅助函数
├── scripts/
│   ├── analyzer.py        # 通用分析器（与领域无关）
│   └── domain/
│       └── ai.py          # AI领域插件（换领域时替换）
└── index.html             # 极简入口（只引资源，无内联业务逻辑）
```

## 换领域步骤
1. 复制 `config/domain.js`，修改领域名称、关键词、模块开关、配色、品牌、人群画像
2. 复制 `scripts/domain/ai.py` 为 `scripts/domain/新领域.py`，修改领域特有分析逻辑
3. 修改 `config/domain.json` 中 `domain` 字段为新领域名
4. 运行 `python scripts/analyzer.py` 生成新数据
5. 完成！核心框架、特效、样式完全复用

## 核心特性
- **模块注册制**：每个模块通过 `Module.register()` 注册，框架自动渲染
- **防御性渲染**：缺数据自动隐藏section，不崩溃
- **安全数据访问**：`Safe.get/arr/num/str` 防止undefined链式报错
- **特效独立**：glow.js/login.js与业务逻辑完全解耦
- **CSS分层**：基础/组件/主题/模块 四层分离
- **后端插件化**：analyzer.py通用 + domain/ai.py领域特有

## 已知问题
- topics/breakdown/publishTime/smallViral 4个模块渲染内容为空（需进一步调试函数作用域）
- 其余13个模块正常渲染
