// karma.conf.cjs
module.exports = function (config) {
  config.set({
    frameworks: ['jasmine', 'webpack'],
    files: [
      { pattern: 'src/**/*.ts', type: 'js', ignore: ['**/*.d.ts'] },
      { pattern: '__tests__/browser/**/*.ts', type: 'js' },
    ],
    preprocessors: {
      'src/**/!(*d).ts': ['webpack'],
      '__tests__/browser/**/*.ts': ['webpack'],
    },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          buffer: require.resolve('buffer/'),
          vm: require.resolve('vm-browserify'),
        },
        modules: ['node_modules', 'src'],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: [/node_modules/, /\.d\.ts$/],
            use: {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.browser-test.json',
                transpileOnly: true,
              },
            },
          },
        ],
      },
    },
    plugins: ['karma-jasmine', 'karma-chrome-launcher', 'karma-webpack'],
    reporters: ['progress'],
    browsers: ['ChromeHeadless'],
    client: {
      jasmine: {
        random: false,
      },
    },
    singleRun: true,
    logLevel: config.LOG_INFO,
    browserNoActivityTimeout: 60000,
  });
};
