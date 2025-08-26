/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imghippo.com',
      }
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pdfkit', 'fontkit', 'restructure', 'iconv-lite');
    }
    return config;
  }
};

module.exports = nextConfig;
