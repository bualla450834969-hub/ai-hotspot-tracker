/**
 * modules/titleFormulas.js
 * 函数: renderTitleFormulas, copyFormula, genTitleVariants
 * 依赖: ['title_formulas_extracted']
 */
(function() {
  'use strict';

  // renderTitleFormulas
  function renderTitleFormulas() {
    var formulas = DATA.title_formulas || [];
    var examples = cfg('title_formula_examples', {
      '感叹句': '太绝了！这个工具让我效率提升10倍',
      '教程型': '手把手教你做XX，3分钟上手',
      '疑问句': '还在手动调参？这个方法90%的人不知道',
      '否定警告': '千万别再用XX了，这3个坑踩过的人都哭了',
      '极限词': '2026最强工具排行，第一名居然是它',
      '实测型': '我用这套工作流跑了一周，效率提升了200%',
      '免费型': '免费白嫖！这款工具比付费的还好用',
    });
    var html = formulas.map(function(f) {
      var name = f[0], count = f[1];
      var ex = examples[name] || '点击查看套用示例';
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
          setTimeout(function(){ el.querySelector('.gen-copy-btn').textContent = '复制'; }, 1500);
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
