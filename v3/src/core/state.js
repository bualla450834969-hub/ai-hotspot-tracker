/**
 * 状态管理 — localStorage持久化
 * 看板状态、收藏、选题性能追踪、清单进度
 */
(function() {
  'use strict';

  const PREFIX = 'hotspot_';

  const State = {
    get(key, def) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : def;
      } catch (e) { return def; }
    },
    set(key, val) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
    },

    // ===== 选题看板状态 =====
    getTopicStatus(title) {
      const all = this.get('topic_status', {});
      return all[title] || '待拍摄';
    },
    setTopicStatus(title, status) {
      const all = this.get('topic_status', {});
      all[title] = status;
      this.set('topic_status', all);
    },
    cycleTopicStatus(title) {
      const order = ['待拍摄', '拍摄中', '已发布', '已归档'];
      const cur = this.getTopicStatus(title);
      const next = order[(order.indexOf(cur) + 1) % order.length];
      this.setTopicStatus(title, next);
      return next;
    },
    getAllTopicStatus() {
      return this.get('topic_status', {});
    },

    // ===== 收藏 =====
    getFavorites() {
      return this.get('favorites', []);
    },
    isFavorite(workId) {
      return this.getFavorites().includes(workId);
    },
    toggleFavorite(workId) {
      const favs = this.getFavorites();
      const idx = favs.indexOf(workId);
      if (idx >= 0) favs.splice(idx, 1);
      else favs.push(workId);
      this.set('favorites', favs);
      return idx < 0;
    },

    // ===== 选题性能追踪 =====
    getPerfData() {
      return this.get('topic_perf', {});
    },
    recordPerf(title, data) {
      const all = this.getPerfData();
      all[title] = { ...all[title], ...data, recorded_at: new Date().toISOString() };
      this.set('topic_perf', all);
    },
    calcHitRate() {
      const perf = this.getPerfData();
      const total = Object.keys(perf).length;
      const hits = Object.values(perf).filter(p => p.views > 10000).length;
      return total ? Math.round(hits / total * 100) : 0;
    },

    // ===== 拍摄清单进度 =====
    getChecklist() {
      return this.get('checklist', {});
    },
    toggleCheck(topicTitle, itemIndex) {
      const all = this.getChecklist();
      if (!all[topicTitle]) all[topicTitle] = {};
      all[topicTitle][itemIndex] = !all[topicTitle][itemIndex];
      this.set('checklist', all);
      return all[topicTitle][itemIndex];
    },
    getChecklistProgress(topicTitle) {
      const data = this.getChecklist()[topicTitle] || {};
      const done = Object.values(data).filter(Boolean).length;
      const total = 10; // 固定10步
      return { done, total, percent: Math.round(done / total * 100) };
    },

    // ===== 积分追踪 =====
    getCreditUsage() {
      return this.get('credit_usage', { used: 0, total: 1000, history: [] });
    },
    addCreditUsage(points) {
      const data = this.getCreditUsage();
      data.used += points;
      data.history.push({ date: new Date().toISOString(), points });
      this.set('credit_usage', data);
      return data;
    },
  };

  window.State = State;
})();
