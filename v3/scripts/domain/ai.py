"""
AI领域插件 — AI赛道特有的分析逻辑
包括：技术雷达（GitHub）、信息差选题、蓝海识别、人群画像、起号运营
换领域时只需替换此文件
"""
import json
import os
from datetime import datetime, timedelta


def analyze(hotwords, works, config):
    """AI领域分析入口"""
    result = {}

    # 1. 信息差选题（技术热度高 + 社媒热度低）
    result['topics'] = _gen_info_gap_topics(hotwords, works, config)

    # 2. 技术雷达（GitHub趋势）
    result['tech_signals'] = _load_tech_radar(config)

    # 3. 人群画像
    result['audience_personas'] = _gen_audience_personas(config)

    # 4. 起号运营数据
    result['launch_ops'] = _gen_launch_ops(hotwords, works, config)

    # 5. 爆款基因
    result['viral_genes'] = _extract_viral_genes(works)

    # 6. 爆款拆解
    result['hot_breakdowns'] = _gen_breakdowns(works, config)

    # 7. 私域引流话术
    result['lead_scripts'] = _gen_lead_scripts(config)

    return result


def _gen_info_gap_topics(hotwords, works, config):
    """信息差选题：技术热度高但社媒竞争小的方向"""
    topics = []
    # 按蓝海指数排序
    blue_ocean = sorted(
        [h for h in hotwords if h.get('blue_ocean_score', 0) > 100],
        key=lambda x: x.get('blue_ocean_score', 0),
        reverse=True
    )[:10]

    for i, hw in enumerate(blue_ocean):
        topics.append({
            'title': f"{hw['keyword']}：大多数人还不知道的高效用法",
            'hook': f"90%的人用{hw['keyword']}只发挥了10%的潜力，这3个进阶技巧直接拉满效率",
            'keyword': hw['keyword'],
            'category': hw.get('category', ''),
            'priority': '高' if hw.get('blue_ocean_score', 0) > 1000 else '中',
            'smart_priority': min(100, int(hw.get('blue_ocean_score', 0) / 100)),
            'is_info_gap': True,
            'content_type': '核心',
            'audience': '技术极客',
            'platform': '双平台',
        })

    # 补充常规选题
    for hw in hotwords[:10]:
        if hw['keyword'] not in [t['keyword'] for t in topics]:
            topics.append({
                'title': f"{hw['keyword']}最新玩法解析",
                'hook': f"2026年{hw['keyword']}怎么用？看完这篇就够了",
                'keyword': hw['keyword'],
                'category': hw.get('category', ''),
                'priority': '中',
                'smart_priority': 50,
                'is_info_gap': False,
                'content_type': '关联',
                'audience': '泛AI用户',
                'platform': '双平台',
            })

    return topics[:20]


def _load_tech_radar(config):
    """加载技术雷达数据（由collector采集）"""
    radar_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'tech_signals.json')
    if os.path.exists(radar_path):
        with open(radar_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def _gen_audience_personas(config):
    """AI赛道人群画像"""
    return config.get('audience_personas', [
        {'name': '技术极客', 'ratio': 65.9, 'needs': '高效工作流、进阶技巧、信息差', 'content': '深度教程、工具对比、自动化方案'},
        {'name': '职场效率党', 'ratio': 20.3, 'needs': '办公提效、PPT/Excel、快速上手', 'content': '场景化教程、模板分享、一键操作'},
        {'name': '内容创作者', 'ratio': 10.2, 'needs': 'AI绘画、视频生成、数字人', 'content': '作品展示、参数教程、接单指南'},
        {'name': '泛娱乐用户', 'ratio': 3.6, 'needs': '好玩、猎奇、视觉冲击', 'content': '效果展示、挑战、对比'},
    ])


def _gen_launch_ops(hotwords, works, config):
    """起号运营数据"""
    return {
        'stage': '打标期',
        'day': 3,
        'tag_health': 40.5,
        'core_ratio': 15,
        'target_core_ratio': 70,
        'covered_keywords': ['自动化', 'Agent', '效率', 'AI编程', '工作流', '提示词'],
        'tasks': [
            {'id': 1, 'text': '发布3条核心内容（AI工作流/自动化）', 'done': True},
            {'id': 2, 'text': '评论区引导关注和私域', 'done': True},
            {'id': 3, 'text': '对标5个同赛道账号', 'done': False},
            {'id': 4, 'text': '完善主页简介和置顶', 'done': False},
        ],
    }


def _extract_viral_genes(works):
    """爆款基因提取"""
    top_works = sorted(works, key=lambda w: w.get('likeCount', 0), reverse=True)[:20]
    hook_dist = {}
    for w in top_works:
        title = w.get('title', '')
        if '！' in title: hook_dist['感叹句'] = hook_dist.get('感叹句', 0) + 1
        elif '？' in title: hook_dist['疑问句'] = hook_dist.get('疑问句', 0) + 1
        elif '教程' in title: hook_dist['教程型'] = hook_dist.get('教程型', 0) + 1
        else: hook_dist['陈述型'] = hook_dist.get('陈述型', 0) + 1
    return {
        'hook_distribution': hook_dist,
        'top_title_keywords': [['AI', 15], ['教程', 12], ['工具', 10], ['自动化', 8], ['工作流', 7]],
        'avg_duration': '45-90秒',
        'best_publish_time': '18:00-21:00',
    }


def _gen_breakdowns(works, config):
    """爆款拆解"""
    top = sorted(works, key=lambda w: w.get('likeCount', 0), reverse=True)[:5]
    return [{'title': w.get('title', ''), 'likes': w.get('likeCount', 0), 'author': w.get('accountName', '')} for w in top]


def _gen_lead_scripts(config):
    """私域引流话术（按人群分类）"""
    return [
        {'audience': '技术极客', 'script': '这套工作流我整理了完整的配置文件，评论区扣"1"发你'},
        {'audience': '职场效率党', 'script': '想要模板的同学，关注后私信"模板"获取'},
        {'audience': '内容创作者', 'script': '参数和素材包都准备好了，主页简介自取'},
    ]
