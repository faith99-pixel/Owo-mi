module.exports = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // OneDrive can invalidate .next cache files during dev; disable fs cache.
      config.cache = false
    }
    return config
  }
}
