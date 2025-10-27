/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      // Suppress MetaMask SDK React Native warnings
      '@react-native-async-storage/async-storage': false,
      // Fix WalletConnect ESM module compatibility during build
      '@walletconnect/ethereum-provider': false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Ignore MetaMask SDK warnings about React Native dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
    ];

    return config;
  },
  transpilePackages: ['@rainbow-me/rainbowkit', '@vanilla-extract/css'],
  experimental: {
    optimizePackageImports: ['@wagmi/connectors'],
  },
  // Increase static generation timeout for complex pages
  staticPageGenerationTimeout: 300,
}

module.exports = nextConfig
