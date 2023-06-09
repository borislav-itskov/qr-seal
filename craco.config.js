module.exports = {
  webpack: {
    alias: {
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer/"),
      assert: require.resolve("assert/"),
      stream: require.resolve("stream-browserify"),
    },
  },
};
