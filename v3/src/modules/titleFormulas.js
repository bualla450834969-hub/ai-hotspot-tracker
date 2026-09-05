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
    var examples = {
      '感叹句': '太绝了！这个AI工具让我效率提升10倍',
      '教程型': '手把手教你用AI做XX，3分钟上手',
      '疑问句': 'AI做图还在手动调参？这个方法90%的人不知道',
      '否定警告': '千万别再用XX做AI了，这3个坑踩过的人都哭了',
      '极限词': '2026最强AI工具排行，第一名居然是它',
      '实测型': '我用AI工作流跑了一周，效率提升了200%',
      '免费型': '免费白嫖！这款AI工具比付费的还好用',
    };
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
})();
