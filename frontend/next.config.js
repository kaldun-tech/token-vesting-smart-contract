/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      // Suppress MetaMask SDK React Native warnings
      '@react-native-async-storage/async-storage': false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Ignore MetaMask SDK warnings about React Native dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
    ];

    return config;
  },
  transpilePackages: ['@rainbow-me/rainbowkit', '@vanilla-extract/css'],
}

module.exports = nextConfig
