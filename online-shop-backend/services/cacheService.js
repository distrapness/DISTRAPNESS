const cache = {};

function get(key) {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() > item.expiry) {
    delete cache[key];
    return null;
  }
  return item.data;
}

function set(key, data, ttlMs = 300000) { // Default 5 mins TTL
  cache[key] = {
    data,
    expiry: Date.now() + ttlMs
  };
}

function del(key) {
  delete cache[key];
}

function clearPattern(pattern) {
  const keys = Object.keys(cache);
  for (const key of keys) {
    if (key.includes(pattern)) {
      delete cache[key];
    }
  }
}

function clearAll() {
  for (const key in cache) {
    delete cache[key];
  }
}

module.exports = {
  get,
  set,
  del,
  clearPattern,
  clearAll
};
