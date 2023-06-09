const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // ProvidePlugin for Buffer
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        })
      );

      // Aliases for other modules
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        assert: require.resolve("assert/"),
      };

      return webpackConfig;
    },
  },
};
