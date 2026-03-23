const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/',
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {},
}

module.exports = withPWA(nextConfig)
