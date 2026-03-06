/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // globe.gl uses Three.js which has some canvas-related modules
  webpack: (config) => {
    config.externals = config.externals || []
    return config
  },
}

export default nextConfig
