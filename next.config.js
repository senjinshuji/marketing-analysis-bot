/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium']
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'puppeteer-core', '@sparticuz/chromium'];
    return config;
  }
}

module.exports = nextConfig