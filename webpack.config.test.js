const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  devtool: 'source-map',
  mode: 'development',
  entry: ['./tests/all-tests-entry.js', './lib'],
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.xml$/i,
        use: 'raw-loader'
      },
      { test: /\.ts(x?)$/, loader: 'ts-loader' },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  watchOptions: {
    ignored: /node_modules/
  },
  output: {
    filename: 'zenobia-test-bundle.js',
    sourceMapFilename: 'zenobia-test-bundle.js.map',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs'
  }
};
