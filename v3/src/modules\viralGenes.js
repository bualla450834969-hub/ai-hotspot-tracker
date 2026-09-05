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
