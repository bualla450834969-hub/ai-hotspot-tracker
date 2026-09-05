"""
通用分析器 — 与领域无关的数据分析引擎
从config/domain.json读取配置，调用领域插件处理特定逻辑
输出dashboard_data.json供前端使用
"""
import json
import os
import sys
from datetime import datetime

class GenericAnalyzer:
    def __init__(self, config_path='config/domain.json', data_dir='data'):
        self.config_path = config_path
        self.data_dir = data_dir
        self.config = self._load_config()
        self.domain_plugin = self._load_plugin()

    def _load_config(self):
        with open(self.config_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _load_plugin(self):
        """加载领域插件（如domain/ai.py）"""
        domain_name = self.config.get('domain', 'ai')
        plugin_path = os.path.join(os.path.dirname(__file__), 'domain', f'{domain_name}.py')
        if os.path.exists(plugin_path):
            import importlib.util
            spec = importlib.util.spec_from_file_location(f'domain_{domain_name}', plugin_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module
        return None

    def load_raw_data(self):
        """加载原始采集数据（热词、作品）"""
        data = {}
        for name in ['hotwords', 'works']:
            path = os.path.join(self.data_dir, f'{name}.json')
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    data[name] = json.load(f)
        return data

    def analyze(self, raw_data=None):
        """执行通用分析流程"""
        if raw_data is None:
            raw_data = self.load_raw_data()

        hotwords = raw_data.get('hotwords', [])
        works = raw_data.get('works', [])

        result = {
            'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'hotwords': hotwords,
            'works': works,
            'summary': self._gen_summary(hotwords, works),
        }

        # 通用分析（所有领域共用）
        result.update(self._common_analysis(hotwords, works))

        # 领域插件分析（AI特有：技术雷达、信息差等）
        if self.domain_plugin and hasattr(self.domain_plugin, 'analyze'):
            domain_result = self.domain_plugin.analyze(hotwords, works, self.config)
            result.update(domain_result)

        return result

    def _gen_summary(self, hotwords, works):
        """通用摘要"""
        platforms = set(w.get('platform', '') for w in works)
        categories = set(h.get('category', '') for h in hotwords)
        total_likes = sum(w.get('likeCount', 0) for w in works)
        return {
            'total_hotwords': len(hotwords),
            'total_works': len(works),
            'platforms': list(platforms),
            'categories': list(categories),
            'total_likes': total_likes,
            'avg_likes': round(total_likes / len(works), 0) if works else 0,
        }

    def _common_analysis(self, hotwords, works):
        """通用分析：去重、互动率、发布时间、标题公式"""
        # 去重
        seen = set()
        unique_works = []
        for w in works:
            key = w.get('workId') or w.get('title', '')
            if key not in seen:
                seen.add(key)
                unique_works.append(w)

        # 互动率
        total_comments = sum(w.get('commentCount', 0) for w in unique_works)
        total_collects = sum(w.get('collectCount', 0) for w in unique_works)
        total_likes = sum(w.get('likeCount', 0) for w in unique_works)
        engagement = {
            'avg_comment_rate': round(total_comments / max(total_likes, 1) * 100, 1),
            'avg_collect_rate': round(total_collects / max(total_likes, 1) * 100, 1),
            'total_comments': total_comments,
            'total_collects': total_collects,
        }

        # 发布时间分布
        publish_dist = {}
        for w in unique_works:
            pt = w.get('publishTime', '')
            if pt:
                hour = pt.split(' ')[-1].split(':')[0] if ' ' in pt else '00'
                publish_dist[hour] = publish_dist.get(hour, 0) + 1

        # 标题公式提取
        title_patterns = {}
        for w in unique_works:
            title = w.get('title', '')
            if '！' in title or '!' in title:
                title_patterns['感叹句'] = title_patterns.get('感叹句', 0) + 1
            if '？' in title or '?' in title:
                title_patterns['疑问句'] = title_patterns.get('疑问句', 0) + 1
            if '教程' in title or '怎么' in title or '如何' in title:
                title_patterns['教程型'] = title_patterns.get('教程型', 0) + 1

        return {
            'works': unique_works,
            'engagement_analysis': engagement,
            'publish_time_dist': publish_dist,
            'title_formulas_extracted': [{'pattern': k, 'count': v} for k, v in sorted(title_patterns.items(), key=lambda x: -x[1])],
        }

    def save(self, result, output_path=None):
        """保存分析结果"""
        if output_path is None:
            output_path = os.path.join(self.data_dir, 'dashboard_data.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        # 同时生成data.js供前端直接引用
        js_path = os.path.join(self.data_dir, 'data.js')
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(f'window.DASHBOARD_DATA = {json.dumps(result, ensure_ascii=False)};')

        print(f"分析结果已保存: {output_path}")
        return output_path


if __name__ == '__main__':
    analyzer = GenericAnalyzer()
    result = analyzer.analyze()
    analyzer.save(result)
    print(f"分析完成: {result['summary']}")
