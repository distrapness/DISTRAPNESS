let cache = {
  products: null,
  productsTimestamp: 0,
  categories: null,
  categoriesTimestamp: 0,
  banners: null,
  bannersTimestamp: 0,
};

const CACHE_FRESH_DURATION = 30 * 1000; // 30 seconds
const CACHE_EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedProducts = () => {
  if (cache.products && (Date.now() - cache.productsTimestamp < CACHE_EXPIRY_DURATION)) {
    return {
      data: cache.products,
      isFresh: (Date.now() - cache.productsTimestamp) < CACHE_FRESH_DURATION
    };
  }
  return null;
};

export const setCachedProducts = (products) => {
  cache.products = products;
  cache.productsTimestamp = Date.now();
};

export const getCachedCategories = () => {
  if (cache.categories && (Date.now() - cache.categoriesTimestamp < CACHE_EXPIRY_DURATION)) {
    return {
      data: cache.categories,
      isFresh: (Date.now() - cache.categoriesTimestamp) < CACHE_FRESH_DURATION
    };
  }
  return null;
};

export const setCachedCategories = (categories) => {
  cache.categories = categories;
  cache.categoriesTimestamp = Date.now();
};

export const getCachedBanners = () => {
  if (cache.banners && (Date.now() - cache.bannersTimestamp < CACHE_EXPIRY_DURATION)) {
    return {
      data: cache.banners,
      isFresh: (Date.now() - cache.bannersTimestamp) < CACHE_FRESH_DURATION
    };
  }
  return null;
};

export const setCachedBanners = (banners) => {
  cache.banners = banners;
  cache.bannersTimestamp = Date.now();
};
