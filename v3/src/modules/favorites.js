/**
 * modules/favorites.js
 * 函数: getFavorites, isFavorite, toggleFavorite, renderFavorites, removeFavorite
 * 依赖: 无
 */
(function() {
  'use strict';

  // getFavorites
  function getFavorites() {
    return JSON.parse(localStorage.getItem('viral_favorites') || '[]');
  }

  // isFavorite
  function isFavorite(i) { const favs = JSON.parse(localStorage.getItem("viral_favorites") || "[]"); return favs.some(f => f.title === DATA.hot_breakdowns[i]?.title); }

  // toggleFavorite
  function toggleFavorite(index) {
    const favs = getFavorites();
    const work = DATA.hot_breakdowns[index];
    const exists = favs.findIndex(function(f) { return f.title === work.title; });
    if (exists >= 0) { favs.splice(exists, 1); } else { favs.push(work); }
    localStorage.setItem('viral_favorites', JSON.stringify(favs));
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
    localStorage.setItem('viral_favorites', JSON.stringify(favs));
    renderFavorites();
    renderBreakdowns();
  }

  window.getFavorites = getFavorites;
  window.isFavorite = isFavorite;
  window.toggleFavorite = toggleFavorite;
  window.renderFavorites = renderFavorites;
  window.removeFavorite = removeFavorite;
})();
