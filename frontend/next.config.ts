import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config, { isServer }) => {
    const webpack = require('webpack');
    
    config.plugins = config.plugins || [];
    
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.test\.(js|ts|tsx)$/,
        contextRegExp: /node_modules/,
      })
    );

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /thread-stream\/test\/.*\.test\.js$/,
      })
    );

    return config;
  },
  serverExternalPackages: ['pino', 'thread-stream'],
};

export default nextConfig;
