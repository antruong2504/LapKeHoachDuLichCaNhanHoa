const cacheStore = new Map();
const MAX_CACHE_ENTRIES = 250;

/**
 * Middleware cache phản hồi JSON cho các endpoint GET công khai.
 * Giúp giảm độ trễ mạng từ Cloud DB (~1.5-4s) xuống ~2-10ms cho các lần truy cập lặp lại.
 */
export const cacheResponse = (prefix, ttlMs = 120_000) => (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `${prefix}${req.originalUrl}`;
  const cached = cacheStore.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return res.status(200).json(cached.payload);
  }

  if (cached) {
    cacheStore.delete(key);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
      if (cacheStore.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = cacheStore.keys().next().value;
        cacheStore.delete(oldestKey);
      }
      cacheStore.set(key, {
        payload: body,
        expiresAt: Date.now() + ttlMs,
      });
      res.set('X-Cache', 'MISS');
      res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    }
    return originalJson(body);
  };

  next();
};

/**
 * Xóa toàn bộ cache theo danh sách tiền tố (prefix)
 */
export const invalidateCache = (prefixes = []) => {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  for (const key of cacheStore.keys()) {
    if (list.some((p) => key.startsWith(p))) {
      cacheStore.delete(key);
    }
  }
};

/**
 * Middleware tự động xóa cache liên quan khi có thao tác thêm/sửa/xóa thành công
 */
export const invalidateOnMutation = (prefixes) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      invalidateCache(prefixes);
    }
  });
  next();
};
