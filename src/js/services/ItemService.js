import http from '../api/http.js';

const CACHE_TTL_MS = 60 * 1000;
const STORAGE_CACHE_PREFIX = 'devforge_api_cache_';
const LOCAL_TOOLS_KEY = 'devforge_local_tools';
const LIKES_OVERRIDES_KEY = 'devforge_likes_overrides';

export class ItemService {
  constructor() {
    this.memoryCache = new Map();
  }

  _buildCacheKey(endpoint, params = {}) {
    const query = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return `${endpoint}?${query}`;
  }

  _getFromCache(key) {
    const now = Date.now();
    if (this.memoryCache.has(key)) {
      const hit = this.memoryCache.get(key);
      if (now - hit.timestamp < CACHE_TTL_MS) {
        return hit.data;
      }
      this.memoryCache.delete(key);
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_CACHE_PREFIX}${key}`);
      if (raw) {
        const hit = JSON.parse(raw);
        if (now - hit.timestamp < CACHE_TTL_MS) {
          this.memoryCache.set(key, hit);
          return hit.data;
        }
        localStorage.removeItem(`${STORAGE_CACHE_PREFIX}${key}`);
      }
    } catch {
      // Ignore storage restrictions
    }

    return null;
  }

  _saveToCache(key, data) {
    const entry = { timestamp: Date.now(), data };
    this.memoryCache.set(key, entry);
    try {
      localStorage.setItem(`${STORAGE_CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // Ignore storage quota errors
    }
  }

  invalidateCache() {
    this.memoryCache.clear();
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_CACHE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore storage errors
    }
  }

  _mapSortParams(sort) {
    switch (sort) {
      case 'name_asc':
        return { _sort: 'title', _order: 'asc' };
      case 'name_desc':
        return { _sort: 'title', _order: 'desc' };
      case 'fastest':
        return { _sort: 'latencyMs', _order: 'asc' };
      case 'popular':
      default:
        return { _sort: 'likes', _order: 'desc' };
    }
  }

  async _loadStaticMergedTools() {
    const res = await fetch('./api/db.json');
    if (!res.ok) {
      throw new Error('Failed to load fallback dataset');
    }
    const db = await res.json();
    const localAdded = JSON.parse(localStorage.getItem(LOCAL_TOOLS_KEY) || '[]');
    const likesOverrides = JSON.parse(localStorage.getItem(LIKES_OVERRIDES_KEY) || '{}');

    return [...db.tools, ...localAdded].map((tool) => ({
      ...tool,
      likes: likesOverrides[String(tool.id)] ?? tool.likes,
    }));
  }

  async _fetchFallbackTools({ category, q, sort, page, limit }) {
    let items = await this._loadStaticMergedTools();

    if (category && category !== 'all') {
      items = items.filter((t) => t.category === category);
    }
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(needle) ||
          t.description.toLowerCase().includes(needle) ||
          t.categoryLabel.toLowerCase().includes(needle),
      );
    }

    items.sort((a, b) => {
      if (sort === 'name_asc') return a.title.localeCompare(b.title);
      if (sort === 'name_desc') return b.title.localeCompare(a.title);
      if (sort === 'fastest') return (a.latencyMs || 1) - (b.latencyMs || 1);
      return (b.likes || 0) - (a.likes || 0);
    });

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * limit;

    return {
      items: items.slice(start, start + limit),
      total,
      page: safePage,
      limit,
      totalPages,
      fromCache: false,
      isOfflineFallback: true,
    };
  }

  async getTools({ category = 'all', q = '', sort = 'popular', page = 1, limit = 9 } = {}) {
    const sortParams = this._mapSortParams(sort);
    const params = {
      _page: page,
      _limit: limit,
      ...sortParams,
    };

    if (category && category !== 'all') {
      params.category = category;
    }
    if (q && q.trim()) {
      params.q = q.trim();
    }

    const cacheKey = this._buildCacheKey('/tools', params);
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const response = await http.get('/tools', { params });
      const total = Number(response.headers['x-total-count'] || response.data.length);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const result = {
        items: response.data,
        total,
        page,
        limit,
        totalPages,
        fromCache: false,
        isOfflineFallback: false,
      };
      this._saveToCache(cacheKey, result);
      return result;
    } catch {
      const fallbackResult = await this._fetchFallbackTools({ category, q, sort, page, limit });
      this._saveToCache(cacheKey, fallbackResult);
      return fallbackResult;
    }
  }

  async getToolById(id) {
    const cacheKey = this._buildCacheKey(`/tools/${id}`);
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await http.get(`/tools/${id}`);
      this._saveToCache(cacheKey, response.data);
      return response.data;
    } catch {
      const items = await this._loadStaticMergedTools();
      const found = items.find((item) => String(item.id) === String(id));
      if (!found) {
        throw new Error(`Tool #${id} not found`);
      }
      return found;
    }
  }

  async updateLikes(id, likes, simulateFailure = false) {
    if (simulateFailure) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      throw new Error('Simulated 503 Service Unavailable during optimistic like sync');
    }

    try {
      const response = await http.patch(`/tools/${id}`, { likes });
      this.invalidateCache();
      return response.data;
    } catch (err) {
      const isStaticHost =
        window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isStaticHost) {
        const overrides = JSON.parse(localStorage.getItem(LIKES_OVERRIDES_KEY) || '{}');
        overrides[String(id)] = likes;
        localStorage.setItem(LIKES_OVERRIDES_KEY, JSON.stringify(overrides));
        this.invalidateCache();
        return { id, likes };
      }
      throw err;
    }
  }

  async createTool(payload) {
    const newTool = {
      ...payload,
      likes: 1,
      latencyMs: Number(payload.latencyMs) || 2,
      badge: `${Number(payload.latencyMs) || 2}ms Client`,
      badgeType: 'success',
      tags: ['[Community] Verified'],
    };

    try {
      const response = await http.post('/tools', newTool);
      this.invalidateCache();
      return response.data;
    } catch (err) {
      const localAdded = JSON.parse(localStorage.getItem(LOCAL_TOOLS_KEY) || '[]');
      const offlineItem = { ...newTool, id: Date.now() };
      localAdded.push(offlineItem);
      localStorage.setItem(LOCAL_TOOLS_KEY, JSON.stringify(localAdded));
      this.invalidateCache();
      throw err;
    }
  }
}

export default ItemService;
