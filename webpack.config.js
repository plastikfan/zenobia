
const path = require('path');
const webpack = require('webpack');
const { getIfUtils } = require('webpack-config-utils');
const nodeExternals = require('webpack-node-externals');

module.exports = (env) => {
  const {
    ifProduction
  } = getIfUtils(env);

  const mode = ifProduction('production', 'development');
  console.log('>>> Zenobia Webpack Environment mode: ' + env.mode);

  return {
    devtool: 'source-map',
    entry: {
      index: './lib/index.ts'
    },
    target: 'node',
    mode: mode,
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          use: 'ts-loader'
        },
        {
          test: /\.json$/,
          use: 'json-loader'
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }),
      new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true
      })
    ],
    resolve: {
      extensions: ['.ts', '.js', '.json']
    },
    watchOptions: {
      ignored: /node_modules/
    },
    output: {
      filename: 'zenobia-bundle.js',
      sourceMapFilename: 'zenobia-bundle.js.map',
      path: path.join(__dirname, 'dist'),
      libraryTarget: 'commonjs'
    }
  };
};
