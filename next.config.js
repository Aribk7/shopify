/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['openai', '@pinecone-database/pinecone'],
  },
}

module.exports = nextConfig

